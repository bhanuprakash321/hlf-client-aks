const connectToNetwork = require('./utils');

async function addNewPatients(user, org, chikitsaID, abhaNo, patientName, age, gender, mobileNo, address) {
    try {
        const { gateway, contract } = await connectToNetwork(user, org);
        const result = await contract.submitTransaction('addNewPatients', chikitsaID, abhaNo, patientName, age, gender, mobileNo, address);
        console.log("Transaction has been submitted");
        gateway.disconnect();
        return result.toString();  // Convert Buffer to string
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function createAppointment(user, org, chikitsaID, department, doctorName, hospitalName) {
    try {
        const { gateway, contract } = await connectToNetwork(user, org);
        const result = await contract.submitTransaction('createAppointment', chikitsaID, department, doctorName, hospitalName);
        console.log("Transaction has been submitted");
        gateway.disconnect();
        return result.toString();  // Convert Buffer to string
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function addVitals(user, org, chikitsaID, bp, bloodoxygen, pulses, bodytemperature, bloodsugar) {
    try {
        const { gateway, contract } = await connectToNetwork(user, org);
        const result = await contract.submitTransaction('addVitals', chikitsaID, bp, bloodoxygen, pulses, bodytemperature, bloodsugar);
        console.log("Transaction has been submitted");
        gateway.disconnect();
        return result.toString();  // Convert Buffer to string
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

async function addVisit(user, org, chikitsaID, doctorName, description, diagnosis, prescriptionHash) {
    try {
        const { gateway, contract } = await connectToNetwork(user, org);
        const result = await contract.submitTransaction('addVisit', chikitsaID, doctorName, description, diagnosis, prescriptionHash);
        console.log("Transaction has been submitted");
        gateway.disconnect();
        return result.toString();  // Convert Buffer to string
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}


module.exports = {
    addNewPatients,
    createAppointment,
    addVitals,
    addVisit
};