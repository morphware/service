// SPDX-License-Identifier: GPL-3.0
// vim: noai:ts=4:sw=4

pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

// TODO Review all usage of `public`
// TODO Optimize storage writes with memory

contract VickreyAuction {

    /**
    * @notice Used to notify the end of an auction
   */ 
    event AuctionEnded(
        address indexed endUser,
        uint auctionId,
        address winner, 
        uint secondHighestBid
    );
  /**
   * @notice Used to notify that a bid was placed
   */
    event BidPlaced(
        address indexed endUser,
        uint indexed auctionId,
        address indexed bidder
    );
  /**
   * @notice Used to notify that a worker node was paid for a job
   */
    event PaidOut(
        address indexed endUser,
        uint indexed auctionId,
        uint amount
    );

    enum Status {
        isActive,
        isEndedButNotPaid,
        isEndedAndPaid
    }

    struct Bid {
        bytes32 blindedBid;
        address jobPoster;
        uint auctionId;
        uint deposit;
    }

    struct Auction {
        uint minimumPayout;
        uint reward;
        uint biddingDeadline;
        uint revealDeadline;
        uint bidsPlaced;
        uint highestBid;
        uint secondHighestBid;
        address highestBidder;
        Status status;
    }

    //mapping of data scientist / job poster to auction
    mapping(address => Auction[]) public auctions;
    
    //mapping of bid hash to bid
    mapping(bytes32 => Bid) private bids;

    //mapping of account to num of stale bids
    mapping(address => uint) private staleBids;

    //instance of Morphware token
    IERC20 public token;

    //address of Job Factory
    address public jobFactory; 

    error TooEarly(uint time);
    error TooLate(uint time);
    error AuctionEndAlreadyCalled();
    error DoesNotMatchBlindedBid();
    error NotJobFactory();

    //modifier to prevent bids before provided time
    modifier onlyBefore(uint _time) {
        if (block.timestamp >= _time) revert TooLate(_time);
        _;
    }

    //modifier to prevent bids after provided time
    modifier onlyAfter(uint _time) {
        if (block.timestamp <= _time) revert TooEarly(_time);
        _;
    }

    //modifier to ensure that the job factory is the caller/msg.sender
    modifier onlyJobFactory() {
        if (msg.sender != jobFactory) revert NotJobFactory();
    }

  /**
   * @notice Constructor
   * @param _token IERC20 Morphware token
   */
    constructor(
        IERC20 _token
    ) {
        token = _token;
        jobFactory = _jobFactory;
    }


    
  /**
   * @notice Starts auction
   * @dev This function is only ever called from the JobFactory contract
   * @param _minimumPayout uint minimum payout
   * @param _biddingDeadline uint biddin deadline
   * @param _revealDeadline uint reveal deadline
   * @param _reward uint reward
   * @param _endUser address data scientist/job poster
   */
    function start(
        uint _minimumPayout,
        uint _biddingDeadline,
        uint _revealDeadline,
        uint _reward,
        address _endUser
    )
        public
        onlyJobFactory
    {
        // FIXME 1 (continued)
        // Have end-user actually transfer the funds and then check that the reward amount is equal to it
        // NEED TO FIGURE OUT WHICH CONTRACT WILL HAVE CUSTODY OF DATA SCIENTIST'S FUNDS
        auctions[_endUser].push(Auction({
            minimumPayout: _minimumPayout,
            reward: _reward,
            biddingDeadline: _biddingDeadline,
            revealDeadline: _revealDeadline,
            bidsPlaced: 0,
            highestBid: 0,
            secondHighestBid: 0,
            highestBidder: _endUser,
            status: Status.isActive
        }));
    }

  /**
   * @notice Bid on auction
   * @dev This function is only ever called by a worker node
   * @param _endUser address data scientist/job poster
   * @param _auctionId uint auction ID
   * @param _blindedBid bytes32 blinded bid
   * @param _amount uint bid amount
   */
    function bid(
        address _endUser,
        uint _auctionId,
        bytes32 _blindedBid,
        uint _amount
    )
        public
        onlyBefore(auctions[_endUser][_auctionId].biddingDeadline)
    {
        // FIXME Later this should be less than the worker-specific reward
        require(_amount < auctions[_endUser][_auctionId].reward,'_amount must be less than reward');
        require(_amount > auctions[_endUser][_auctionId].minimumPayout,'_amount must be greater than minimumPayout');
        uint allowedAmount = token.allowance(msg.sender,address(this));
        require(allowedAmount >= _amount,'allowedAmount must be greater than or equal to _amount');
        // TODO  1.5 Re-factor `transferFrom` to eliminate gas costs?
        // NEED TO FIGURE OUT WHETHER WE WANT TO USE INTERNAL ACCOUNTING AND LET USERS WITHDRAW OR
        // IF WE WANT TO JUST USE TRANSFERFROM
        token.transferFrom(msg.sender,address(this),_amount);
        bids[keccak256(abi.encodePacked(_endUser,_auctionId,msg.sender))] = Bid({
            blindedBid: _blindedBid,
            deposit: _amount,
            jobPoster: _endUser,
            auctionId: _auctionId
        });
        emit BidPlaced(
            _endUser,
            _auctionId,
            msg.sender);
    }

  /**
   * @notice Reveals bids
   * @param _endUser address data scientist/job poster
   * @param _auctionId uint auction ID
   * @param _amount uint bid amount
   * @param _fake bool whether a bid is fake or not
   * @param _secret bytes32 bid secret
   */
    function reveal(
        address _endUser,
        uint _auctionId,
        uint _amount,
        bool _fake,
        bytes32 _secret
    )
        public
        onlyAfter(auctions[_endUser][_auctionId].biddingDeadline)
        onlyBefore(auctions[_endUser][_auctionId].revealDeadline)
    {
        Bid storage bidToCheck = bids[keccak256(abi.encodePacked(_endUser,_auctionId,msg.sender))];
        if (bidToCheck.jobPoster == _endUser && bidToCheck.auctionId == _auctionId) {
            uint refund;
            if (bidToCheck.blindedBid != keccak256(abi.encodePacked(_amount, _fake, _secret))) {
                revert DoesNotMatchBlindedBid();
            }
            refund += bidToCheck.deposit;
            if (!_fake && bidToCheck.deposit >= _amount) {
                if (placeBid(_endUser, _auctionId, msg.sender, _amount)) {
                    refund -= _amount;
                }
            }
            bidToCheck.blindedBid = bytes32(0);
            // TODO 1 Replace the `transfer` invocation with a safer alternative
            if (refund > 0) token.transfer(msg.sender,refund);
        }
    }

  /**
   * @notice Withdraw funds for stale bids
   */
    function withdraw() public {
        uint amount = staleBids[msg.sender];
        if (amount > 0) {
            staleBids[msg.sender] = 0;
            // TODO 1 Replace the `transfer` invocation with a safer alternative
            token.transfer(msg.sender,amount);
        }
    }

  /**
   * @notice Ends an auction
   * @param _endUser address data scientist/job poster
   * @param _auctionId uint auction ID
   */
    function auctionEnd(
        address _endUser,
        uint _auctionId
    )
        public
        onlyAfter(auctions[_endUser][_auctionId].revealDeadline)
    {
        if (auctions[_endUser][_auctionId].status == Status.isActive) revert AuctionEndAlreadyCalled();
        emit AuctionEnded(
            _endUser,
            _auctionId,
            auctions[_endUser][_auctionId].highestBidder,
            auctions[_endUser][_auctionId].secondHighestBid);
        auctions[_endUser][_auctionId].status = Status.isEndedButNotPaid;
    }

  /**
   * @notice Pays out auction winner
   * @dev This function is only ever called by a data scientist/job poster
   * @param _endUser address data scientist/job poster
   * @param _auctionId uint auction ID
   */
    function payout(
        address _endUser,
        uint _auctionId
    )
        public
    {
        require(auctions[_endUser][_auctionId].status != Status.isActive, 'VickreyAuction has not ended');
        require(auctions[_endUser][_auctionId].status != Status.isEndedAndPaid, 'VickreyAuction has been paid-out');
        if (auctions[_endUser][_auctionId].bidsPlaced == 0) {
            token.transfer(_endUser, auctions[_endUser][_auctionId].reward);
        } else {
            // TODO 1 Replace the `transfer` invocation with a safer alternative
            uint leftover = auctions[_endUser][_auctionId].highestBid - auctions[_endUser][_auctionId].secondHighestBid;
            // TODO n Does `auctions[_endUser][_auctionId].reward` need to be set to `0`, like `amount` is in other places?
            uint workerPay = leftover + auctions[_endUser][_auctionId].reward;
            // TODO 4 Optimize the `transfer` of `leftover` to `highestBidder`
            // TODO 1 Replace the `transfer` invocation with a safer alternative
            token.transfer(auctions[_endUser][_auctionId].highestBidder, workerPay);
            // possible 2nd transfer where 2nd highest bid amount needs to be transferred to the data scientist
            // reward - 2nd highest bid goes to the worker node
            // don't transfer to the data scientist if there's only been one bid
            emit PaidOut(
                _endUser,
                _auctionId,
                workerPay);
        }
        auctions[_endUser][_auctionId].status = Status.isEndedAndPaid;
    }

  /**
   * @notice Updates the job factory address
   * @param _newJobFactory new job factory address
   */

    function setJobFactory(address _newJobFactory) public onlyOwner {
        jobFactory = _newJobFactory;
    }

  /**
   * @notice Helper function to place bid
   * @dev This function is only ever called by the reveal function
   * @param _endUser address data scientist/job poster
   * @param _auctionId uint auction ID
   * @param _bidder address bidder
   * @param _amount uint bid amount
   */
    function placeBid(
        address _endUser,
        uint _auctionId,
        address _bidder,
        uint _amount
    )
        internal
        returns (bool success)
    {
        if (_amount <= auctions[_endUser][_auctionId].highestBid) {
            return false;
        }
        if (auctions[_endUser][_auctionId].highestBidder != address(0)) {
            address hb = auctions[_endUser][_auctionId].highestBidder;
            staleBids[hb] += auctions[_endUser][_auctionId].highestBid;
        }
        auctions[_endUser][_auctionId].secondHighestBid = auctions[_endUser][_auctionId].highestBid;
        auctions[_endUser][_auctionId].highestBid = _amount;
        auctions[_endUser][_auctionId].highestBidder = _bidder;
        auctions[_endUser][_auctionId].bidsPlaced += 1;
        return true;
    }
}
