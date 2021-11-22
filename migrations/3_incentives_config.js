const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');
const IERC20Detailed = artifacts.require("IERC20Detailed");

let PolylendICIns;

const configParams = {
    'mumbai': {
        'incentives': '0x8a5b6FA82071DDAba9cF8A24e126b44f9A6D1eeA',
        'wmatic': {
            'atoken': '0x6c77B624128E8FC80f5b890eb3d11B6B43Bf47F6',
            'vdtoken': '0xBF406A44d5C6Df9a03a41805968dcCE98a2A2843',
            'EmissionPerSecond': '0.0003159'
        },
        'usdc': {
            'atoken': '0x31DcC5e481Af92ca851B60dFE164e13F777620b2',
            'vdtoken': '0xa3D161aA478Bf79Da2e320f8140C1F021aCa7493',
            'EmissionPerSecond': '0.0003159'
        },
        'usdt': {
            'atoken': '0xF00F5390462A8a2362719aC6D75C6FcAa51Dec89',
            'vdtoken': '0xD9ef7B084847Cee4034507ae1C8De2D26c75c7c8',
            'EmissionPerSecond': '0.0003159'
        },
        'weth': {
            'atoken': '0x9FE4BA4A217b27fB9f993a57F6b5B442361E00ef',
            'vdtoken': '0x8F68599E345AEe9F20b815aFC4fd8c915bB94452',
            'EmissionPerSecond': '0.0003159'
        },
        'wbtc': {
            'atoken': '0xf65c6DA069fbE53f2DD6E032cFa506B9199b6B4d',
            'vdtoken': '0xA5eED13dF67CEA03771d0657237a0D7344e5d816',
            'EmissionPerSecond': '0.0003159'
        },
        'dai': {
            'atoken': '0x82477c3ADE19399dC314131c34d0EA208845d5D4',
            'vdtoken': '0xdF331916E5eb758f2429DA6D6a91Eb43650D93a4',
            'EmissionPerSecond': '0.0003159'
        }
    },
    'bsc_testnet': {
        'incentives': '0x8BFD915c545559a8272ab2a1aA1c01BE56F3C1dC',
        'weth': {
            'atoken': '',
            'vdtoken': '',
            'EmissionPerSecond': ''
        },
        'bnb': {
            'atoken': '0x017794167Bb4C929a5ACF886305FB0C620f86C1f',
            'vdtoken': '0x878c59F327b0ED2241a9A0381Ad6efcc9B8d0984',
            'EmissionPerSecond': '0.0003159'
        }
    }
}

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

    var asset = 'bnb';    // modify when you config asset emission param

    var owner = accounts[0];
    var incentives = await PolylendIncentivesController.at(configParams[network]['incentives']);
    var emissionManager = await incentives.EMISSION_MANAGER();
    var pcoinIns = await IERC20Detailed.at(await incentives.REWARD_TOKEN());
    var emissionPerSecond = new BigNumber(configParams[network][asset]['EmissionPerSecond']);
    var decimals = new BigNumber(await pcoinIns.decimals());
    decimals = new BigNumber(10).exponentiatedBy(decimals);
    emissionPerSecond = emissionPerSecond.multipliedBy(decimals);

    var AssetConfigInput = [];
    var AssetConfig = [];

    AssetConfig.push(emissionPerSecond);

    var atokenIns = await IERC20Detailed.at(configParams[network][asset]['atoken']);
    console.log(await atokenIns.symbol());
    var totalSupply = new BigNumber(await atokenIns.totalSupply());
    console.log(totalSupply.toString());
    AssetConfig.push(totalSupply.toString());
    AssetConfig.push(atokenIns.address);
    var vdtokenIns = await IERC20Detailed.at(configParams[network][asset]['vdtoken']);
    totalSupply = new BigNumber(await vdtokenIns.totalSupply());
    AssetConfig.push(totalSupply.toString());
    AssetConfig.push(vdtokenIns.address);
    AssetConfigInput.push(AssetConfig);

    console.log(emissionManager);
    console.log("Asset=" + asset + " config input:" + AssetConfigInput);
    console.log(await incentives.REWARD_TOKEN());
    await incentives.configureAssets(AssetConfigInput, {from: emissionManager});

    var mintEmissionParams = await incentives.assets(atokenIns.address);
    await PrintAsset(mintEmissionParams, (await atokenIns.symbol()));
    mintEmissionParams = await incentives.assets(vdtokenIns.address);
    await PrintAsset(mintEmissionParams, (await vdtokenIns.symbol()));
};
