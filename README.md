# Morphware: Service

## Description

`service` is the back-end runtime that handles requests from the
`../client` and interacts with the smart contracts in `../service`, in
addition to seeding the models and datasets onto BitTorrent.

It's current implementation is limited to handling the first event,
`JobDescriptionPosted`.  The other events are listed as follows:

1. `JobDescriptionPosted`
2. `AuctionEnded` (from: `AuctionFactory`)
3. `UntrainedModelAndTrainingDatasetShared`
4. `TrainedModelShared`
5. `JobApproved`

## Installation

This section is currently limited to Ubuntu 20.04.

### Ubuntu 20.04

TODO

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

`npx ganache-cli --deterministic`
`./redeploy.sh`
`npx truffle console --network development`

### Development Console (i.e., Truffle)
``
``
``
``
``
``


