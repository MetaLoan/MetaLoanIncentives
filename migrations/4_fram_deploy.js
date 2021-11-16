const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const Farm = artifacts.require("Farm");

const farmParam = {
    'mumbai': {
        'farmFactory': '0xbc1A6ab90fFAcC98a4A6352F9Fc256BA3c8e1a5e',
        'pcoin': '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd',
        'farm': {
            'pcoin-usdt': '',
            'pcoin-usdc': ''
        }
    },
    'bsc_testnet': {
        'farmFactory': null,
        'pcoin': '0x1F63A75C6C77612Fb9264aF3FED5A0f2766807d7',
        'farm': {
            'pcoin-usdt': '',
            'pcoin-usdc': ''
        }
    },
    'bsc': {
        'farmFactory': null,
        'pcoin': '',
        'farm': {
            'pcoin-usdt': '',
            'pcoin-usdc': ''
        }
    },
    'polygon': {
        'farmFactory': null,
        'pcoin': '',
        'farm': {
            'pcoin-usdt': '',
            'pcoin-usdc': ''
        }
    }
}

// run truffle deploy --compile-none --network mumbai --f x --to x
module.exports = async function (deployer, network, accounts) {
    var owner = accounts[0];

    if ( farmParam[network]['farmFactory'] == null ) {
        console.log("Goto into deploy farm factory in " + network);
        var salt = new Buffer("Polylend Farm Factory", "utf-8");
        deployer.deploy(FarmPoolFactory,
                        farmParam[network]['pcoin'],
                        salt,
                        {from: owner});
    }
    else {
        var farm = 'pcoin-usdt';  // If you want to create a new farm,  you must change it to you lptoken
        console.log("Go into create new farm = " + farm);
    }
}