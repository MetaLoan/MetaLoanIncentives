const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const Farm = artifacts.require("Farm");
const IncentivesProof = artifacts.require("IncentivesProof");
const lptoken = artifacts.require("IERC20Detailed");
const BigNumber = require("bignumber.js");

const farmlist = {
    'mumbai': {
        'sushiswap': {
            'pcoin-matic': {
                'farm': '0xb248C48A52C226121902a51EbBA16A474BE1C514',
                'proof': '0xb42A1e9153861efF7bE2B0dEfB67D0989eA5a6a2',
                'lptoken': '0xf160c9bb3af084b5b02eda73bb0978271e145024'
            }
        }
    }
}

// run truffle deploy --compile-none --network mumbai --f x --to x
module.exports = async function (deployer, network, accounts) {
    if ( network == 'test' ) {
        return;
    }
    var user = accounts[0];
    var farm = farmlist[network]['sushiswap']['pcoin-matic']

    console.log('sushiswap pcoin-matic lp-pair farm context:');
    var lptokenIns = await lptoken.at(farm['lptoken']);
    var symbol = await lptokenIns.symbol();
    var lpBalance = new BigNumber(await lptokenIns.balanceOf(user));
    var decimals = await lptokenIns.decimals();
    decimals = new BigNumber(decimals);
    decimals = new BigNumber(10).exponentiatedBy(decimals);
    lpBalance = lpBalance.div(decimals);
    console.log(" lptoken symbol=" + symbol + ",user=" + user + " balance=" + lpBalance.toNumber());

    var depositAmount = new BigNumber('1e+30');
    await lptokenIns.approve(farm['farm'], depositAmount, {from: user});
    console.log(" approve to farm contract success");
    var farmIns = await Farm.at(farm['farm']);
    depositAmount = new BigNumber(10);
    depositAmount = depositAmount.multipliedBy(decimals);
    await farmIns.deposit(depositAmount, {from: user});
    console.log(" fram deposit success");

    var proofIns = await IncentivesProof.at(farm['proof']);
    symbol = await proofIns.symbol();
    lpBalance = new BigNumber(await proofIns.balanceOf(user));
    decimals = await proofIns.decimals();
    decimals = new BigNumber(decimals);
    decimals = new BigNumber(10).exponentiatedBy(decimals);
    lpBalance = lpBalance.div(decimals);
    console.log(" proof symbol=" + symbol + ",user=" + user + " balance=" + lpBalance.toNumber());
}