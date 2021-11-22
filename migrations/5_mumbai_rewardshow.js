const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');
const ERC20 = artifacts.require("ERC20");

const PCoinAddress = '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd';
const PCoinICAddress = '0x8a5b6FA82071DDAba9cF8A24e126b44f9A6D1eeA';

// wmatic atoken/vdtoken, 0.0003159 Pcoin/s
const wmaticAtoken = '0x6c77B624128E8FC80f5b890eb3d11B6B43Bf47F6';
const wmaticVdtoken = '0xBF406A44d5C6Df9a03a41805968dcCE98a2A2843';

// usdt atoken/vdtoken
const usdtAtoken = '0xF00F5390462A8a2362719aC6D75C6FcAa51Dec89';
const usdtVdtoken = '0xD9ef7B084847Cee4034507ae1C8De2D26c75c7c8';

// usdc atoken/vdtoken
const usdcAtoken = '0x31DcC5e481Af92ca851B60dFE164e13F777620b2';
const usdcVdtoken = '0xa3D161aA478Bf79Da2e320f8140C1F021aCa7493';

// weth atoken/vdtoken, 0.0003159 Pcoin/s
const wethAtoken = '0x9FE4BA4A217b27fB9f993a57F6b5B442361E00ef';
const wethVdtoken = '0x8F68599E345AEe9F20b815aFC4fd8c915bB94452';

// wbtc atoken/vdtoken, 0.0003159 Pcoin/s
const wbtcAtoken = '0xf65c6DA069fbE53f2DD6E032cFa506B9199b6B4d';
const wbtcVdtoken = '0xA5eED13dF67CEA03771d0657237a0D7344e5d816';

// dai atoken/vdtoken
const daiAtoken = '0x82477c3ADE19399dC314131c34d0EA208845d5D4';
const daiVdtoken = '0xdF331916E5eb758f2429DA6D6a91Eb43650D93a4';

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
    if ( network == 'test' ) {
        return;
    }

    if ( network == 'mumbai' ) {
        var owner = accounts[0];
        var PolylendICIns = await PolylendIncentivesController.at(PCoinICAddress);

        var atokenAddress = usdtAtoken;
        var vdtokenAddress = usdtVdtoken;

        var assets = [];
        assets.push(atokenAddress);
        assets.push(vdtokenAddress);

        var assetPool = await PolylendICIns._assetPool(0);
        console.log(assetPool);

        var atokenIns = await ERC20.at(atokenAddress);
        var vdtokenIns = await ERC20.at(vdtokenAddress);

        console.log("User=" + show_account + " status:");

        var mintEmissionParams = await PolylendICIns.assets(atokenAddress);
        await PrintAsset(mintEmissionParams, (await atokenIns.symbol()));
        mintEmissionParams = await PolylendICIns.assets(vdtokenAddress);
        await PrintAsset(mintEmissionParams, (await vdtokenIns.symbol()));
        var balanceOf = new BigNumber(await atokenIns.balanceOf(show_account));
        var supply = new BigNumber(await atokenIns.totalSupply());
        console.log('atoken:' + balanceOf.toNumber() + "," + supply.toNumber());
        balanceOf = new BigNumber(await vdtokenIns.balanceOf(show_account));
        supply = new BigNumber(await vdtokenIns.totalSupply());
        console.log('vdtoken:' + balanceOf.toNumber() + "," + supply.toNumber());
        var reward = new BigNumber(await PolylendICIns.getRewardsBalance(assets, show_account, {from: show_account}));
        console.log('Pcoin reward=' + reward.div(WAY).toNumber());
        var PCoinIns = await ERC20.at(PCoinAddress);
        var PcoinBalance = new BigNumber(await PCoinIns.balanceOf(PCoinICAddress));
        console.log("Incentives Control=" + PCoinICAddress + ". Pcoin balance=" + PcoinBalance.toNumber());
        //await PolylendICIns.retrieve(PcoinBalance, {from: owner});
        var userStatus = new BigNumber(await PolylendICIns.getUserIndex(atokenAddress, show_account));
        console.log("Index=" + userStatus.toNumber());
        reward = new BigNumber(await PolylendICIns.getUserUnclaimedRewards(show_account));
        console.log(reward.toNumber());
    }
}