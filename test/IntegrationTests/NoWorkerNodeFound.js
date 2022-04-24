const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("No Worker For Auction", async () => {
  let deployer, morphwareToken, vickreyAuction, jobFactory;
  let auctionID;

  const posterBalance = "2000000000";

  const estimatedTrainingTime = 5;
  const trainingDatasetSize = 20;
  const targetErrorRate = 40;
  const minimumPayout = 5;
  const workerReward = "1000000000";
  const clientVersion = 1;

  before(async () => {
    [
      deployer,
      poster,
      worker1,
      worker2,
      validator,
      incorrectBidder,
      badActorWorker,
    ] = await ethers.getSigners();

    const MorphwareTokenFactory = await ethers.getContractFactory(
      "MorphwareToken"
    );
    morphwareToken = await MorphwareTokenFactory.deploy();

    const VickreyAuctionFactory = await ethers.getContractFactory(
      "VickreyAuction"
    );
    vickreyAuction = await VickreyAuctionFactory.deploy(morphwareToken.address);

    const JobFactoryFactory = await ethers.getContractFactory("JobFactory");
    jobFactory = await JobFactoryFactory.deploy(
      morphwareToken.address,
      vickreyAuction.address
    );

    await morphwareToken.transfer(poster.address, posterBalance);

    await morphwareToken.balanceOf(poster.address);
  });

  it("Can start an auction", async () => {
    await morphwareToken
      .connect(poster)
      .approve(vickreyAuction.address, workerReward);

    const tx = await jobFactory
      .connect(poster)
      .postJobDescription(
        estimatedTrainingTime,
        trainingDatasetSize,
        targetErrorRate,
        minimumPayout,
        workerReward,
        clientVersion
      );

    const { events } = await tx.wait();
    const args = events.pop().args;
    expect(args.jobPoster).to.equal(poster.address);
    expect(args.estimatedTrainingTime).to.equal(estimatedTrainingTime);
    expect(args.trainingDatasetSize).to.equal(trainingDatasetSize);
    expect(args.auctionAddress).to.equal(vickreyAuction.address);
    expect(args.id).to.equal(0);
    expect(args.workerReward).to.equal(workerReward);
    expect(args.clientVersion).to.equal(clientVersion);

    auctionID = args.id;
    let auctionData = await vickreyAuction.auctions(poster.address, 0);

    expect(auctionData[0]).to.equal(minimumPayout);
    expect(auctionData[1]).to.equal(workerReward);

    // Bids Placed
    expect(auctionData[4]).to.equal(0);
    // Highest Bid
    expect(auctionData[5]).to.equal(0);
    // Second Highest Bid
    expect(auctionData[6]).to.equal(0);
    //Highest Bidder
    expect(auctionData[7]).to.equal(poster.address);
    //Auction Status
    expect(auctionData[8]).to.equal(0);
  });

  it("Move into revealing period", async () => {
    //Wait for revealing period
    await network.provider.send("evm_increaseTime", [150]);
    await network.provider.send("evm_mine");
  });

  it("Move past revealing period", async () => {
    //Wait for revealing period
    await network.provider.send("evm_increaseTime", [220]);
    await network.provider.send("evm_mine");
  });

  it("Can end an auction with no worker bids", async () => {
    let tx1 = await vickreyAuction
      .connect(poster)
      .auctionEnd(poster.address, auctionID);

    let { events } = await tx1.wait();
    events = events.pop();
    const AuctionEnded = events.args;

    expect(events.event).to.equal("AuctionEnded");
    expect(AuctionEnded[0]).to.equal(poster.address);
    expect(AuctionEnded[1]).to.equal(auctionID);
    expect(AuctionEnded[2]).to.equal(poster.address);
    expect(AuctionEnded[3]).to.equal("0");
  });

  it("Withdraw job bounty when no workers found", async () => {
    const posterBalanceBN = BigNumber.from(posterBalance);
    await vickreyAuction.connect(poster).payout(poster.address, auctionID);

    const posterBalanceAfterWithdraw = await morphwareToken.balanceOf(
      poster.address
    );

    expect(posterBalanceAfterWithdraw).to.equal(posterBalanceBN);
  });
});
