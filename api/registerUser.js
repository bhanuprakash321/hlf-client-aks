'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const yaml = require("js-yaml");
let ccp = null;

async function register(user, org) {
    try {
        const mspId = `${org}MSP`;
        const caName = `${org.toLowerCase()}-ca.${org.toLowerCase()}`;
        const ccpPath = path.resolve(__dirname, "connection-org.yaml");
        if (ccpPath.includes(".yaml")) {
            ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));
        } else {
            ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
        }

        const caInfo = ccp.certificateAuthorities[caName];
        const caURL = caInfo.url;
        const ca = new FabricCAServices(caURL);

        const walletPath = path.join(process.cwd(), 'wallet', org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const userIdentity = await wallet.get(user);
        if (userIdentity) {
            console.log(`An identity for the user ${user} already exists in the wallet`);
            return;
        }

        const adminIdentity = await wallet.get('enroll');
        if (!adminIdentity) {
            console.log('An identity for the admin user "enroll" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const secret = await ca.register({
            enrollmentID: user,
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: user,
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspId,
            type: 'X.509',
        };
        await wallet.put(user, x509Identity);
        console.log(`Successfully registered and enrolled enroll user "${user}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user "${user}": ${error}`);
        process.exit(1);
    }
}
//  register("bhanu", "Org1");
module.exports = register;