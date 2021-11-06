const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');
const ERC20 = artifacts.require("ERC20");

const PCoinAddress = '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd';
const PCoinICAddress = '0x8a5b6FA82071DDAba9cF8A24e126b44f9A6D1eeA';

// wmatic atoken/vdtoken, 0.0003159 Pcoin/s
const wmaticAtoken = '0x6c77B624128E8FC80f5b890eb3d11B6B43Bf47F6';
const wmaticVdtoken = '0xBF406A44d5C6Df9a03a41805968dcCE98a2A2843';

// show account
const show_account = '0xb1b4C08D9dBA94Af1A1a142cB87F22637B01829D';

//
const WAY = new BigNumber('1e+18');

async function PrintAsset(data, symbol) {
    console.log("Asset=" + symbol + " emission param:");
    console.log(" id=" + data.id);
    console.log(" emissionPerSecond=" + data.emissionPerSecond);
    console.log(" lastUpdateTimestamp=" + data.lastUpdateTimestamp);
    console.log(" index=" + data.index);
    console.log(" ratio=" + data.ratio);
}

module.exports = async function (deployer, network, accounts) {
    if ( network == 'mumbai' ) {
        var owner = accounts[0];
        var PolylendICIns = await PolylendIncentivesController.at(PCoinICAddress);
        var assets = [];
        assets.push(wmaticAtoken);
        assets.push(wmaticVdtoken);

        var assetPool = await PolylendICIns._assetPool(0);
        console.log(assetPool);

        var wmaticAtokenIns = await ERC20.at(wmaticAtoken);
        var wmaticVdtokenIns = await ERC20.at(wmaticVdtoken);

        var mintEmissionParams = await PolylendICIns.assets(wmaticAtoken);
        await PrintAsset(mintEmissionParams, (await wmaticAtokenIns.symbol()));
        mintEmissionParams = await PolylendICIns.assets(wmaticVdtoken);
        await PrintAsset(mintEmissionParams, (await wmaticVdtokenIns.symbol()));
        var balanceOf = new BigNumber(await wmaticAtokenIns.balanceOf(show_account));
        var supply = new BigNumber(await wmaticAtokenIns.totalSupply());
        console.log(balanceOf.toNumber() + "," + supply.toNumber());
        balanceOf = new BigNumber(await wmaticVdtokenIns.balanceOf(show_account));
        supply = new BigNumber(await wmaticVdtokenIns.totalSupply());
        console.log(balanceOf.toNumber() + "," + supply.toNumber());
        var reward = new BigNumber(await PolylendICIns.getRewardsBalance(assets, show_account, {from: show_account}));
        console.log(reward.toNumber());
        var PCoinIns = await ERC20.at(PCoinAddress);
        var PcoinBalance = new BigNumber(await PCoinIns.balanceOf(PCoinICAddress));
        console.log("Incentives Control=" + PCoinICAddress + ". Pcoin balance=" + PcoinBalance.toNumber());
        //await PolylendICIns.retrieve(PcoinBalance, {from: owner});
        var userStatus = new BigNumber(await PolylendICIns.getUserIndex(wmaticAtoken, show_account));
        console.log("Index=" + userStatus.toNumber());
//        var _PRECISION = new BigNumber(await PolylendICIns._PRECISION());
//        var DISTRIBUTION_END = new BigNumber(await PolylendICIns.DISTRIBUTION_END());
//        console.log("_PRECISION=" + _PRECISION.toNumber() + ",DISTRIBUTION_END=" + DISTRIBUTION_END);
        reward = new BigNumber(await PolylendICIns.getUserUnclaimedRewards(show_account));
        console.log(reward.toNumber());
        reward = new BigNumber(await PolylendICIns.getRewardsBalance(assets, show_account, {from: show_account}));
        console.log(reward.div(WAY).toNumber());
    }
}