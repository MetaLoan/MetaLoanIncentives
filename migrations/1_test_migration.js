const ERC20 = artifacts.require("ERC20");
const WMATIC_ATOKEN = artifacts.require("IncentivesProof");
const WMATIC_VDTOKEN = artifacts.require("IncentivesProof");
const MINT_TOKEN = artifacts.require("IncentivesProof");
const PCoinIncentivesController = artifacts.require("PolylendIncentivesController");
const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const StakePool = artifacts.require("StakePool");

module.exports = async function (deployer, network, accounts) {
    if ( network == 'test' ) {
        var owner = accounts[0];
        var emissionManager = accounts[1];
        var minter = accounts[2];

        await deployer.deploy(ERC20, "Polylend Token", "PCoin", {from: owner});
        var PCoin = await ERC20.deployed();
        console.log("PCoin address=" + PCoin.address);

        let timestamp = (await web3.eth.getBlock()).timestamp;
        console.log('PCoin.address=' + PCoin.address + ",timestamp=" + timestamp);

        var durtime = 10*365*24*3600;
        await deployer.deploy(PCoinIncentivesController,
                              PCoin.address,
                              emissionManager,
                              durtime,
                              {from: owner});
        var pcoinIncentivesController = await PCoinIncentivesController.deployed();

        await deployer.deploy(WMATIC_ATOKEN, {from: owner});
        var wmaticAtoken = await WMATIC_ATOKEN.deployed();
        await wmaticAtoken.initialize(
            "Wmatic aToken",
            "aWmatic",
            18,
            pcoinIncentivesController.address,
            minter,
            {from: owner}
        );
        console.log('wmaticAtoken.address=' + wmaticAtoken.address);
        await deployer.deploy(WMATIC_VDTOKEN, {from: owner});
        var wmaticVdtoken = await WMATIC_VDTOKEN.deployed();
        wmaticVdtoken.initialize(
            "Wmatic vdToken",
            "vdWmatic",
            18,
            pcoinIncentivesController.address,
            minter,
            {from: owner}
        );
        console.log('wmaticVdtoken.address=' + wmaticVdtoken.address);
        await deployer.deploy(MINT_TOKEN, {from: owner});
        var mintAtoken = await MINT_TOKEN.deployed();
        mintAtoken.initialize(
            "Mint Token",
            "Mint",
            6,
            pcoinIncentivesController.address,
            minter,
            {from: owner}
        );
        console.log('mintAtoken.address=' + mintAtoken.address);

        var salt = new Buffer("Polylend Farm Factory", "utf-8");
        await deployer.deploy(FarmPoolFactory,
                              PCoin.address,
                              salt,
                              {from: owner});
        console.log('Farm Factory deploys success');

        await deployer.deploy(ERC20, "PCoin Lp Token", "MLPCoin", {from: owner});
        var lpToken = await ERC20.deployed();
        console.log("Lp-token address=" + lpToken.address);

        await deployer.deploy(StakePool, PCoin.address, {from: owner});
        console.log("Stake-reward address=" + PCoin.address);
    }
};
