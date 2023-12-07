const { Gateway, Wallets } = require("fabric-network");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
// const mspId = "Org1MSP";
const CC_NAME = "hlfnode03";
const CHANNEL = "testchannel";

let ccp = null;

// Load the network configuration
const ccpPath = path.resolve(__dirname, "connection-org.yaml");
if (ccpPath.includes(".yaml")) {
    ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));
} else {
    ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
}

async function connectToNetwork(user, org) {
    // const mspId = `${org}MSP`
    console.log(user, org)
    const walletPath = path.join(process.cwd(), "wallet", org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get(user);
    if (!identity) {
        throw new Error(`An identity for the user "${user}" does not exist in the wallet. Run the registerUser.js application before retrying.`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: user,
        discovery: { enabled: true, asLocalhost: false }
    });

    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CC_NAME);

    return { gateway, contract };
}

// connectToNetwork("bhanu", "Org1")

module.exports = connectToNetwork;