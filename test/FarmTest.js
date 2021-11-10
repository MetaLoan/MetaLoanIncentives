const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const Farm = artifacts.require("Farm");
const IncentivesProof = artifacts.require("IncentivesProof");
const ERC20 = artifacts.require("ERC20");
const IncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');


let farmPoolIns;
let pcoinIns;
let owner;
let Andy;
let Joan;
let lpIns;
let icIns;

let WAY;
let isInit = true;

async function printFarmContext(farm) {
    var token = await ERC20.at(farm);
    console.log('Token=' + (await token.symbol()) + ' Farm Context:');
    var farmContext = await farmPoolIns.getFarm(farm);
    var IProof = await IncentivesProof.at(farmContext.proof);
    console.log(' Lp symbol=' + await IProof.symbol());
    console.log(' Lp totalSupply=' + await IProof.totalSupply());
}

contract('FarmPoolFactory', async accounts => {
    beforeEach(async () => {
        if ( isInit ) {
            owner = accounts[0];
            Andy = accounts[1];
            Joan = accounts[2];
            isInit = false;

            farmPoolIns = await FarmPoolFactory.deployed();
            pcoinIns = await ERC20.at('0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0');
            var decimals = await pcoinIns.decimals();
            WAY = new BigNumber('10').exponentiatedBy(decimals);
            console.log(await pcoinIns.symbol());
            icIns = await farmPoolIns.getPolylendIncentivesController();
            icIns = await IncentivesController.at(icIns);
            var MintAmount = new BigNumber('1e+23');
            await pcoinIns.mint(icIns.address, MintAmount, {from: owner});

            lpIns = await ERC20.at('0xAa588d3737B611baFD7bD713445b314BD453a5C8');
        }
    });

    it('Create Farm', async() => {
        var farmList = await farmPoolIns.getFarmList();
        // 0.001 pcoin/sec
        var emissionPerSecond = new BigNumber('0.001');
        emissionPerSecond = emissionPerSecond.multipliedBy(WAY);
        console.log(farmList);
        await farmPoolIns.createFarm(lpIns.address,
                                     'Polylend Farm LP',
                                     'PFLP',
                                     emissionPerSecond,
                                     {from: owner});
        farmList = await farmPoolIns.getFarmList();
        await printFarmContext(farmList[0]);
    });

    it ('Farm-Mint', async() => {
        var farmList = await farmPoolIns.getFarmList();
        var farmContext = await farmPoolIns.getFarm(farmList[0]);

        var farm = await Farm.at(farmContext.farm);
        var MintAmount = new BigNumber('10e+22');
        await lpIns.mint(Andy, MintAmount, {from: owner});
        await lpIns.mint(Joan, MintAmount, {from: owner});

        var depositAmount = new BigNumber('1e+20');
        var approveAmount = new BigNumber('9e+33');
        await lpIns.approve(farm.address, approveAmount, {from: Andy});
        await lpIns.approve(farm.address, approveAmount, {from: Joan});
        await farm.deposit(depositAmount, {from: Andy});

        var proof = await IncentivesProof.at(farmContext.proof);
        var proofBalance = new BigNumber(await proof.balanceOf(Andy));
        //console.log('Andy Lp deposit=' + depositAmount.toNumber() + ",proof=" + proofBalance.toNumber());
        assert.equal(proofBalance.toNumber(), depositAmount.toNumber());

        await farm.deposit(depositAmount, {from: Andy});
        await farm.deposit(depositAmount, {from: Joan});
        var assets = [ farmContext.proof ];
        var rewards = new BigNumber(await icIns.getRewardsBalance(assets, Andy));
        console.log('Andy rewards=' + rewards.div(WAY).toNumber());

        var supply = new BigNumber(await proof.totalSupply());
        assert.equal(supply.toNumber(), depositAmount.multipliedBy(3).toNumber());

        var lpBalance = new BigNumber(await lpIns.balanceOf(Andy));
        console.log('Andy lptokon balance=' + lpBalance.toNumber());
    });

    it ('Farm-Burn', async() => {
        var farmList = await farmPoolIns.getFarmList();
        var farmContext = await farmPoolIns.getFarm(farmList[0]);

        var farm = await Farm.at(farmContext.farm);
        var assets = [ farmContext.proof ];
        var rewards = new BigNumber(await icIns.getRewardsBalance(assets, Andy));
        console.log('Andy rewards=' + rewards.div(WAY).toNumber());

        var withdrawAmount = new BigNumber('1e+20');
        await farm.withdraw(withdrawAmount, {from: Andy});
        var lpBalance = new BigNumber(await lpIns.balanceOf(Andy));
        console.log('Andy lptokon balance=' + lpBalance.toNumber());
        var rewards = new BigNumber(await icIns.getRewardsBalance(assets, Andy));
        console.log('Andy rewards=' + rewards.div(WAY).toNumber());
        rewards = new BigNumber(await icIns.getRewardsBalance(assets, Joan));
        console.log('Joan rewards=' + rewards.div(WAY).toNumber());
        //var MintAmount = new BigNumber('10e+22');
        //await lpIns.mint(Andy, MintAmount, {from: owner});
    });
});