const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const Farm = artifacts.require("Farm");
const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const IERC20Detailed = artifacts.require("IERC20Detailed");
const IncentivesProof = artifacts.require("IncentivesProof");
const BigNumber = require("bignumber.js");

const farmParam = {
    'mumbai': {
        'farmFactory': '0xbc1A6ab90fFAcC98a4A6352F9Fc256BA3c8e1a5e',
        'pcoin': '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd',
        'farm': {
            'sushiswap': {
                'pcoin-usdt': '',
                'pcoin-usdc': '',
                'pcoin-matic': {
                    'address': '0xf160c9bb3af084b5b02eda73bb0978271e145024',
                    'name': 'Ploylend farm SLP pcoin matic',
                    'symbol': 'SLP_FPMATIC',
                    'emissionPerSecond': '0.0001'
                }
            }
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
    if ( network == 'test' ) {
        return;
    }

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
        var plane = 'hf'; // 'sushiswap';
        var factory = await FarmPoolFactory.at(farmParam[network]['farmFactory']);
        var incentives = await PolylendIncentivesController.at(await factory.getPolylendIncentivesController());
        console.log("farm incentives=" + incentives.address);

        if ( plane == 'sushiswap' || plane == 'quickswap' ) {
            var farm = 'pcoin-matic';  // If you want to create a new farm,  you must change it to you lptoken
            console.log("Go into create new farm = " + farm);
            var ecr20 = await IERC20Detailed.at(await incentives.REWARD_TOKEN());
            var decimals = new BigNumber(await ecr20.decimals());
            decimals = new BigNumber(10).exponentiatedBy(decimals);
            var lpTokenContext = farmParam[network]['farm'][plane][farm];
            console.log(lpTokenContext);

            var emissionPerSecond = new BigNumber(lpTokenContext['emissionPerSecond']);
            emissionPerSecond = emissionPerSecond.multipliedBy(decimals);
            await factory.createFarm(lpTokenContext['address'],
                                     lpTokenContext['name'],
                                     lpTokenContext['symbol'],
                                     emissionPerSecond,
                                     {from: owner});
        }
        else {
            var farmList = await factory.getFarmList();
            console.log("Show All Farm Context");
            for ( var i = 0; i < farmList.length; i++ ) {
                console.log("No." + i + " farm = " + farmList[i]);
                var framContext = await factory.getFarm(farmList[i]);
                console.log("Proof address=" + framContext.proof + ";farm address=" + framContext.farm);
                var proof = await IncentivesProof.at(framContext.proof);
                var decimals = await proof.decimals();
                console.log("proof symbol=" + await proof.symbol() + ",decimals=" + decimals);
                decimals = new BigNumber(decimals);
                decimals = new BigNumber(10).exponentiatedBy(decimals);
                var totalSupply = new BigNumber(await proof.totalSupply());
                totalSupply = totalSupply.div(decimals);
                console.log("totalSupply=" + totalSupply.toNumber());
            }
        }
    }
}