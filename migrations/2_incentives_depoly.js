const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const ERC20 = artifacts.require("ERC20");
const BigNumber = require("bignumber.js");


const deployParams = {
    'mumbai': {
        'contract': "0x8a5b6FA82071DDAba9cF8A24e126b44f9A6D1eeA",
        'pcoin': '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd',             // the address of pcoin
        'duration': 10                                                     // the duration of incentive (unit: year)
    },
    "bsc_testnet": {
        'contract': '0x8BFD915c545559a8272ab2a1aA1c01BE56F3C1dC',
        'pcoin': '0x1F63A75C6C77612Fb9264aF3FED5A0f2766807d7',
        'duration': 10
    },
    "bsc": {
        'contract': null,
        'pcoin': '',
        'duration': 10
    },
    "polygon": {
        'contract': null,
        'pcoin': '',
        'duration': 10
    }
}

// run truffle deploy --compile-none --network mumbai --f x --to x
module.exports = async function (deployer, network, accounts) {
    if ( network == 'test' ) {
        return;
    }

    var owner = accounts[0];
    var emissionManager = accounts[1];
    var duration = deployParams[network]['duration'] * 365 * 24 * 3600;

    if ( deployParams[network]['contract'] == null ) {
        console.log("Go to deploy contract in " + network);
        await deployer.deploy(PolylendIncentivesController,
                              deployParams[network]['pcoin'],
                              emissionManager,
                              duration,
                              {from: owner});
    }
    else {
        console.log("Incentive contract has deployed in " + network + ",address=" + deployParams[network]['contract'] + ":");
        var pcoinIns = await ERC20.at(deployParams[network]['pcoin']);
        var balance = new BigNumber(await pcoinIns.balanceOf(deployParams[network]['contract']));
        var decimals = new BigNumber(await pcoinIns.decimals());
        decimals = new BigNumber(10).exponentiatedBy(decimals);
        balance = balance.dividedBy(decimals);
        console.log(" the amount of reward pool =" + balance.toNumber());
    }
};