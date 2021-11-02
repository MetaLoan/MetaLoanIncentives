const ERC20 = artifacts.require("ERC20");
const IncentivesProof = artifacts.require("IncentivesProof");
const PCoinIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require("bignumber.js");


const WAY = new BigNumber("1e+18");

let isInit = true;
let PCoinIncentives;
let PCoin;
let WmaticAtoken;
let WmaticVdtoken;
let MintToken;

// accounts: owner, emission manager, andy, Joan,
let owner;
let emissionManager;
let minter;
let Andy;
let James;
let Joan;

// mint start timestamp
var mintWmaticAtokenSTime = 0;
var mintMintTokenSTime = 0;
// emission rate
var curWmaticAtokenEmissionRate = 0;
var curMintTokenEmissionRate = 0;
// mint total supply
var g_mintTotalSupply = 0;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function PrintAsset(data, symbol) {
    console.log("Asset=" + symbol + " emission param:");
    console.log(" id=" + data.id);
    console.log(" emissionPerSecond=" + data.emissionPerSecond);
    console.log(" lastUpdateTimestamp=" + data.lastUpdateTimestamp);
    console.log(" index=" + data.index);
    console.log(" ratio=" + data.ratio);
}

async function sleep(delay) {
  var start = (new Date()).getTime();
  console.log(start + "," + delay)
  while ((new Date()).getTime() - start < delay) {
      // 使用  continue 实现；
      continue;
  }
}


