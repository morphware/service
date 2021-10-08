const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry", () => {
  let deployer, registry;

  before(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    const RegistryFactory = await ethers.getContractFactory("Registry");
    registry = await RegistryFactory.deploy();
    await registry.deployed();
  });
  it("should be able to set the auction contract address", async () => {
    await registry.setAuctionContract(addr1.address);
    expect(await registry.auctionContract()).to.equal(addr1.address);
  });

  it("should be able to set the jobFactory contract address", async () => {
    await registry.setJobContract(addr2.address);
    expect(await registry.jobContract()).to.equal(addr2.address);
  });

  it("should be able to set the client version", async () => {
    await registry.setClientVersion("0.1.0");
    expect(await registry.clientVersion()).to.equal("0.1.0");
  });

  it("should be able to set the bidding duration", async () => {
    await registry.setBiddingDuration(120);
    expect(await registry.biddingDuration()).to.equal(120);
  });

  it("should be able to set the reveal duration", async () => {
    await registry.setRevealDuration(120);
    expect(await registry.revealDuration()).to.equal(120);
  });
});
