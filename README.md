# Morphware: Service

## Description

`service` contains the smart contracts that are not directly related to
Morphware Token (i.e., `../token`).

`JobFactory` is handles the majority of interaction with `../daemon`,
while `VickreyAuction` is solely focused on the job auction-process.

## Installation

This section is currently limited to Linux.

### Linux

This section is currently limited to Ubuntu 20.04.

#### Ubuntu 20.04

Install NodeJS dependencies:

`npm install`

## Usage

This development scenario migrates two smart contracts, `JobFactory`
and `AuctionFactory`, to a local blockchain.  For ease of development,
the wallet and contract addresses do not change.

Note: this development scenario does not incorporate a validator-node,
and `AuctionFactory` should be read as `VickreyAuction`.

The following background information should also be taken into account,
for the sake of clarity:

- `accounts[4]` is the wallet address of a data scientist. Within the
scope of this development scenario, `accounts[4]` represents someone 
who wants their machine learning workload to be run by someone else.

- `accounts[1]` is the wallet address of a candidate worker-node, which
should have a dedicated graphics card with a yet-to-be-defined number
of CUDA cores available.  Within the scope of this development
scenario, it loses the auction.

- `accounts[2]` is the wallet address of another candidate worker-node.
Within the scope of this development scenario, it wins the auction.

- `accounts[3]` is the wallet address of a bad actor, which represents
itself as a candidate worker-node. Within the scope of this development
scenario, it loses the auction. It's utility, within the scope of this
development scenario, is to highlight the reason that second-price
auctions are instantiated; instead of first-price auctions.

- `accounts[0]` is the wallet address of the Morphware project. Within
the scope of this development tutorial, it migrates the smart contracts
to the development blockchain and seeds `accounts[1]`; `accounts[2]`;
`accounts[3]`; and `accounts[4]` with Morphware (development) Tokens.

### Command Line (e.g., bash)

The following commands should be entered into a terminal emulator.

This section is also currently limited to Ubuntu 20.04.

#### Ubuntu 20.04

Start the local blockchain:

`npx ganache-cli --deterministic`

In a separate terminal, migrate the `MorphwareToken`, `JobFactory`, and
`AuctionFactory` contracts to the local blockchain:

`./redeploy.sh`

Start the development console:

`npx truffle console --network development`

### Development Console (i.e., Truffle)

The following commands should be entered into the development console.

#### Bare Necessities

This section is limited to the set of commands required for
`procJobDescriptionPosted` in `../daemon/worker.js` to run.

Instantiate the `MorphwareToken` contract:

`morphwareToken = await MorphwareToken.deployed();`

This seeds the end-user's account with Morphware Tokens:

`morphwareToken.transfer(accounts[4],400);`

Instantiate the `VickreyAuction` contract:

`vickreyAuction = await VickreyAuction.deployed();`

This manually seeds the `VickreyAuction` contract with Morphware Tokens
and should happen in `../daemon/main.js`:

`morphwareToken.transfer(vickreyAuction.address,100,{from:accounts[4]});`

This seeds the worker-node's account with Morphware Tokens:

`morphwareToken.transfer(accounts[1],100);`

This pre-approves the transfer of a number of Morphware Tokens from the
worker-node's wallet to the `VickreyAuction` contract:

`morphwareToken.approve(vickreyAuction.address,12,{from:accounts[1]});`

###### Optional Check

`var endUserBalance = await morphwareToken.balanceOf(accounts[4]);`

`endUserBalance.toString();  // Should be equal to 300`

#### Full Demonstration

This section is broader in scope than the development scenario
described in `Bare Necessities`, and limited to the set of commands
required to demonstrate the functionality described in `Usage`.

##### Set-up

Instatiate the relevant smart contracts in the development console:

`morphwareToken = await MorphwareToken.deployed();`

`jobFactoryContract = await JobFactory.deployed();`

`vickreyAuction = await VickreyAuction.deployed();`

Seed the accounts described in `Usage` with Morphware Tokens:

*Note: these calls are from `accounts[0]`.  If no account is specified,
in the dictionary-like object / last parameter, it is safe to assume
that the calls are from `accounts[0]`.*

