const ERC20 = artifacts.require("ERC20");
const WMATIC_ATOKEN = artifacts.require("IncentivesProof");
const WMATIC_VDTOKEN = artifacts.require("IncentivesProof");
const MINT_TOKEN = artifacts.require("IncentivesProof");
const MCoinIncentivesController = artifacts.require("MetaLoanIncentivesController");
const FarmPoolFactory = artifacts.require("FarmPoolFactory");

module.exports = async function (deployer, network, accounts) {
    if ( network == 'test' ) {
        var owner = accounts[0];
        var emissionManager = accounts[1];
        var minter = accounts[2];

        await deployer.deploy(ERC20, "MetaLoan Token", "MCoin", {from: owner});
        var MCoin = await ERC20.deployed();
        console.log("MCoin address=" + MCoin.address);

        let timestamp = (await web3.eth.getBlock()).timestamp;
        console.log('MCoin.address=' + MCoin.address + ",timestamp=" + timestamp);

        var durtime = 10*365*24*3600;
        await deployer.deploy(MCoinIncentivesController,
                              MCoin.address,
                              emissionManager,
                              durtime,
                              {from: owner});
        var mcoinIncentivesController = await MCoinIncentivesController.deployed();

        await deployer.deploy(WMATIC_ATOKEN, {from: owner});
        var wmaticAtoken = await WMATIC_ATOKEN.deployed();
        await wmaticAtoken.initialize(
            "Wmatic aToken",
            "aWmatic",
            18,
            mcoinIncentivesController.address,
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
            mcoinIncentivesController.address,
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
            mcoinIncentivesController.address,
            minter,
            {from: owner}
        );
        console.log('mintAtoken.address=' + mintAtoken.address);

        var salt = new Buffer("MetaLoan Farm Factory", "utf-8");
        await deployer.deploy(FarmPoolFactory,
                              MCoin.address,
                              salt,
                              {from: owner});
        console.log('Farm Factory deploys success');

        await deployer.deploy(ERC20, "MCoin Lp Token", "MLPCoin", {from: owner});
        var lpToken = await ERC20.deployed();
        console.log("Lp-token address=" + lpToken.address);
    }
};
