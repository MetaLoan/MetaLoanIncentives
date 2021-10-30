const ERC20 = artifacts.require("ERC20");
const WMATIC_ATOKEN = artifacts.require("ERC20");
const WMATIC_VDTOKEN = artifacts.require("ERC20");
const MINT_TOKEN = artifacts.require("ERC20");
const PCoinIncentivesController = artifacts.require("PolylendIncentivesController");

module.exports = async function (deployer, network, accounts) {
    if ( network == 'test' ) {
        var owner = accounts[0];
        var emissionManager = accounts[1];

        await deployer.deploy(ERC20, "Polylend Token", "PCoin", {from: owner});
        var PCoin = await ERC20.deployed();

        let timestamp = (await web3.eth.getBlock()).timestamp;
        console.log('PCoin.address=' + PCoin.address + ",timestamp=" + timestamp);

        var durtime = 10*365*24*3600;
        await deployer.deploy(PCoinIncentivesController,
                              PCoin.address,
                              emissionManager,
                              durtime,
                              {from: owner});

        await deployer.deploy(WMATIC_ATOKEN, "Wmatic aToken", "aWmatic", {from: owner});
        var wmaticAtoken = await ERC20.deployed();
        console.log('wmaticAtoken.address=' + wmaticAtoken.address);
        await deployer.deploy(WMATIC_VDTOKEN, "Wmatic vdToken", "vdWmatic", {from: owner});
        var wmaticVdtoken = await ERC20.deployed();
        console.log('wmaticVdtoken.address=' + wmaticVdtoken.address);
        await deployer.deploy(MINT_TOKEN, "Mint Token", "mint", {from: owner});
        var mintAtoken = await ERC20.deployed();
        console.log('mintAtoken.address=' + mintAtoken.address);
    }
};