`morphwareToken.transfer(accounts[1],100);`

`morphwareToken.transfer(accounts[2],200);`

`morphwareToken.transfer(accounts[3],300);`

`morphwareToken.transfer(accounts[4],400);`

Assuming that the total reward posted by the data scientist is 100
Morphware Tokens, seed the `VickreyAuction` contract with that amount:

*Note: the following functionality should occur `../daemon/main.js`.*

`morphwareToken.transfer(vickreyAuction.address,100,{from:accounts[4]});`

Pre-approve the transfer of the bid amounts to the `VickreyAuction`
contract:

*Note: this is required so that the `VickreyAuction` contract can
transfer Morphware Tokens from each of the candidate worker-nodes
to itself.*

`morphwareToken.approve(vickreyAuction.address,12,{from:accounts[1]});`

`morphwareToken.approve(vickreyAuction.address,23,{from:accounts[2]});`

`morphwareToken.approve(vickreyAuction.address,34,{from:accounts[3]});`

##### Beginnning of Bidding Phase

Submit bids:

*Note: see `Usage` for details.*

`vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(11,false,'0x6d6168616d000000000000000000000000000000000000000000000000000000')),11,{from:accounts[1]});`

`vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(22,false,'0x6e6168616d000000000000000000000000000000000000000000000000000000')),22,{from:accounts[2]});`

`vickreyAuction.bid(accounts[4],0,web3.utils.keccak256(web3.utils.encodePacked(33,true,'0x6f6168616d000000000000000000000000000000000000000000000000000000')),33,{from:accounts[3]});`

###### Optional Checks

`var auctionInstance = await vickreyAuction.auctions(accounts[4],0);`

`auctionInstance.biddingDeadline.toString();`

`auctionInstance.revealDeadline.toString();`

##### End of Bidding Phase and Beginning of Revealing Phase

Reveal bids:

*Note: see `Usage` for details.*

`vickreyAuction.reveal(accounts[4],0,[11],[false],['0x6d6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[1]});`

`vickreyAuction.reveal(accounts[4],0,[22],[false],['0x6e6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[2]});`

`vickreyAuction.reveal(accounts[4],0,[33],[true],['0x6f6168616d000000000000000000000000000000000000000000000000000000'],{from:accounts[3]});`

###### Optional Check

`var lowestBidderBalance = await morphwareToken.balanceOf(accounts[1]);`

`lowestBidderBalance.toString();  // Should be equal to 89`

Return bid-amount to the bidder who was out-bid:

`vickreyAuction.withdraw({from:accounts[1]});`

###### Optional Checks

`var lowestBidderBalance = await morphwareToken.balanceOf(accounts[1]);`

`lowestBidderBalance.toString();  // Should be equal to 100`

`var highestBidderBalance = await morphwareToken.balanceOf(accounts[2]);`

`highestBidderBalance.toString(); // Should be equal to 178`

`var fakeBidderBalance = await morphwareToken.balanceOf(accounts[3]);`

`fakeBidderBalance.toString();    // Should be equal to 300`

##### End of Revealing Phase

###### TBD

`vickreyAuction.auctionEnd(accounts[4],0);`

###### TBD

`var endUserBalance = await morphwareToken.balanceOf(accounts[4]);`

`endUserBalance.toString();    // Should be equal to 300 (i.e., original-balance minus worker-reward)`

###### TBD

`var auctionContractBalance = await morphwareToken.balanceOf(vickreyAuction.address);`

`auctionContractBalance.toString();     // Should be equal to 122 (i.e., worker-reward plus the highest-bid)`

###### TBD

`vickreyAuction.payout(accounts[4],0);`

###### TBD

`var auctionContractBalance = await morphwareToken.balanceOf(vickreyAuction.address);`

`auctionContractBalance.toString();     // Should equal to 0 (i.e., worker-reward)`

###### TBD

`var endUserBalance = await morphwareToken.balanceOf(accounts[4]);`

`endUserBalance.toString();    // Was equal to 311`

###### TBD

`var highestBidderBalance = await morphwareToken.balanceOf(accounts[2]);`

`highestBidderBalance.toString(); // Was equal to 289`
