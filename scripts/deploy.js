const { ethers, run } = require("hardhat");

//variables need to be initialized prior to deployment
const CLIENT_VERSION;
const BIDDING_DURATION;
const REVEAL_DURATION;

async function main() {

  await run("compile");
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const MorphwareTokenFactory = await ethers.getContractFactory(
    "MorphwareToken"
  );
  const morphwareToken = await MorphwareTokenFactory.deploy();
  await morphwareToken.deployed();
  console.log(`Morphware Token: ${morphwareToken.address}`);

  const VickreyAuctionFactory = await ethers.getContractFactory(
    "VickreyAuction"
  );
  const vickreyAuction = await VickreyAuctionFactory.deploy(
    morphwareToken.address
  );
  await vickreyAuction.deployed();
  console.log(`Vickrey Auction: ${vickreyAuction.address}`);

  const JobFactory = await ethers.getContractFactory("JobFactor");
  const jobFactory = await JobFactory.deploy(
    morphwareToken.address,
    vickreyAuction.address
  );
  await jobFactory.deployed();
  console.log(`Job Factory: ${jobFactory.address}`);

    const RegistryFactory = await ethers.getContractFactory("Registry");
    const registryFactory = await RegistryFactory.deploy(
      vickreyAuction.address,
      CLIENT_VERSION,
      jobFactory.address,
      BIDDING_DURATION,
      REVEAL_DURATION
    );
    await registryFactory.deployed();
    console.log(`Registry: ${registryFactory.address}`);

  console.log("Waiting to verify...");
  await new Promise((r) => setTimeout(r, 60000));

  console.log("Verifying...");
  await run("verify:verify", {
    address: morphwareToken.address,
    constructorArguments: [],
  });
  await run("verify:verify", {
    address: vickreyAuction.address,
    constructorArguments: [morphwareToken.address],
  });
  await run("verify:verify", {
    address: jobFactory.address,
    constructorArguments: [morphwareToken.address, vickreyAuction.address],
  });
  await run("verify:verify", {
    address: registryFactory.address,
    constructorArguments: [
        vickreyAuction.address, 
        CLIENT_VERSION, 
        jobFactory.address, 
        BIDDING_DURATION, 
        REVEAL_DURATION
    ],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
