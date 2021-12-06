const FarmPoolFactory = artifacts.require("FarmPoolFactory");
const Farm = artifacts.require("Farm");
const IncentivesProof = artifacts.require("IncentivesProof");
const ERC20 = artifacts.require("ERC20");
const IncentivesController = artifacts.require("PolylendIncentivesController");
const BigNumber = require('bignumber.js');


let farmPoolIns;
let PCoinIns;
let owner;
let Andy;
let Joan;
let lpIns;
let icIns;

let WAY;
let isInit = true;

async function PrintAsset(data, symbol) {
    console.log("Asset=" + symbol + " emission param:");
    console.log(" id=" + data.id);
    console.log(" emissionPerSecond=" + data.emissionPerSecond);
    console.log(" lastUpdateTimestamp=" + data.lastUpdateTimestamp);
    console.log(" index=" + data.index);
    console.log(" ratio=" + data.ratio);
}

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

            await web3.eth.sendTransaction({from: accounts[6], to: Andy, value: '80000000000000000000'});
            await web3.eth.sendTransaction({from: accounts[7], to: Joan, value: '80000000000000000000'});
            console.log("ddd=" + new BigNumber(await web3.eth.getBalance(Andy)).toString());

            farmPoolIns = await FarmPoolFactory.deployed();
            PCoinIns = await ERC20.at('0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0');
            var decimals = await PCoinIns.decimals();
            WAY = new BigNumber('10').exponentiatedBy(decimals);
            console.log(await PCoinIns.symbol());
            icIns = await farmPoolIns.getPolylendIncentivesController();
            icIns = await IncentivesController.at(icIns);
            console.log("_PRECISION=" + await icIns._PRECISION());
            var MintAmount = new BigNumber('1e+23');
            await PCoinIns.mint(icIns.address, MintAmount, {from: owner});

            lpIns = await ERC20.at('0xAa588d3737B611baFD7bD713445b314BD453a5C8');
        }
    });

    it('Create Farm', async() => {
        var farmList = await farmPoolIns.getFarmList();
        // 0.001 PCoin/sec
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
        var farmContext = await farmPoolIns.getFarm(farmList[0]);
        var mintEmissionParams = await icIns.assets(farmContext.proof);
        await PrintAsset(mintEmissionParams, 'PFLP');
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
        console.log('Andy Lp deposit=' + depositAmount.toNumber() + ",proof=" + proofBalance.toNumber());
        //assert.equal(proofBalance.toNumber(), depositAmount.toNumber());
        approveAmount = new BigNumber(await lpIns.allowance(Andy, farm.address));
        console.log('Andy Lp deposit=' + depositAmount.toNumber() + ";" + approveAmount.toNumber());
        console.log("xxxx=" + new BigNumber(await web3.eth.getBalance(Andy)).toString());
        var mintEmissionParams = await icIns.assets(farmContext.proof);
        await PrintAsset(mintEmissionParams, 'PFLP');
        console.log(new BigNumber(await icIns.getUserIndex(farmContext.proof, Andy)).toNumber());
        console.log(new BigNumber(await icIns.getBlockTime()).toNumber());
        await farm.deposit(depositAmount, {from: Andy, gasPrice: 10000000000000, gas:4712388});
        //console.log(new BigNumber(await icIns.getUserIndex(farmContext.proof, Andy)).toNumber());
        //console.log(new BigNumber(await icIns.getBlockTime()).toNumber());
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