const ERC20 = artifacts.require("ERC20");
const PCoinIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require("bignumber.js");

let isInit = true;
let PCoinIncentives;
let PCoin;
let WmaticAtoken;
let WmaticVdtoken;
let MintToken;

// accounts: owner, emission manager, andy, john,
let owner;
let emissionManager;
let Andy;
let James;
let Joan;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function PrintAsset(data, symbol) {
    console.log("Asset=" + symbol + " emission param:");
    console.log(" id=" + data.id);
    console.log(" emissionPerSecond=" + data.emissionPerSecond);
    console.log(" lastUpdateTimestamp=" + data.lastUpdateTimestamp);
    console.log(" index=" + data.index);
    console.log(" ratio=" + data.ratio);
}

contract('PCoinIncentivesController', async accounts => {
    beforeEach(async () => {
        if ( isInit == true ) {
            PCoinIncentives = await PCoinIncentivesController.deployed();
            var PRECISION = new BigNumber(await PCoinIncentives._PRECISION());
            console.log("PRECISION=" + PRECISION.toNumber());
            owner = accounts[0];
            emissionManager = accounts[1];
            Andy = accounts[2];
            James = accounts[3];
            Joan = accounts[4];

            PCoin = await ERC20.at('0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0');
            WmaticAtoken = await ERC20.at('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
            WmaticVdtoken = await ERC20.at('0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF');
            MintToken = await ERC20.at('0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F');

            var symbol = await PCoin.symbol();
            console.log('PCoin symbol=' + symbol);
            symbol = await WmaticAtoken.symbol();
            console.log('WmaticAtoken symbol=' + symbol);
            symbol = await WmaticVdtoken.symbol();
            console.log('WmaticVdtoken symbol=' + symbol);
            symbol = await MintToken.symbol();
            console.log('MintToken symbol=' + symbol);


            isInit = false;
        }
    });

    it('Config', async() => {
        var AssetConfigInput = [];
        var AssetConfig = [];
        var emissionPerSecond = web3.utils.toWei('0.001', 'ether');   // emissionPerSecond is 0.001 pcoin
        // first input: token address and staked is 0;
        AssetConfig.push(emissionPerSecond);
        AssetConfig.push(0);
        AssetConfig.push(WmaticAtoken.address);
        AssetConfig.push(0);
        AssetConfig.push(WmaticVdtoken.address);

        AssetConfigInput.push(AssetConfig);

        AssetConfig = [];

        emissionPerSecond = web3.utils.toWei('0.0002', 'ether');   // emissionPerSecond is 0.0002 pcoin for mint
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
        var userBalance = web3.utils.toWei('10', 'ether');
        console.log(userBalance.toString());
        await WmaticAtoken.mint(Andy, userBalance.toString(), {from: Andy});
        //var totalSupply = new BigNumber(await WmaticAtoken.totalSupply());
        //userBalance = new BigNumber(await WmaticAtoken.balanceOf(Andy));
        //console.log(totalSupply.toNumber() + ":" + userBalance.toNumber());
        await WmaticAtoken.handleAction(PCoinIncentives.address, {from: Andy});

        var userIndex = new BigNumber(await PCoinIncentives.getUserIndex(WmaticAtoken.address, Andy, {from: Andy}));
        console.log('UserIndex=' + userIndex.toNumber());

        var assets = [];
        assets.push(WmaticAtoken.address);
        var reward = new BigNumber(await PCoinIncentives.getRewardsBalance(assets, Andy, {from: Andy}));
        console.log(new BigNumber(await PCoinIncentives.getBlockTime()).toNumber());
        console.log(' Andy reward=' + reward);
        mintEmissionParams = await PCoinIncentives.assets(WmaticAtoken.address);
        await PrintAsset(mintEmissionParams, (await WmaticAtoken.symbol()));
    });
})