contract('PCoinIncentivesController', async accounts => {
    beforeEach(async () => {
        if ( isInit == true ) {
            PCoinIncentives = await PCoinIncentivesController.deployed();
            var PRECISION = new BigNumber(await PCoinIncentives.DISTRIBUTION_END());
            console.log("PRECISION=" + PRECISION.toNumber());
            console.log(new BigNumber(await PCoinIncentives.getBlockTime()).toNumber());
            owner = accounts[0];
            emissionManager = accounts[1];
            minter = accounts[2];
            Andy = accounts[3];
            James = accounts[4];
            Joan = accounts[5];

            PCoin = await ERC20.at('0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0');
            WmaticAtoken = await IncentivesProof.at('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
            WmaticVdtoken = await IncentivesProof.at('0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F');
            MintToken = await IncentivesProof.at('0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4');

            var symbol = await PCoin.symbol();
            console.log('PCoin symbol=' + symbol);
            symbol = await WmaticAtoken.symbol();
            console.log('WmaticAtoken symbol=' + symbol);
            symbol = await WmaticVdtoken.symbol();
            console.log('WmaticVdtoken symbol=' + symbol);
            symbol = await MintToken.symbol();
            console.log('MintToken symbol=' + symbol);

            isInit = false;
            console.log(new BigNumber(await PCoinIncentives.getBlockTime()).toNumber());
        }
    });

    it('Config', async() => {
        var AssetConfigInput = [];
        var AssetConfig = [];
        var emissionPerSecond = web3.utils.toWei('0.001', 'ether');   // emissionPerSecond is 0.001 pcoin
        // first input: token address and staked is 0;
        curWmaticAtokenEmissionRate = new BigNumber(emissionPerSecond.toString()).div(WAY);
        AssetConfig.push(emissionPerSecond);
        AssetConfig.push(0);
        AssetConfig.push(WmaticAtoken.address);
        AssetConfig.push(0);
        AssetConfig.push(WmaticVdtoken.address);

        AssetConfigInput.push(AssetConfig);

        AssetConfig = [];

        emissionPerSecond = web3.utils.toWei('0.0002', 'ether');   // emissionPerSecond is 0.0002 pcoin for mint
        curMintTokenEmissionRate = new BigNumber(emissionPerSecond.toString()).div(WAY);
        AssetConfig.push(emissionPerSecond);
        AssetConfig.push(0);
        AssetConfig.push(MintToken.address);
        AssetConfig.push(0);
        AssetConfig.push(ZERO_ADDRESS);

        AssetConfigInput.push(AssetConfig);

        console.log("Config input:" + AssetConfigInput);

        await PCoinIncentives.configureAssets(AssetConfigInput, {from: emissionManager});

        var mintEmissionParams = await PCoinIncentives.assets(MintToken.address);
        await PrintAsset(mintEmissionParams, await MintToken.symbol());
        mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        mintEmissionParams = await PCoinIncentives.assets(WmaticVdtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticVdtoken.symbol()));

        // test success for configureAssets by other account not emissionManager
        // await PCoinIncentives.configureAssets(AssetConfigInput, {from: owner});
    });

    it('handlerAction', async() => {
        var userBalance = web3.utils.toWei('5', 'ether');
        //console.log(userBalance.toString());
        await WmaticAtoken.mint(Andy, userBalance.toString(), {from: minter});

        //var totalSupply = new BigNumber(await WmaticAtoken.totalSupply()).div(WAY);
        //userBalance = new BigNumber(await WmaticAtoken.balanceOf(Andy)).div(WAY);
        //console.log(totalSupply.toNumber() + ":" + userBalance.toNumber());
        console.log(new BigNumber(await PCoinIncentives.getBlockTime()).toNumber());
        mintStartTimestamp = new BigNumber(await PCoinIncentives.getBlockTime());

        userBalance = web3.utils.toWei('5', 'ether');
        await WmaticAtoken.mint(Andy, userBalance.toString(), {from: minter});
        //totalSupply = new BigNumber(await WmaticAtoken.totalSupply()).div(WAY);
        //userBalance = new BigNumber(await WmaticAtoken.balanceOf(Andy)).div(WAY);
        //console.log(totalSupply.toNumber() + ":" + userBalance.toNumber());
    });

    it('getReward', async() => {
        var assets = [];
        assets.push(WmaticAtoken.address);

        var reward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        var curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        var mintTotal = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);
        assert.equal( reward.div(WAY).toNumber(), mintTotal.toNumber() );
        //console.log(' Andy reward=' +  + ",tatol mint=" + mintTotal.toNumber());
        //mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        //await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        var unreward = new BigNumber(await PCoinIncentives.getUserUnclaimedRewards(Andy)).div(WAY);
        console.log(unreward.toNumber());
    });

    it('mulit-handlerAction', async() => {
        var userBalance = web3.utils.toWei('20', 'ether');
        //console.log(userBalance.toString());
        //var mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        //await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        await WmaticAtoken.mint(James, userBalance.toString(), {from: minter});

        //var totalSupply = new BigNumber(await WmaticAtoken.totalSupply()).div(WAY);
        //var userBalance = new BigNumber(await WmaticAtoken.balanceOf(Andy)).div(WAY);
        //console.log(totalSupply.toNumber() + ":" + userBalance.toNumber());

        var assets = [];
        assets.push(WmaticAtoken.address);

        var curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        //console.log(curBlockTime.toNumber());
        //console.log(new BigNumber(await PCoinIncentives.getUserIndex(WmaticAtoken.address, Andy)).toNumber());
        var reward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        var mintTotal = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);
        assert.equal( reward.div(WAY).toNumber(), mintTotal.toNumber() );

        userBalance = web3.utils.toWei('10', 'ether');
        await WmaticAtoken.burn(James, userBalance.toString(), {from: minter});
        var AndyReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        var JamesReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, James, {from: James}));
        AndyReward = AndyReward.div(WAY);
        JamesReward = JamesReward.div(WAY);
        // console.log(AndyReward.toNumber() + ":" + JamesReward.toNumber());
        curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        // console.log(curBlockTime.toNumber());
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        mintTotal = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);
        // console.log(AndyReward.toNumber() + "," + JamesReward.toNumber() + ":" + mintTotal.toNumber());
        assert.equal( AndyReward.plus(JamesReward).toNumber().toFixed(5), mintTotal.toNumber() );
        curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        console.log(curBlockTime.toNumber());
    });

    it ('multi-tokens', async() => {
        var userBalance = web3.utils.toWei('5', 'ether');
        await WmaticVdtoken.mint(Joan, userBalance.toString(), {from: minter});

        var assets = [];
        assets.push(WmaticAtoken.address);
        assets.push(WmaticVdtoken.address);
        console.log(assets);
        var curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        console.log(curBlockTime.toNumber());
        var mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        mintEmissionParams = await PCoinIncentives.assets(WmaticVdtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticVdtoken.symbol()));
        var AndyReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        var JamesReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, James, {from: James}));
        var JoanReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Joan, {from: Joan}));

        AndyReward = AndyReward.div(WAY);
        JamesReward = JamesReward.div(WAY);
        JoanReward = JoanReward.div(WAY);
        console.log(AndyReward.toNumber() + ',' + JamesReward.toNumber() + ',' + JoanReward.toNumber());
        var curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
                // console.log(curBlockTime.toNumber());
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        mintTotal = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);

        assert.equal( AndyReward.plus(JamesReward).plus(JoanReward).toNumber().toFixed(5), mintTotal.toNumber() );

        var userBalance = web3.utils.toWei('5', 'ether');
        await WmaticVdtoken.mint(Joan, userBalance.toString(), {from: minter});
        mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        mintEmissionParams = await PCoinIncentives.assets(WmaticVdtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticVdtoken.symbol()));

        AndyReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        JamesReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, James, {from: James}));
        JoanReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Joan, {from: Joan}));
        AndyReward = AndyReward.div(WAY);
        JamesReward = JamesReward.div(WAY);
        JoanReward = JoanReward.div(WAY);
        curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        mintTotal = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);
        //console.log(mintStartTimestamp.toNumber() + ";" + curBlockTime.toNumber());
        //console.log(AndyReward.toNumber() + ',' + JamesReward.toNumber() + ',' + JoanReward.toNumber());
        assert.equal( AndyReward.plus(JamesReward).plus(JoanReward).toNumber().toFixed(5), mintTotal.toNumber() );
    });

    it ('reset-emissionManager', async() => {
        var curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        //console.log(curBlockTime.toNumber());

        var AssetConfigInput = [];
        var AssetConfig = [];
        var emissionPerSecond = web3.utils.toWei('0.008', 'ether');   // emissionPerSecond is 0.001 pcoin
        // first input: token address and staked is 0;
        var totalSupply = new BigNumber(await WmaticAtoken.totalSupply());
        AssetConfig.push(emissionPerSecond);
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(WmaticAtoken.address);
        totalSupply = new BigNumber(await WmaticVdtoken.totalSupply());
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(WmaticVdtoken.address);

        AssetConfigInput.push(AssetConfig);

        await PCoinIncentives.configureAssets(AssetConfigInput, {from: emissionManager});

        curBlockTime = new BigNumber(await PCoinIncentives.getBlockTime());
        //console.log(curBlockTime.toNumber());
        curBlockTime = curBlockTime.minus(mintStartTimestamp);
        g_mintTotalSupply = curBlockTime.multipliedBy(curWmaticAtokenEmissionRate);
        //console.log(g_mintTotalSupply.toNumber());
        curWmaticAtokenEmissionRate = new BigNumber(emissionPerSecond.toString()).div(WAY);
        mintStartTimestamp = new BigNumber(await PCoinIncentives.getBlockTime());
        //console.log(mintStartTimestamp.toNumber());

        var assets = [];
        assets.push(WmaticAtoken.address);
        assets.push(WmaticVdtoken.address);

        AndyReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        JamesReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, James, {from: James}));
        JoanReward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Joan, {from: Joan}));
        AndyReward = AndyReward.div(WAY);
        JamesReward = JamesReward.div(WAY);
        JoanReward = JoanReward.div(WAY);

        //console.log(AndyReward.toNumber() + ',' + JamesReward.toNumber() + ',' + JoanReward.toNumber()
        //           + ',' + AndyReward.plus(JamesReward).plus(JoanReward).toNumber().toFixed(5));
        assert.equal( AndyReward.plus(JamesReward).plus(JoanReward).toNumber().toFixed(5), g_mintTotalSupply.toNumber() );

        var mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
        mintEmissionParams = await PCoinIncentives.assets(WmaticVdtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticVdtoken.symbol()));


    });

    it ('check-reward', async() => {
    });
})