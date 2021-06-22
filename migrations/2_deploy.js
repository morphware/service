// migrations/2_deploy.js

const MorphwareToken = artifacts.require("./MorphwareToken.sol");
const JobFactory     = artifacts.require("./JobFactory.sol");
const VickreyAuction = artifacts.require("./VickreyAuction.sol");

module.exports = async function(deployer) {
    await deployer.deploy(MorphwareToken);
    await deployer.deploy(VickreyAuction,MorphwareToken.address);
    await deployer.deploy(JobFactory,MorphwareToken.address,VickreyAuction.address);
};
/*
module.exports = async function(deployer) {
    await deployer.deploy(MorphwareToken).then(function() {
        return deployer.deploy(JobFactory)
    });
}
*/

/*
module.exports = async function(deployer) {
    await deployer.deploy(MorphwareToken).then(function() {
        return deployer.deploy(JobFactory,
            MorphwareToken.address,
            web3.utils.keccak256(web3.utils.encodePacked(
                'jupyterNotebookMagnetLink')),
            web3.utils.keccak256(web3.utils.encodePacked(
                'trainingDatasetMagnetLink')),
            web3.utils.keccak256(web3.utils.encodePacked(
                'testingDatasetMagnetLink')),
            28800,
            1,
            1,
            99,
            10,
            300,
            120,
            999,
            "0xd03ea8624C8C5987235048901fB614fDcA89b117")
    });
};
*/
