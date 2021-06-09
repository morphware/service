#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const Web3 = require('web3');

const provider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
const web3     = new Web3(provider);

const auctionFactoryContractAddress = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B';
const morphwareTokenContractAddress = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601';

const auctionFactoryAbi = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname,'/build/contracts/VickreyAuction.json')),'utf-8')).abi;
const morphwareTokenAbi = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname,'/build/contracts/MorphwareToken.json')),'utf-8')).abi;

const auctionFactoryContract = new web3.eth.Contract(auctionFactoryAbi,auctionFactoryContractAddress);
const morphwareTokenContract = new web3.eth.Contract(morphwareTokenAbi,morphwareTokenContractAddress);

const account0Address = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const account4Address = '0xd03ea8624C8C5987235048901fB614fDcA89b117';
const account1Address = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';

morphwareTokenContract.methods.transfer(account4Address,400).send({from:account0Address});
morphwareTokenContract.methods.transfer(auctionFactoryContract._address,100).send({from:account4Address});
morphwareTokenContract.methods.transfer(account1Address,100).send({from:account0Address});
morphwareTokenContract.methods.approve(auctionFactoryContract._address,12).send({from:account1Address});

console.log('\nBootstrap script finished running.');

process.exit();
