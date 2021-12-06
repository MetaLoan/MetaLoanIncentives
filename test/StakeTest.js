const StakePool = artifacts.require("StakePool");
const ERC20 = artifacts.require("ERC20");

const BigNumber = require('bignumber.js');

let stakeIns;
let Andy;
let Joan;
let WAY;

var isInit = true;


contract('StakePoolTest', async accounts => {
    beforeEach(async () => {
        if ( isInit ) {
            owner = accounts[0];
            Andy = accounts[1];
            Joan = accounts[2];
            isInit = false;

            await web3.eth.sendTransaction({from: accounts[6], to: Andy, value: '80000000000000000000'});
            await web3.eth.sendTransaction({from: accounts[7], to: Joan, value: '80000000000000000000'});

            stakeIns = await StakePool.deployed();
            PCoinIns = await ERC20.at('0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0');
            var decimals = await PCoinIns.decimals();
            WAY = new BigNumber('10').exponentiatedBy(decimals);
            console.log(await PCoinIns.symbol());
            console.log("name=" + await stakeIns.name());
            console.log("symbol=" + await stakeIns.symbol());
            console.log("_decimals=" + await stakeIns.decimals());

            var MintAmount = new BigNumber('1e+24');
            await PCoinIns.mint(Andy, MintAmount, {from: owner});
            await PCoinIns.mint(Joan, MintAmount, {from: owner});
            MintAmount = new BigNumber('1e+25');
            await PCoinIns.mint(stakeIns.address, MintAmount, {from: owner});

            console.log("Andy PCoin amount=" + new BigNumber(await PCoinIns.balanceOf(Andy)).toString());
            console.log("Joan PCoin amount=" + new BigNumber(await PCoinIns.balanceOf(Joan)).toString());
            console.log("stakeIns PCoin amount=" + new BigNumber(await PCoinIns.balanceOf(stakeIns.address)).toString());

            MintAmount = new BigNumber('5e+23');
            await stakeIns.configIncentivesAmount(MintAmount, {from: owner});
            // andy approve to stakeIns
            MintAmount = new BigNumber('100e+25');
            await PCoinIns.approve(stakeIns.address, MintAmount, {from: Andy});
            await PCoinIns.approve(stakeIns.address, MintAmount, {from: Joan});
        }
    });

    it('Stake', async() => {
        //console.log(new BigNumber(await PCoinIns.allowance(Andy, stakeIns.address)).toString());
        var incentivesInYear = new BigNumber(await stakeIns._incentiveInYear());
        incentivesInYear = incentivesInYear.div(WAY);
        var apy = new BigNumber(await stakeIns._apy());
        console.log('APY=' + apy.toString());
        var StakeAmount = new BigNumber('2e+23');
        await stakeIns.stake(StakeAmount, {from: Andy});
        var AndyStakeBalance = new BigNumber(await stakeIns.balanceOf(Andy));
        var supply = new BigNumber(await stakeIns.totalSupply());
        supply = supply.div(WAY);
        console.log('Andy stake balance=' + AndyStakeBalance.div(WAY).toString());
        console.log('stake supply=' + supply.toString() + ",incentivesInYear=" + incentivesInYear.toString());
        apy = new BigNumber(await stakeIns._apy());
        assert.equal(apy.toNumber(), incentivesInYear.multipliedBy(10000).div(supply).toNumber());

        await stakeIns.stake(StakeAmount, {from: Andy});
        AndyStakeBalance = new BigNumber(await stakeIns.balanceOf(Andy));
        console.log('Andy stake balance=' + AndyStakeBalance.div(WAY).toString());
        StakeAmount = new BigNumber('1e+23');
        var _index = new BigNumber(await stakeIns._index());
        apy = new BigNumber(await stakeIns._apy());
        console.log("_index 11=" + _index.toString() + ",apy=" + apy.toString());
        await stakeIns.stake(StakeAmount, {from: Joan});
        apy = new BigNumber(await stakeIns._apy());
        _index = new BigNumber(await stakeIns._index());
        console.log("_index 22=" + _index.toString() + ",apy=" + apy.toString());
        var JoanStakeBalance = new BigNumber(await stakeIns.balanceOf(Joan));
        apy = new BigNumber(await stakeIns._apy());
        console.log('Joan stake balance=' + JoanStakeBalance.div(WAY).toString());
    });

    it('Unstake', async() => {
        var unStakeAmount = new BigNumber('2e+23');
        await stakeIns.unstake(unStakeAmount, {from: Andy});
        var JoanStakeBalance = new BigNumber(await stakeIns.balanceOf(Joan));
        var AndyStakeBalance = new BigNumber(await stakeIns.balanceOf(Andy));
        console.log("Andy stake balance=" + AndyStakeBalance.div(WAY).toString() +
                    ",Joan stake balance=" + JoanStakeBalance.div(WAY).toString());

        var unStakeAmount = new BigNumber('2e+26');
        await stakeIns.unstake(unStakeAmount, {from: Andy});
        //await stakeIns.unstake(unStakeAmount, {from: Andy});
        await stakeIns.unstake(unStakeAmount, {from: Joan});
        var supply = new BigNumber(await stakeIns.totalSupply());
        assert.equal(supply.toNumber(), 0);
        var pcoinAndyBalance = new BigNumber(await PCoinIns.balanceOf(Andy));
        var pcoinJoanBalance = new BigNumber(await PCoinIns.balanceOf(Joan));
        console.log("Pcoin balance andy=" + pcoinAndyBalance.div(WAY).toString() +
                    " Joan=" + pcoinJoanBalance.div(WAY).toString());
    });

    it('change-incentives', async() => {
        var StakeAmount = new BigNumber('2e+23');
        await stakeIns.stake(StakeAmount, {from: Andy});
        var AndyStakeBalance = new BigNumber(await stakeIns.balanceOf(Andy));
        var supply = new BigNumber(await stakeIns.totalSupply());
        var _index = new BigNumber(await stakeIns._index());
        apy = new BigNumber(await stakeIns._apy());
        console.log("_index 11=" + _index.toString() + ",apy=" + apy.toString());
        console.log("Stake balance andy=" + AndyStakeBalance.div(WAY).toString() + ".supply=" + supply.div(WAY).toString());
        var configAmount = new BigNumber('10e+23');
        await stakeIns.configIncentivesAmount(configAmount, {from: owner});
        _index = new BigNumber(await stakeIns._index());
        apy = new BigNumber(await stakeIns._apy());
        console.log("_index 22=" + _index.toString() + ",apy=" + apy.toString());
        AndyStakeBalance = new BigNumber(await stakeIns.balanceOf(Andy));
        supply = new BigNumber(await stakeIns.totalSupply());
        console.log("Stake 2 balance andy=" + AndyStakeBalance.div(WAY).toString() + ".supply=" + supply.div(WAY).toString());
    });
});