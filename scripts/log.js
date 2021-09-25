// Before Posting Job, but after `redeploy.sh` ("bare necessities" to start demo.)

/// @dev Account 4 is a data scientist, and they want their ML workload to be run by someone on the network
/// @dev Account 1 is a gamer with a gaming rig, and they end-up winning the auction
morphwareToken = await MorphwareToken.deployed();

morphwareToken.transfer(accounts[4],400);

vickreyAuction = await VickreyAuction.deployed();

morphwareToken.transfer(vickreyAuction.address,100,{from:accounts[4]});

//morphwareToken.transfer(accounts[1],100);
morphwareToken.transfer(accounts[1],10000);

//morphwareToken.approve(vickreyAuction.address,12,{from:accounts[1]});
morphwareToken.approve(vickreyAuction.address,10000,{from:accounts[1]});

var endUserBalance = await morphwareToken.balanceOf(accounts[4]);
endUserBalance.toString();  // Should be equal to 300

// Beginnning of Bidding Phase

jobFactoryContract = await JobFactory.deployed();

morphwareToken.transfer(accounts[2],200);
morphwareToken.transfer(accounts[3],300);

morphwareToken.approve(vickreyAuction.address,23,{from:accounts[2]});
morphwareToken.approve(vickreyAuction.address,34,{from:accounts[3]});

vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(11,false,'0x6d6168616d000000000000000000000000000000000000000000000000000000')),11,{from:accounts[1]});
vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(22,false,'0x6e6168616d000000000000000000000000000000000000000000000000000000')),22,{from:accounts[2]});
vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(33,true,'0x6f6168616d000000000000000000000000000000000000000000000000000000')),33,{from:accounts[3]});

var auctionInstance = await vickreyAuction.auctions(accounts[4],0);
auctionInstance.biddingDeadline.toString();
auctionInstance.revealDeadline.toString();

// End of Bidding Phase
// Beginning of Revealing Phase

vickreyAuction.reveal(accounts[4],0,[11],[false],['0x6d6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[1]});
vickreyAuction.reveal(accounts[4],0,[22],[false],['0x6e6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[2]});
vickreyAuction.reveal(accounts[4],0,[33],[true],['0x6f6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[3]});

var lowestBidderBalance = await morphwareToken.balanceOf(accounts[1]);
lowestBidderBalance.toString();  // Should be equal to 89

vickreyAuction.withdraw({from:accounts[1]});

var lowestBidderBalance = await morphwareToken.balanceOf(accounts[1]);
lowestBidderBalance.toString();  // Should be equal to 100

var highestBidderBalance = await morphwareToken.balanceOf(accounts[2]);
highestBidderBalance.toString(); // Should be equal to 178

var fakeBidderBalance = await morphwareToken.balanceOf(accounts[3]);
fakeBidderBalance.toString();    // Should be equal to 300


// End of Revealing Phase

vickreyAuction.auctionEnd(accounts[4],0);

var endUserBalance = await morphwareToken.balanceOf(accounts[4]);
endUserBalance.toString();    // Should be equal to 300 (i.e., original-balance minus worker-reward)

var auctionContractBalance = await morphwareToken.balanceOf(vickreyAuction.address);
auctionContractBalance.toString();     // Should be equal to 122 (i.e., worker-reward plus the highest-bid)

vickreyAuction.payout(accounts[4],0);

var auctionContractBalance = await morphwareToken.balanceOf(vickreyAuction.address);
auctionContractBalance.toString();     // Should equal to 0 (i.e., worker-reward)

var endUserBalance = await morphwareToken.balanceOf(accounts[4]);
endUserBalance.toString();    // Was equal to 311

var highestBidderBalance = await morphwareToken.balanceOf(accounts[2]);
highestBidderBalance.toString(); // Was equal to 289
