const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");
const Web3 = require("web3");
const { BigNumber } = require("ethers");

describe("Complete E2E Workflow", async () => {
  let deployer, morphwareToken, vickreyAuction, jobFactory;
  let auctionID, worker1BlindedBid, worker2BlindedBid;

  const workerBalance = "2000000000";
  const posterBalance = "2000000000";

  const incorrectWorkerActorBalance = "10000000000";
  const worker1Bid = "900000";
  const worker2Bid = "1000000";

  const untrainedModelMagnetLink = "http://darshanwashere.com";
  const trainedModelMagnetLink = "http://darshanwashereAgain.com";
  const trainingDatasetMagnetLink = "http://darshanwashereAndAgain.com";
  const testingDatasetMagnetLink = "http://darshanwashereOnceMore.com";

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

    await morphwareToken.transfer(worker1.address, workerBalance);
    await morphwareToken.transfer(worker2.address, workerBalance);
    await morphwareToken.transfer(poster.address, posterBalance);
    await morphwareToken.transfer(
      incorrectBidder.address,
      incorrectWorkerActorBalance
    );
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

  it("Cannot bid more than the reward", async () => {
    const incorrectBid = "1000000001";

    await morphwareToken
      .connect(incorrectBidder)
      .approve(vickreyAuction.address, incorrectBid);

    const incorrectBlindedBid = {
      bidAmount: incorrectBid,
      fakeBid: false,
      secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    };

    const incorrectBlindedBidBytes = Web3.utils.keccak256(
      Web3.utils.encodePacked(
        incorrectBlindedBid.bidAmount,
        incorrectBlindedBid.fakeBid,
        incorrectBlindedBid.secret
      )
    );

    await expect(
      vickreyAuction
        .connect(worker1)
        .bid(poster.address, auctionID, incorrectBlindedBidBytes, incorrectBid)
    ).to.be.revertedWith("_amount must be less than reward");

    await morphwareToken
      .connect(incorrectBidder)
      .approve(vickreyAuction.address, "0");
  });

  it("Cannot bid less than the minimum reward", async () => {
    const incorrectBid = "4";

    const incorrectBlindedBid = {
      bidAmount: incorrectBid,
      fakeBid: false,
      secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    };

    const incorrectBlindedBidBytes = Web3.utils.keccak256(
      Web3.utils.encodePacked(
        incorrectBlindedBid.bidAmount,
        incorrectBlindedBid.fakeBid,
        incorrectBlindedBid.secret
      )
    );

    await expect(
      vickreyAuction
        .connect(worker1)
        .bid(poster.address, auctionID, incorrectBlindedBidBytes, incorrectBid)
    ).to.be.revertedWith("_amount must be greater than minimumPayout");
  });

  it("Cannot bid more than allowance", async () => {
    const incorrectBid = "1000000";
    const allowance = 0;

    await morphwareToken
      .connect(incorrectBidder)
      .approve(vickreyAuction.address, allowance);

    const incorrectBlindedBid = {
      bidAmount: incorrectBid,
      fakeBid: false,
      secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    };

    const incorrectBlindedBidBytes = Web3.utils.keccak256(
      Web3.utils.encodePacked(
        incorrectBlindedBid.bidAmount,
        incorrectBlindedBid.fakeBid,
        incorrectBlindedBid.secret
      )
    );

    await expect(
      vickreyAuction
        .connect(worker1)
        .bid(poster.address, auctionID, incorrectBlindedBidBytes, incorrectBid)
    ).to.be.revertedWith(
      "allowedAmount must be greater than or equal to _amount"
    );
  });

  it("Can bid on an auction", async () => {
    // The Daemon approves the MWT to bid on the auction
    await morphwareToken
      .connect(worker1)
      .approve(vickreyAuction.address, worker1Bid);
    await morphwareToken
      .connect(worker2)
      .approve(vickreyAuction.address, worker2Bid);

    worker1BlindedBid = {
      bidAmount: worker1Bid,
      fakeBid: false,
      secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    };

    worker2BlindedBid = {
      bidAmount: worker2Bid,
      fakeBid: false,
      secret: `0x${crypto.randomBytes(32).toString("hex")}`,
    };

    const worker1BlindedBidBytes = Web3.utils.keccak256(
      Web3.utils.encodePacked(
        worker1BlindedBid.bidAmount,
        worker1BlindedBid.fakeBid,
        worker1BlindedBid.secret
      )
    );

    const worker2BlindedBidBytes = Web3.utils.keccak256(
      Web3.utils.encodePacked(
        worker2BlindedBid.bidAmount,
        worker2BlindedBid.fakeBid,
        worker2BlindedBid.secret
      )
    );

    let tx1 = await vickreyAuction
      .connect(worker1)
      .bid(poster.address, auctionID, worker1BlindedBidBytes, worker1Bid);

    let tx2 = await vickreyAuction
      .connect(worker2)
      .bid(poster.address, auctionID, worker2BlindedBidBytes, worker2Bid);

    let { events: events1 } = await tx1.wait();
    let { events: events2 } = await tx2.wait();

    let bidPlaced1 = events1.pop().args;
    let bidPlaced2 = events2.pop().args;

    expect(bidPlaced1[0]).to.equal(poster.address);
    expect(bidPlaced1[1]).to.equal(auctionID);
    expect(bidPlaced1[2]).to.equal(worker1.address);

    expect(bidPlaced2[0]).to.equal(poster.address);
    expect(bidPlaced2[1]).to.equal(auctionID);
    expect(bidPlaced2[2]).to.equal(worker2.address);

    const initialWorkerBalance = BigNumber.from(workerBalance);
    const worker1Balance = await morphwareToken.balanceOf(worker1.address);
    const worker2Balance = await morphwareToken.balanceOf(worker2.address);
    const worker1BidBN = BigNumber.from(worker1Bid);
    const worker2BidBN = BigNumber.from(worker2Bid);

    expect(initialWorkerBalance.sub(worker1BidBN)).to.equal(worker1Balance);
    expect(initialWorkerBalance.sub(worker2BidBN)).to.equal(worker2Balance);
  });

  it("Cannot reveal during bidding period", async () => {
    await expect(
      vickreyAuction
        .connect(worker1)
        .reveal(
          poster.address,
          auctionID,
          worker1BlindedBid.bidAmount,
          worker1BlindedBid.fakeBid,
          worker1BlindedBid.secret
        )
    ).to.be.revertedWith("TooEarly");
  });

  it("Move into revealing period", async () => {
    //Wait for revealing period
    await network.provider.send("evm_increaseTime", [150]);
    await network.provider.send("evm_mine");
  });

  it("Cannot reveal with incorrect bid details", async () => {
    await expect(
      vickreyAuction
        .connect(worker1)
        .reveal(
          poster.address,
          auctionID,
          worker1BlindedBid.bidAmount,
          worker1BlindedBid.fakeBid,
          `0x${crypto.randomBytes(32).toString("hex")}`
        )
    ).to.be.revertedWith("DoesNotMatchBlindedBid");

    await expect(
      vickreyAuction
        .connect(worker2)
        .reveal(
          poster.address,
          auctionID,
          worker2BlindedBid.bidAmount,
          worker2BlindedBid.fakeBid,
          `0x${crypto.randomBytes(32).toString("hex")}`
        )
    ).to.be.revertedWith("DoesNotMatchBlindedBid");
  });

  it("Cannot reveal another worker nodes bid", async () => {
    await expect(
      vickreyAuction
        .connect(worker1)
        .reveal(
          poster.address,
          auctionID,
          worker2BlindedBid.bidAmount,
          worker2BlindedBid.fakeBid,
          worker2BlindedBid.secret
        )
    ).to.be.revertedWith("DoesNotMatchBlindedBid");
  });

  it("Can reveal a bid", async () => {
    let tx1 = await vickreyAuction
      .connect(worker1)
      .reveal(
        poster.address,
        auctionID,
        worker1BlindedBid.bidAmount,
        worker1BlindedBid.fakeBid,
        worker1BlindedBid.secret
      );

    let { events: events1 } = await tx1.wait();

    let tx2 = await vickreyAuction
      .connect(worker2)
      .reveal(
        poster.address,
        auctionID,
        worker2BlindedBid.bidAmount,
        worker2BlindedBid.fakeBid,
        worker2BlindedBid.secret
      );

    let { events: events2 } = await tx1.wait();
  });

  it("Cannot reveal the same bid twice", async () => {
    await expect(
      vickreyAuction
        .connect(worker1)
        .reveal(
          poster.address,
          auctionID,
          worker2BlindedBid.bidAmount,
          worker2BlindedBid.fakeBid,
          worker2BlindedBid.secret
        )
    ).to.be.revertedWith("DoesNotMatchBlindedBid");
  });

  it("Cannot end an auction during revealing period", async () => {
    await expect(
      vickreyAuction.connect(poster).auctionEnd(poster.address, auctionID)
    ).to.be.revertedWith("TooEarly");
  });

  it("Move past revealing period", async () => {
    //Wait for revealing period
    await network.provider.send("evm_increaseTime", [220]);
    await network.provider.send("evm_mine");
  });

  it("Cannot call payout if auction has not ended", async () => {
    await expect(
      vickreyAuction.connect(poster).payout(poster.address, auctionID)
    ).to.be.revertedWith("VickreyAuction has not ended");
  });

  it("Can end an auction", async () => {
    let tx1 = await vickreyAuction
      .connect(poster)
      .auctionEnd(poster.address, auctionID);

    let { events } = await tx1.wait();
    events = events.pop();
    const AuctionEnded = events.args;

    expect(events.event).to.equal("AuctionEnded");
    expect(AuctionEnded[0]).to.equal(poster.address);
    expect(AuctionEnded[1]).to.equal(auctionID);
    expect(AuctionEnded[2]).to.equal(worker2.address);
    expect(AuctionEnded[3]).to.equal(worker1Bid);
  });

  it("Cannot end an auction twice", async () => {
    await expect(
      vickreyAuction.connect(poster).auctionEnd(poster.address, auctionID)
    ).to.be.revertedWith("AuctionEndAlreadyCalled");
  });

  it("Can witdhraw your bid if lose an auction", async () => {
    const balanceBeforeWitdhraw = await morphwareToken.balanceOf(
      worker1.address
    );

    await vickreyAuction.connect(worker1).withdraw();

    const balanceAfterWithdraw = await morphwareToken.balanceOf(
      worker1.address
    );

    const worker1BidBN = BigNumber.from(worker1Bid);

    expect(balanceBeforeWitdhraw.add(worker1BidBN)).to.equal(
      balanceAfterWithdraw
    );
  });

  it("Cannot share trained model before untrained model is first shared.", async () => {
    await expect(
      jobFactory
        .connect(worker2)
        .shareTrainedModel(
          poster.address,
          auctionID,
          trainedModelMagnetLink,
          targetErrorRate
        )
    ).to.be.revertedWith("Worker Node has not yet been selected");
  });

  it("Can share the correct trainind data and untrained model", async () => {
    let tx1 = await jobFactory
      .connect(poster)
      .shareUntrainedModelAndTrainingDataset(
        auctionID,
        untrainedModelMagnetLink,
        trainingDatasetMagnetLink
      );

    let { events } = await tx1.wait();
    events = events.pop();
    const SharedUntrainedModelAndTraininDataset = events.args;

    expect(events.event).to.equal("UntrainedModelAndTrainingDatasetShared");
    expect(SharedUntrainedModelAndTraininDataset[0]).to.equal(poster.address);
    expect(SharedUntrainedModelAndTraininDataset[1]).to.equal(targetErrorRate);
    expect(SharedUntrainedModelAndTraininDataset[2]).to.equal(worker2.address);
    expect(SharedUntrainedModelAndTraininDataset[3]).to.equal(auctionID);
    expect(SharedUntrainedModelAndTraininDataset[4]).to.equal(
      untrainedModelMagnetLink
    );
    expect(SharedUntrainedModelAndTraininDataset[5]).to.equal(
      trainingDatasetMagnetLink
    );
  });

  it("A rogue worker node cannot share the trained model", async () => {
    await expect(
      jobFactory
        .connect(badActorWorker)
        .shareTrainedModel(
          poster.address,
          auctionID,
          trainedModelMagnetLink,
          targetErrorRate
        )
    ).to.be.revertedWith("msg.sender must equal workerNode");
  });

  it("Cannot share testing data before trained model shared", async () => {
    await expect(
      jobFactory
        .connect(poster)
        .shareTestingDataset(
          auctionID,
          trainedModelMagnetLink,
          testingDatasetMagnetLink
        )
    ).to.be.revertedWith("Trained model has not been shared");
  });

  it("A worker can share the trained model", async () => {
    const tx = await jobFactory
      .connect(worker2)
      .shareTrainedModel(
        poster.address,
        auctionID,
        trainedModelMagnetLink,
        targetErrorRate
      );

    let { events } = await tx.wait();
    let event = events.pop();
    let shareTrainedModel = event.args;

    expect(event.event).to.equal("TrainedModelShared");
    expect(shareTrainedModel[0]).to.equal(poster.address);
    expect(shareTrainedModel[1]).to.equal(targetErrorRate);
    expect(shareTrainedModel[2]).to.equal(worker2.address);
    expect(shareTrainedModel[3]).to.equal(auctionID);
    expect(shareTrainedModel[4]).to.equal(trainedModelMagnetLink);
  });

  it("Cannot approva a job before testing dataset has been shared", async () => {
    await expect(
      jobFactory
        .connect(validator)
        .approveJob(poster.address, auctionID, trainedModelMagnetLink)
    ).to.be.revertedWith("Testing dataset has not been shared");
  });

  it("Poster can share testing data", async () => {
    const tx = await jobFactory
      .connect(poster)
      .shareTestingDataset(
        auctionID,
        trainedModelMagnetLink,
        testingDatasetMagnetLink
      );

    let { events } = await tx.wait();
    events = events.pop();
    const TestingDatasetShared = events.args;

    expect(events.event).to.equal("TestingDatasetShared");
    expect(TestingDatasetShared[0]).to.equal(poster.address);
    expect(TestingDatasetShared[1]).to.equal(targetErrorRate);
    expect(TestingDatasetShared[2]).to.equal(auctionID);
    expect(TestingDatasetShared[3]).to.equal(trainedModelMagnetLink);
    expect(TestingDatasetShared[4]).to.equal(testingDatasetMagnetLink);
  });

  it("Worker node cannot validate the job", async () => {
    await expect(
      jobFactory
        .connect(worker2)
        .approveJob(poster.address, auctionID, trainedModelMagnetLink)
    ).to.be.revertedWith("msg.sender cannot equal workerNode");
  });

  it("Validator can approve the job", async () => {
    const tx = await jobFactory
      .connect(validator)
      .approveJob(poster.address, auctionID, trainedModelMagnetLink);

    let { events } = await tx.wait();
    events = events.pop();
    const JobApproved = events.args;
    expect(JobApproved[0]).to.equal(poster.address);
    expect(JobApproved[1]).to.equal(worker2.address);
    expect(JobApproved[2]).to.equal(validator.address);
    expect(JobApproved[3]).to.equal(trainedModelMagnetLink);
    expect(JobApproved[4]).to.equal(auctionID);
  });

  //TODO No mechanism for this
  it("Validator can reject the job", async () => {});

  it("Data Scientist can payout the worker node and recieve leftover bounty", async () => {
    const workerBalanceBefore = await morphwareToken.balanceOf(worker2.address);
    const posterBalanceBefore = await morphwareToken.balanceOf(poster.address);

    const tx = await vickreyAuction
      .connect(poster)
      .payout(poster.address, auctionID);

    let { events } = await tx.wait();
    events = events.pop();
    const JobApproved = events.args;

    const posterBalanceInitial = BigNumber.from(posterBalance);
    const worker1BidBN = BigNumber.from(worker1Bid);
    const worker2BidBN = BigNumber.from(worker2Bid);
    const workerPay = worker2BidBN.add(worker1BidBN);

    expect(JobApproved[0]).to.equal(poster.address);
    expect(JobApproved[1]).to.equal(auctionID);
    expect(JobApproved[2]).to.equal(workerPay.toString());

    const workerBalanceAfter = await morphwareToken.balanceOf(worker2.address);
    const posterBalanceAfter = await morphwareToken.balanceOf(poster.address);

    expect(workerBalanceAfter.sub(workerBalanceBefore)).to.equal(workerPay);
    expect(posterBalanceInitial.sub(worker1BidBN)).to.equal(posterBalanceAfter);
  });

  it("Cannot call payout twice", async () => {
    await expect(
      vickreyAuction.connect(poster).payout(poster.address, auctionID)
    ).to.be.revertedWith("VickreyAuction has been paid-out");
  });
});
