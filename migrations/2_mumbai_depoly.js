const PolylendIncentivesController = artifacts.require("PolylendIncentivesController");
const PCoin = '0xBcEB584cf06e1f67b5654ef4b3Dd4dE4fA3617Dd';

module.exports = async function (deployer, network, accounts) {
    if ( network == 'mumbai' ) {
        console.log(accounts[0], accounts[1]);
        var owner = accounts[0];
        var emissionManager = accounts[1];
        var durtime = 10*365*24*3600;
        await deployer.deploy(PolylendIncentivesController,
                              PCoin,
                              emissionManager,
                              durtime,
                              {from: owner});
    }
};