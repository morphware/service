const JobFactory     = artifacts.require('JobFactory');
const MorphwareToken = artifacts.require('MorphwareToken');
const VickreyAuction = artifacts.require('VickreyAuction');

const utils = require('./helpers/utils');

/*
    Functions to test:
    0 postJobDescription
    0 shareUntrainedModelAndTrainingDataset
    O shareTrainedModel
    O approveJob
*/

contract('JobFactory', (accounts) => {

    let [morphwareProject, lowestBidder, workerNode, badActor, dataScientist] = accounts;

    let morphwareToken;
    let vickreyAuction;
    let jobFactory;

    beforeEach(async () => {
        morphwareToken = await MorphwareToken.new();
        vickreyAuction = await VickreyAuction.new(morphwareToken.address);
        jobFactory     = await JobFactory.new(morphwareToken.address,vickreyAuction.address);
    });

    /* TODO
    afterEach(async () => {
        await contractInstance.kill();
    });
    */


    // postJobDescription /////////////////////////////////////////////////////

    it('should be able to post a job description', async () => {
        const estimatedTrainingTimeArg = 8;
        const trainingDatasetSizeArg   = 1024;
        const targetErrorRateArg       = 9;
        const minimumPayoutArg         = 10;
        const currentTimestamp         = Math.floor(new Date().getTime() / 1000)
        const biddingTimeSpanArg       = currentTimestamp + 600;
        const revealTimeSpanArg        = biddingTimeSpanArg + 30;

        // TEST
        console.log(currentTimestamp);
        console.log(biddingTimeSpanArg);
        console.log(revealTimeSpanArg);

        const workerRewardArg          = 100;
        const result = await jobFactory.postJobDescription(
                        estimatedTrainingTimeArg,
                        trainingDatasetSizeArg,
                        targetErrorRateArg,
                        minimumPayoutArg,
                        biddingTimeSpanArg,
                        revealTimeSpanArg,
                        workerRewardArg,
                        {from: dataScientist});
        assert.equal(result.logs[0].args.jobPoster, dataScientist);
        assert.equal(result.logs[0].args.id, 0);
        assert.equal(result.logs[0].args.auctionAddress, vickreyAuction.address);
        assert.equal(result.logs[0].args.estimatedTrainingTime, estimatedTrainingTimeArg);
        assert.equal(result.logs[0].args.trainingDatasetSize, trainingDatasetSizeArg);
        assert.equal(result.logs[0].args.workerReward, workerRewardArg);
    })

    /* TODO
    it("should not...", async () => {
        await jobFactory.postJobDescription
        await utils.shouldThrow(jobFactory.postJobDescription
    })
    */


    // shareUntrainedModelAndTrainingDataset //////////////////////////////////

    const padding = '0x000000000000000000000000';

    it('should be able to share an untrained model and training dataset', async () => {
        const estimatedTrainingTimeArg = 8;
        const trainingDatasetSizeArg   = 1024;
        const targetErrorRateArg       = 9;
        const minimumPayoutArg         = 10;
        const currentTimestamp         = Math.floor(new Date().getTime() / 1000)
        const biddingTimeSpanArg       = currentTimestamp + 600;
        const revealTimeSpanArg        = biddingTimeSpanArg + 30;

        // TEST
        console.log(currentTimestamp);
        console.log(biddingTimeSpanArg);
        console.log(revealTimeSpanArg);

        const workerRewardArg          = 100;
        let result = await jobFactory.postJobDescription(
                        estimatedTrainingTimeArg,
                        trainingDatasetSizeArg,
                        targetErrorRateArg,
                        minimumPayoutArg,
                        biddingTimeSpanArg,
                        revealTimeSpanArg,
                        workerRewardArg,
                        {from: dataScientist});

        const jobPosterArg                 = dataScientist;
        const idArg                        = 0;
        const untrainedModelMagnetLinkArg  = padding + '4fd0d60d0dec15eca14e50fbd725785293788643';
        const trainingDatasetMagnetLinkArg = padding + '44ce6a14a1b7d742accb427a42409dd24bb5fae1';
        result = await jobFactory.shareUntrainedModelAndTrainingDataset(
                        jobPosterArg,
                        idArg,
                        untrainedModelMagnetLinkArg,
                        trainingDatasetMagnetLinkArg,
                        {from: dataScientist});
        assert.equal(result.logs[0].args.jobPoster, dataScientist);
        assert.equal(result.logs[0].args.id, 0);
        // TODO Submit bid from `workerNode`, to make the following test pass
        // assert.equal(result.logs[0].args.workerNode, workerNode);
        assert.equal(result.logs[0].args.untrainedModelMagnetLink, untrainedModelMagnetLinkArg);
        assert.equal(result.logs[0].args.trainingDatasetMagnetLink, trainingDatasetMagnetLinkArg);
        // TODO Check against `targetErrorRate`, from `auctions` mapping
    })

    /* TODO
    it("should not...", async () => {
        await jobFactory.shareUntrainedModelAndTrainingDataset
        await utils.shouldThrow(jobFactory.shareUntrainedModelAndTrainingDataset
    })
    */


    // shareTrainedModel //////////////////////////////////////////////////////


    // approveJob //////////////////////////////////////////////////////


    // Sample param.: testDataMagnetLink'5e28b0b969bdcf72c9d52ba9ced31ba1a9db8dbf'

})
