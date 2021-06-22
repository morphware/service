const JobFactory     = artifacts.require('JobFactory');
const MorphwareToken = artifacts.require('MorphwareToken');
const VickreyAuction = artifacts.require('VickreyAuction');

const utils = require('./helpers/utils');

/*
    Functions to test:
    0 postJobDescription
    O shareUntrainedModelAndTrainingDataset
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

    it('should be able to post a job description', async () => {
        const estimatedTrainingTimeArg = 8;
        const trainingDatasetSizeArg   = 1024;
        const targetErrorRateArg       = 9;
        const minimumPayoutArg         = 10;
        const biddingTimeSpanArg       = 600;
        const revealTimeSpanArg        = 60;
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

})
