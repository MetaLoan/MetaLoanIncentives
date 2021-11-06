const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');
const ERC20 = artifacts.require("ERC20");

const WAY = new BigNumber('1e+18');
const PCoinAddress = '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd';
const PCoinICAddress = '0x8a5b6FA82071DDAba9cF8A24e126b44f9A6D1eeA';
// wmatic atoken/vdtoken, 0.0003159 Pcoin/s
const wmaticAtoken = '0x6c77B624128E8FC80f5b890eb3d11B6B43Bf47F6';
const wmaticVdtoken = '0xBF406A44d5C6Df9a03a41805968dcCE98a2A2843';
const wmaticEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);

let PolylendICIns;

async function PrintAsset(data, symbol) {
    console.log("Asset=" + symbol + " emission param:");
    console.log(" id=" + data.id);
    console.log(" emissionPerSecond=" + data.emissionPerSecond);
    console.log(" lastUpdateTimestamp=" + data.lastUpdateTimestamp);
    console.log(" index=" + data.index);
    console.log(" ratio=" + data.ratio);
}

module.exports = async function (deployer, network, accounts) {
    console.log(wmaticEmissionPerSecond.toNumber());
    if ( network == 'mumbai' ) {
        var owner = accounts[0];
        var PolylendICIns = await PolylendIncentivesController.at(PCoinICAddress);
        var emissionManager = await PolylendICIns.EMISSION_MANAGER();
        console.log(emissionManager);

        var PCoinIns = await ERC20.at(PCoinAddress);
        var PcoinBalance = new BigNumber(await PCoinIns.balanceOf(PCoinICAddress));
        console.log("Incentives Control=" + PCoinICAddress + ". Pcoin balance=" + PcoinBalance.toNumber());

        var AssetConfigInput = [];
        var AssetConfig = [];

        AssetConfig.push(wmaticEmissionPerSecond);
        var wmaticAtokenIns = await ERC20.at(wmaticAtoken);
        var totalSupply = new BigNumber(await wmaticAtokenIns.totalSupply());
        console.log("wmaticAtoken Total Supply=" + totalSupply.div(WAY).toNumber());
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(wmaticAtoken);
        var wmaticVdtokenIns = await ERC20.at(wmaticVdtoken);
        var totalSupply = new BigNumber(await wmaticVdtokenIns.totalSupply());
        console.log("wmaticVdtoken Total Supply=" + totalSupply.div(WAY).toNumber());
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(wmaticVdtoken);

        AssetConfigInput.push(AssetConfig);
        console.log("Config input:" + AssetConfigInput);

        await PolylendICIns.configureAssets(AssetConfigInput, {from: emissionManager});
        var mintEmissionParams = await PolylendICIns.assets(wmaticAtoken);
        await PrintAsset(mintEmissionParams, (await wmaticAtokenIns.symbol()));
        mintEmissionParams = await PolylendICIns.assets(wmaticVdtoken);
        await PrintAsset(mintEmissionParams, (await wmaticVdtokenIns.symbol()));
    }
};
