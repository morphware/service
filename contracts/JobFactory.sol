// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.4;

import './IERC20.sol';
import './VickreyAuction.sol';

///@dev This implementation describes the following scenario,
///     for demonstration purposes:
//
///          `_jobPoster` --> `workerNode`
///          `_jobPoster` <-- `workerNode`
//
///      There are no `reviewerNodes`, in this use-case

///////////////////////////////////////////////////////////////////////////////
// Notes for elsewhere

/*
    Early stopping    - Vickrey Auction, using the SimpleAuction contract?
    Active monitoring - Micropayment channel?
*/

/* 
    `rewardSchedule` is currently thought to be either a:
    - Continuous Reward (TBA: worker is rewarded essentially for descending the gradient)
    - Variable Reward (Early Stopping; kind-of a Boolean pay-off structure: as workers will
        only be rewarded if they have reached a threshold-level of accuracy)
    - Fixed Interval Reward (Active Monitoring)
    - Fixed Ratio Reward (for validators(?); as they will verify a certain number of models
        over a period of time: even if the selection process for them is pseudo-random?)
    ...encoded as a `string` or a series of `bytes`
*/

/* 
    Implement a form of a reputation score that basically updates how off 
    a given `endUser`'s estimation is of their workload's training time 
*/
///////////////////////////////////////////////////////////////////////////////

contract JobFactory {

    VickreyAuction vickreyAuction;

    event JobDescriptionPosted(
        address indexed jobPoster,
        uint indexed id,
        address indexed auctionAddress,
        uint16 indexed estimatedTrainingTime,
        uint32 indexed trainingDatasetSize,
        uint indexed workerReward
    );

    event UntrainedModelAndTrainingDatasetShared(
        address indexed jobPoster,
        uint indexed id,
        address indexed workerNode,
        bytes32 untrainedModelMagnetLink,
        bytes32 trainingDatasetMagnetLink,
        uint64 targetErrorRate
    );

    event TrainedModelShared(
        address indexed jobPoster,
        uint indexed id,
        address indexed workerNode,
        bytes32 trainedModelMagnetLink,
        uint64 trainingErrorRate
    );

    event JobApproved(
        address indexed jobPoster,
        uint indexed id,
        address indexed workerNode
    );

    enum Status {
        PostedJobDescription,
        SharedUntrainedModelAndTrainingDataset,
        SharedTrainedModel,
        ApprovedJob
    }

    // TODO Struct packing
    struct Job {
        uint auctionId;
        Status status;
        uint64 targetErrorRate;
        address workerNode;
    }

    mapping (address => Job[]) public jobs;

    IERC20 public token;

    constructor(
        IERC20 _token,
        address auctionAddress
    ) {
        token = _token;
        vickreyAuction = VickreyAuction(auctionAddress);
    }

    /// @dev This is being called by `_jobPoster`
    //
    /// @notice `address(0)` is being passed to `Job` as a placeholder
    function postJobDescription(
        uint16 _estimatedTrainingTime,
        uint32 _trainingDatasetSize,
        uint64 _targetErrorRate,
        uint _minimumPayout,
        uint _biddingTimeSpan,
        uint _revealTimeSpan,
        uint _workerReward
    ) public {
        // FIXME
        uint jobId;
        /* if (jobs[msg.sender].auctionId != 0) {
            jobId = jobs[msg.sender].length - 1;
        } else {
            jobId = 0;
        } */
        jobId = jobs[msg.sender].length;
        vickreyAuction.start(
            _minimumPayout,
            _biddingTimeSpan,
            _revealTimeSpan,
            _workerReward,
            msg.sender);
        jobs[msg.sender].push(Job(
            jobId,
            Status.PostedJobDescription,
            _targetErrorRate,
            address(0)));
        emit JobDescriptionPosted(
            msg.sender,
            jobId,
            address(vickreyAuction),
            _estimatedTrainingTime,
            _trainingDatasetSize,
            _workerReward);
    }

    /// @dev This is being called by `_jobPoster`
    //
    /// @notice The untrained model and the training dataset have been encrypted
    ///         with the `workerNode` public key and `_jobPoster` private key
    function shareUntrainedModelAndTrainingDataset(
        address _jobPoster,
        uint _id,
        bytes32 _untrainedModelMagnetLink,
        bytes32 _trainingDatasetMagnetLink
    ) public {
        // FIXME require(vickreyAuction.ended(),'Auction has not ended');
        require(jobs[msg.sender][_id].status == Status.PostedJobDescription,'Job has not been posted');
        jobs[msg.sender][_id].status = Status.SharedUntrainedModelAndTrainingDataset;
        jobs[msg.sender][_id].workerNode = vickreyAuction.auctions(_jobPoster,_id).highestBidder();
        emit UntrainedModelAndTrainingDatasetShared(
            msg.sender,
            _id,
            jobs[msg.sender][_id].workerNode,
            _untrainedModelMagnetLink,
            _trainingDatasetMagnetLink,
            jobs[msg.sender][_id].targetErrorRate
        );
    }

    /// @dev This is being called by `workerNode`
    //
    /// @notice The trained model has been encrypted with the `_jobPoster`s
    ///         public key and `workerNode` private key
    function shareTrainedModel(
        address _jobPoster,
        uint _id,
        bytes32 _trainedModelMagnetLink,
        uint64 _trainingErrorRate
    ) public {
        require(msg.sender == jobs[_jobPoster][_id].workerNode,'msg.sender must equal workerNode');
        require(jobs[_jobPoster][_id].status == Status.PostedJobDescription,'Job has not been started');
        require(jobs[_jobPoster][_id].targetErrorRate >= _trainingErrorRate,'targetErrorRate must be greater or equal to _trainingErrorRate');
        jobs[_jobPoster][_id].status = Status.SharedTrainedModel;
        emit TrainedModelShared(
            _jobPoster,
            _id,
            msg.sender,
            _trainedModelMagnetLink,
            _trainingErrorRate
        );

    }

    /// @dev This is being called by `_jobPoster`
    function approveJob(
        address _jobPoster,
        uint _id
    ) public {
        require(jobs[_jobPoster][_id].status == Status.SharedTrainedModel,'Job has not been started');
        jobs[msg.sender][_id].status = Status.ApprovedJob;
        // FIXME
        //vickreyAuction.payout();
        emit JobApproved(
            msg.sender,
            _id,
            jobs[_jobPoster][_id].workerNode
        );
    }
}
