// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './VickreyAuction.sol';

/**
 * @title Morphware JobFactory
 * @notice Responsible for creating & storing jobs and sharing model/training data
 * @dev this implementation originally described the job poster <-> worker node, but now includes validator nodes
 */
contract JobFactory {
  /**
   * @notice Used to notify worker nodes of a new job
   */
    event JobDescriptionPosted(
        address jobPoster,
        uint16 estimatedTrainingTime,
        uint64 trainingDatasetSize,
        address auctionAddress,
        uint id,
        uint workerReward,
        uint biddingDeadline,
        uint revealDeadline,
        uint64 clientVersion
    );
  /**
   * @notice Used to share model and training data with auction winner
   */
    event UntrainedModelAndTrainingDatasetShared(
        address indexed jobPoster,
        uint64 targetErrorRate,
        address indexed workerNode,
        uint indexed id,
        string untrainedModelMagnetLink,
        string trainingDatasetMagnetLink
    );
  /**
   * @notice Used to share trained model data
   */
    event TrainedModelShared(
        address indexed jobPoster,
        uint64 trainingErrorRate,
        address indexed workerNode,
        uint indexed id,
        string trainedModelMagnetLink
    );
  /**
   * @notice Used to share testing data and trained model data for validator nodes
   */
    event TestingDatasetShared(
        address indexed jobPoster,
        uint64 targetErrorRate,
        uint indexed id,
        string trainedModelMagnetLink,
        string testingDatasetMagnetLink,
        string untrainedModelMagnetLink
    );
  /**
   * @notice Used to share that a model was validated
   */
    event JobApproved(
        address indexed jobPoster,
        address indexed workerNode,
        address indexed validatorNode,
        string trainedModelMagnetLink,
        uint id
    );

    enum Status {
        PostedJobDescription,
        SharedUntrainedModelAndTrainingDataset,
        SharedTrainedModel,
        SharedTestingDataset,
        ApprovedJob
    }
    
    enum AuctionStatus {
        isActive,
        isEndedButNotPaid,
        isEndedAndPaid
    }

    struct Job {
        uint auctionId;
        address workerNode;
        uint64 targetErrorRate;
        Status status;
        uint64  clientVersion;
    }

    //mapping of account to jobs
    mapping (address => Job[]) public jobs;

    //instance of Morphware token contract
    IERC20 public token;

    //instance of VickreyAuction contract
    VickreyAuction vickreyAuction;

  /**
   * @notice Constructor
   * @param _token IERC20 Morphware token
   * @param _auctionAddress address VickreyAuction contract
   */
    constructor(
        IERC20 _token,
        address _auctionAddress
    ) {
        token = _token;
        vickreyAuction = VickreyAuction(_auctionAddress);
    }

  /**
   * @notice Post job description (called by data scientist/job poster)
   * @param _estimatedTrainingTime uint16 estimated time to train model
   * @param _trainingDatasetSize uint64 size of dataset in bytes
   * @param _targetErrorRate uint64 target error rate
   * @param _minimumPayout uint minimum amount payed out to auction winner
   * @param _workerReward uint worker reward amount
   * @param _clientVersion uint64 client version
   */
    function postJobDescription(
        uint16 _estimatedTrainingTime,
        uint64 _trainingDatasetSize,
        uint64 _targetErrorRate,
        uint _minimumPayout,
        uint _workerReward,
        uint64 _clientVersion
    ) public {
        uint jobId = jobs[msg.sender].length;
        uint biddingDeadline = block.timestamp + 120;
        uint revealDeadline = block.timestamp + 240;

        vickreyAuction.start(
            _minimumPayout,
            biddingDeadline,
            revealDeadline,
            _workerReward,
            msg.sender);

        jobs[msg.sender].push(Job(
            jobId,
            address(0),
            _targetErrorRate,
            Status.PostedJobDescription,
            _clientVersion));

        emit JobDescriptionPosted(
            msg.sender,
            _estimatedTrainingTime,
            _trainingDatasetSize,
            address(vickreyAuction),
            jobId,
            _workerReward,
            biddingDeadline,
            revealDeadline,
            _clientVersion
        );
    }

  /**
   * @notice Share untrained model and training data (called by data scientist/job poster)
   * @dev The untrained model and the training dataset have been encrypted with the `workerNode` public key and `_jobPoster` private key
   * @param _id uint job (auction) ID
   * @param _untrainedModelMagnetLink string untrained model link
   * @param _trainingDatasetMagnetLink string training data link
   */
    function shareUntrainedModelAndTrainingDataset(
        uint _id,
        string memory _untrainedModelMagnetLink,
        string memory _trainingDatasetMagnetLink
    ) public {
        // FIXME require(vickreyAuction.ended(),'Auction has not ended');
        // Add check that auction has ended
        (,,,,,,, address workerNode, ) = vickreyAuction.auctions(msg.sender,_id);
        Job memory job = jobs[msg.sender][_id];
        require(job.status == Status.PostedJobDescription,'Job has not been posted');
        job.status = Status.SharedUntrainedModelAndTrainingDataset;
        job.workerNode = workerNode;
        jobs[msg.sender][_id] = job;
        //TODO GitHub Issue 77. Anybody can view these MagnetURI's. Possible security concern.
        emit UntrainedModelAndTrainingDatasetShared(
            msg.sender,
            job.targetErrorRate,
            workerNode,
            _id,
            _untrainedModelMagnetLink,
            _trainingDatasetMagnetLink
        );
    }


  /**
   * @notice Share trained model (called by worker node)
   * @dev The trained model has been encrypted with the `_jobPoster`s public key and `workerNode` private key
   * @param _jobPoster address data scientist's address
   * @param _id uint job ID
   * @param _trainedModelMagnetLink string trained model link
   * @param _trainingErrorRate uint64 training error rate
   */
    function shareTrainedModel(
        address _jobPoster,
        uint _id,
        string memory _trainedModelMagnetLink,
        uint64 _trainingErrorRate
    ) public {
        Job memory job = jobs[_jobPoster][_id];
        require(job.workerNode != address(0), 'Worker Node has not yet been selected');
        require(msg.sender == job.workerNode,'msg.sender must equal workerNode');
        require(job.status == Status.SharedUntrainedModelAndTrainingDataset,'Untrained model and training dataset has not been shared');
        require(job.targetErrorRate >= _trainingErrorRate,'targetErrorRate must be greater or equal to _trainingErrorRate');
        jobs[_jobPoster][_id].status = Status.SharedTrainedModel;
        emit TrainedModelShared(
            _jobPoster,
            _trainingErrorRate,
            msg.sender,
            _id,
            _trainedModelMagnetLink
        );
    }

  /**
   * @notice Share testing data (called by data scientist/job poster)
   * @notice The trained model has been encrypted with the `_jobPoster`s public key and `workerNode` private key
   * @param _id uint job ID
   * @param _trainedModelMagnetLink string trained model link
   * @param _testingDatasetMagnetLink string testing data link
   */
    function shareTestingDataset(
        uint _id,
        string memory _trainedModelMagnetLink,
        string memory _testingDatasetMagnetLink,
        string memory _untrainedModelMagnetLink
    ) public {
        Job memory job = jobs[msg.sender][_id];
        require(job.status == Status.SharedTrainedModel,'Trained model has not been shared');
        jobs[msg.sender][_id].status = Status.SharedTestingDataset;
        emit TestingDatasetShared(
            msg.sender,
            job.targetErrorRate,
            _id,
            _trainedModelMagnetLink,
            _testingDatasetMagnetLink,
            _untrainedModelMagnetLink
        );
    }

  /**
   * @notice Approve job (called by validator node)
   * @param _jobPoster address data scientist's address
   * @param _id uint job (auction) ID
   * @param _trainedModelMagnetLink string trained model link
   */
    function approveJob(
        address _jobPoster,
        uint _id,
        string memory _trainedModelMagnetLink
    ) public {
        Job memory job = jobs[_jobPoster][_id];
        require(msg.sender != job.workerNode,'msg.sender cannot equal workerNode');
        require(job.status == Status.SharedTestingDataset,'Testing dataset has not been shared');
        jobs[_jobPoster][_id].status = Status.ApprovedJob;
        // TODO Possible cruft below
        // FIXME
        // figure out if we want payout to be done here or in the daemon
        //vickreyAuction.payout(_jobPoster,_id);
        emit JobApproved(
            _jobPoster,
            job.workerNode,
            msg.sender,
            _trainedModelMagnetLink,
            _id            
        );
    }
}
