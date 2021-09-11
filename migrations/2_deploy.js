// migrations/2_deploy.js

//const MorphwareToken = artifacts.require("./MorphwareToken.sol");
const JobFactory     = artifacts.require("./JobFactory.sol");
const VickreyAuction = artifacts.require("./VickreyAuction.sol");

// Note: Ropsten settings below
module.exports = async function(deployer) {
    //await deployer.deploy(MorphwareToken);
    await deployer.deploy(VickreyAuction,"0xbc40e97e6d665ce77e784349293d716b030711bc");
    await deployer.deploy(JobFactory,"0xbc40e97e6d665ce77e784349293d716b030711bc",VickreyAuction.address);
};
