var morphwareTokenContract = new web3.eth.Contract(JSON.parse(fs.readFileSync(path.resolve('./build/contracts/MorphwareToken.json'),'utf-8')).abi,'0xbc40e97e6d665ce77e784349293d716b030711bc');
var jobFactoryContract = new web3.eth.Contract(JSON.parse(fs.readFileSync(path.resolve('./build/contracts/JobFactory.json'),'utf-8')).abi,'0x4e846e99994cd6d75682871dd19024d502d6a198');
var vickreyAuctionContract = new web3.eth.Contract(JSON.parse(fs.readFileSync(path.resolve('./build/contracts/VickreyAuction.json'),'utf-8')).abi,'0xeb3710de338b6d6ba51f568065c3b6f75acc53d8');

morphwareTokenContract.methods.approve(vickreyAuctionContract._address,12).call({from:accounts[1]});
morphwareTokenContract.methods.approve(vickreyAuctionContract._address,23).call({from:accounts[2]});

var currentTimestamp = Math.floor(new Date().getTime() / 1000);
var biddingDeadline = currentTimestamp + 180;
var revealDeadline = biddingDeadline + 180;

var postJobDescRes = await jobFactoryContract.methods.postJobDescription(8,1024,9,10,biddingDeadline,revealDeadline,100).call({from: accounts[0]});

vickreyAuctionContract.methods.bid(accounts[0],0,web3.utils.keccak256(web3.utils.encodePacked(11,false,'0x6d6168616d000000000000000000000000000000000000000000000000000000')),11).call({from:accounts[1]});
vickreyAuctionContract.methods.bid(accounts[0],0,web3.utils.keccak256(web3.utils.encodePacked(22,false,'0x6d6168616e000000000000000000000000000000000000000000000000000000')),22).call({from:accounts[2]});

