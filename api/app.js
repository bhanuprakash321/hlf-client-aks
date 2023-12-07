const express = require("express");

const dotenv = require("dotenv").config();

const morgan = require("morgan");

const cors = require('cors');
// const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({storage});
const register = require('./registerUser');
const enroll = require('./enrollAdmin');
const {
    addNewPatients,
    createAppointment,
    addVitals,
    addVisit
} = require('./invoke');

const { getPatients } = require('./query');

const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

const app = express();
const port = process.env.PORT || 4000;
app.use(morgan("dev"))
app.listen(port, ()=> {
    console.log(`Server is running on ${port}`);
});


const IPFS = require("ipfs-http-client")

//const ipfsClient: IPFSHTTPClient = create({ url: process.env.IPFS_API_URL });
//const { create } = require('ipfs-http-client');

// async function ipfsClient(){
   
//     const ipfs = await create(
//     {
//         host:'20.205.255.35',
//         port: '9095', 
//         protocol: "http",
        
//     }
//     );
//     return ipfs;
// }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.post('/enroll', async (req, res) => {
    try{
        const{org} = req.body;
        await enroll(org);
        res.send({status: "success", message: 'User enrolled Successfully '});
    }catch(e){
        console.log(e)
        const result = {
            status : 'error',
            message : "Failed to enroll user...",
            
        }
        res.status(500).send(result);
    }
});


app.post('/register', async (req, res) => {
    const{user, org} = req.body;
    try{
        await register(user, org);
        res.send({status:'success', message: `${user} is successfully registered` });
    }catch(e){
        const result ={
            status : "error",
            message: "Failed to register the user",
            error: e.message
        }
        res.status(500).send(result);
    }
});

// Endpoint to add new patients
app.post('/addNewPatients', async (req, res) => {
    const { user, org, chikitsaID, abhaNo, patientName, age, gender, mobileNo, address } = req.body;
    try{
    const patientObject = await addNewPatients(user, org, chikitsaID, abhaNo, patientName, age, gender, mobileNo, address);
    const result = JSON.parse(patientObject)
    res.send({status : "success", message: "Patient has been added Successfully...", data : result});
    }catch(e){
        let statusCode = 500; // Default to 500 for general errors
        let message = "Failed to add patient"; // Default error message

        // Check if the error is because the patient already exists
        if (e.message && e.message.includes("already exists")) {
            statusCode = 409; // Conflict status code for duplicate entry
            message = e.message; // Specific error message from the thrown error
        }
        const result = {
            status : "error",
            message : "Failed to add patient...",
            error : e.message
        }
        res.status(500).send(result);
    }
});

// Endpoint to create an appointment
app.post('/createAppointment', async (req, res) => {
    const { user, org, chikitsaID, department, doctorName, hospitalName } = req.body;
    console.log(req.body)

    try{
    const patientObject = await createAppointment(user, org, chikitsaID, department, doctorName, hospitalName);
    const result = JSON.parse(patientObject)
    res.send({status : "success", message: "Appoinment has been created Successfully...", data : result});
    }catch(e){
        const result = {
            status: "error",
            message: "failed to create appoinment...",
            error : e.message
        }
        res.status(500).send(result);
    }
});

// Endpoint to add vitals
app.post('/addVitals', async (req, res) => {
    const { user, org, chikitsaID, bp, bloodoxygen, pulses, bodytemperature, bloodsugar } = req.body;
    try{
    const patientObject = await addVitals(user, org, chikitsaID, bp, bloodoxygen, pulses, bodytemperature, bloodsugar);
    const result = JSON.parse(patientObject)
    res.send({status:"success", message: "Vitals has been added Successfully...", data: result});
    }catch(e){
        const result = {
            status: "error",
            message: "Failed to add Vitals",
            error: e.message
        }
        
        res.status(500).send(result);
    }
});

// Endpoint to add visit

app.post('/addVisit', async (req, res) => {
    const { user, org, chikitsaID, doctorName, description, diagnosis, hospitalId, appointmentId } = req.body;
    try {
        // AWS S3 Configuration
        const s3 = new AWS.S3();

        // Retrieve prescription data from S3
        const s3Params = {
            Bucket: "chikitsa-hip-hiu-tenants",
            Key: `chikitsa-hospital-${hospitalId}/appointment/uploads/${appointmentId}-prescription.pdf`,
        };

        const prescriptionDataBuffer = await s3.getObject(s3Params).promise();
        console.log(prescriptionDataBuffer)

        // Upload prescription data to IPFS
        
        const ipfs = new IPFS.create({ host: '20.198.184.142',port: '5001', protocol: 'http' });
        const ipfsResult = await ipfs.add(prescriptionDataBuffer.Body);
        const prescriptionHash = ipfsResult.cid.toString();


    const result = await addVisit(user, org, chikitsaID, doctorName, description, diagnosis, prescriptionHash);
    res.json({ status: "success", message: "Patient's Visits added Successfully...", data: result });
    }
    catch(e){
        console.log(e)
        const result = {
            status : "error",
            message : "Failed to add visit of the patient...",
            error : e.message
        }
        res.status(500).send(result);
    }
});



app.get('/getPatients/:user/:org/:chikitsaID', async (req, res) => {
    const { user, org, chikitsaID } = req.params;
    try {
        const patientDetailsString = await getPatients(user, org, chikitsaID);
        const patientDetails = JSON.parse(patientDetailsString);

        if (patientDetails.MedicalVisits && patientDetails.MedicalVisits.length > 0) {
            // Initialize an array to hold the IPFS gateway URLs and formatted timestamps
            const ipfsUrls = [];

            for (const visit of patientDetails.MedicalVisits) {
                // Format the timestamp
                const timestamp = visit.Date;
                const formattedTimestamp = new Date(timestamp.seconds.low * 1000 + timestamp.nanos / 1e6)
                    .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

                // Define the IPFS gateway URL
                const ipfsHash = visit.TestReport;
                const gatewayUrl = `20.198.184.142:5001/ipfs/${ipfsHash}`;

                // Add the formatted timestamp and IPFS gateway URL to the array
                ipfsUrls.push({
                    formattedTimestamp,
                    gatewayUrl,
                });
            }

            const result = {
                status: "success",
                message: "Patient's details have been fetched...",
                data: patientDetails,
                ipfsUrls: ipfsUrls,
            };

            res.send(result);
        } else {
            const result = {
                status: "success",
                message: "Patient's details have been fetched...",
                data: patientDetails,
            };
            res.send(result);
        }
    } catch (e) {
        console.log(e);
        const result = {
            status: "error",
            message: "Failed to get details for patients...",
            error: e.message,
        };
        res.status(500).send(result);
    }
});


module.exports = app;
