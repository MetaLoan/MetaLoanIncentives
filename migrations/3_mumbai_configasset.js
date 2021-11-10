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
// usdc atoken/vdtoken, 0.0003159 Pcoin/s
const usdcAtoken = '0x31DcC5e481Af92ca851B60dFE164e13F777620b2';
const usdcVdtoken = '0xa3D161aA478Bf79Da2e320f8140C1F021aCa7493';
const usdcEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);
// usdt atoken/vdtoken, 0.0003159 Pcoin/s
const usdtAtoken = '0xF00F5390462A8a2362719aC6D75C6FcAa51Dec89';
const usdtVdtoken = '0xD9ef7B084847Cee4034507ae1C8De2D26c75c7c8';
const usdtEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);
// weth atoken/vdtoken, 0.0003159 Pcoin/s
const wethAtoken = '0x9FE4BA4A217b27fB9f993a57F6b5B442361E00ef';
const wethVdtoken = '0x8F68599E345AEe9F20b815aFC4fd8c915bB94452';
const wethEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);
// wbtc atoken/vdtoken, 0.0003159 Pcoin/s
const wbtcAtoken = '0xf65c6DA069fbE53f2DD6E032cFa506B9199b6B4d';
const wbtcVdtoken = '0xA5eED13dF67CEA03771d0657237a0D7344e5d816';
const wbtcEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);
// dai atoken/vdtoken, 0.0003159 Pcoin/s
const daiAtoken = '0x82477c3ADE19399dC314131c34d0EA208845d5D4';
const daiVdtoken = '0xdF331916E5eb758f2429DA6D6a91Eb43650D93a4';
const daiEmissionPerSecond = new BigNumber('0.0003159').multipliedBy(WAY);

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
    console.log(daiEmissionPerSecond.toNumber());
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

        var atokenAddress = daiAtoken;
        var vdtokenAddress = daiVdtoken;
        var emissionPerSecond = daiEmissionPerSecond;

        AssetConfig.push(emissionPerSecond);
        var atokenIns = await ERC20.at(atokenAddress);
        var totalSupply = new BigNumber(await atokenIns.totalSupply());
        var decimals = new BigNumber(await atokenIns.decimals());
        decimals = new BigNumber(10).exponentiatedBy(decimals);
        console.log("Atoken Total Supply=" + totalSupply.div(decimals).toNumber());
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(atokenAddress);
        var vdtokenIns = await ERC20.at(vdtokenAddress);
        totalSupply = new BigNumber(await vdtokenIns.totalSupply());
        decimals = new BigNumber(await vdtokenIns.decimals());
        decimals = new BigNumber(10).exponentiatedBy(decimals);
        console.log("Vdtoken Total Supply=" + totalSupply.div(decimals).toNumber());
        AssetConfig.push(totalSupply.toString());
        AssetConfig.push(vdtokenAddress);

        AssetConfigInput.push(AssetConfig);
        console.log("Config input:" + AssetConfigInput);

        await PolylendICIns.configureAssets(AssetConfigInput, {from: emissionManager});
        var mintEmissionParams = await PolylendICIns.assets(atokenAddress);
        await PrintAsset(mintEmissionParams, (await atokenIns.symbol()));
        mintEmissionParams = await PolylendICIns.assets(vdtokenAddress);
        await PrintAsset(mintEmissionParams, (await vdtokenIns.symbol()));
    }
};
