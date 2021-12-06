// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {Ownable} from '../lib/Ownable.sol';
import {SafeERC20} from '../lib/SafeERC20.sol';
import {SafeMath} from '../lib/SafeMath.sol';
import {IERC20Detailed} from '../interfaces/IERC20Detailed.sol';
import {IStakeToken} from '../interfaces/IStakeToken.sol';


contract StakePool is Ownable, IStakeToken {
    using SafeERC20 for IERC20Detailed;
    using SafeMath for uint256;

    /**** the incentives context for stake pool ****/
    uint256 public _incentiveInYear;                    // the amount of incentives in one year
    uint256 constant public APY_BASE = 10000;           // the base value of apy
    uint256 constant public APY_MAX = 50000;            // the max APY for stake is 500%
    uint256 public _apy;                                // the apy for stake
    uint256 constant public INDEX_BASE = 10**10;
    uint256 public _index;                             // the index for incentive
    uint256 internal _latestTimestamp;                   // the last update timestamp
    uint256 internal constant SECONDS_PER_YEAR = 365 days;

    /**** the stake proof ****/
    string constant public NAME = "PCOIN Stake Proof";
    string constant internal SYMBOL = "SPPCoin";
    uint8 internal _decimals;                           // the decimals for stake token
    uint256 internal _totalSupply;                      // the stake totalSupply contains principal and reward
    mapping (address => uint256) _balance;              // the stake balance for user contains principal and reward

    /**** the reward context ****/
    IERC20Detailed public immutable _REWARD;            // reward token

    constructor(address asset)
    {
        _REWARD = IERC20Detailed(asset);

        _decimals = _REWARD.decimals();
        _index = INDEX_BASE;
        _apy = APY_MAX;

        _incentiveInYear = 10000*(10**_decimals);
    }

    /*
    * @dev configIncentiveAmount config the incentives amount for one year
    * @params amount
    */
    function configIncentivesAmount(uint256 amount)
        external onlyOwner
    {
        require(amount > 0, 'Incentive amount > 0');
        _incentiveInYear = amount;
        _updateApy();
    }

    function stake(uint256 amount) external virtual override
    {
        address account = _msgSender();
        require(amount > 0, "stake amount must > 0");
        _updateIndex();
        _REWARD.safeTransferFrom(account, address(this), amount);
        uint256 balance = _balance[account];
        _balance[account] = balance.add(amount.mul(INDEX_BASE).div(_index));
        _totalSupply = _totalSupply.add(amount.mul(INDEX_BASE).div(_index));
        _updateApy();

        emit Stake(account, amount);
    }

    function unstake(uint256 amount) external virtual override
    {
        address account = _msgSender();
        uint256 balance = _balance[account];
        uint256 unstakeBalance = 0;

        _updateIndex();

        balance = balance.mul(_index).div(INDEX_BASE);
        require(amount > 0 && balance > 0, "unstake amount & balance must > 0");
        if ( amount > balance ) {
            unstakeBalance = balance;
            _totalSupply = _totalSupply.sub(_balance[account]);
            _balance[account] = 0;
        }
        else {
            balance = amount.mul(INDEX_BASE).div(_index);
            _totalSupply = _totalSupply.sub(balance, "Sub amount more than _totalSupply");
            _balance[account] = _balance[account].sub(balance, "Sub amount more than balance");
            unstakeBalance = amount;
        }

        _REWARD.safeTransfer(account, unstakeBalance);
        _updateApy();
        emit UnStake(account, amount);
    }

    function symbol() external view virtual override returns (string memory) {
        return SYMBOL;
    }

    function name() external view virtual override returns (string memory) {
        return NAME;
    }

    function decimals() external virtual override view returns (uint8) {
        return _decimals;
    }

    function balanceOf(address account) external virtual view returns (uint256) {
        uint256 curIndex = _getcurIndex();
        return _balance[account].mul(curIndex).div(INDEX_BASE);
    }

    function totalSupply() external virtual view returns (uint256) {
        return _computeTotalsupply();
    }

    function _computeTotalsupply() internal view returns(uint256) {
        uint256 curIndex = _getcurIndex();
        return _totalSupply.mul(curIndex).div(INDEX_BASE);
    }

    /*
    * @dev _getcurIndex recompute index by timestamp
    */
    function _getcurIndex() internal view returns(uint256) {
        uint256 curtimestamp = block.timestamp;
        uint256 curIndex = 0;
        if ( curtimestamp > _latestTimestamp ) {
            curIndex = _computeIncrement(curtimestamp);
        }
        curIndex = _index.add(curIndex);
        return curIndex;
    }

    /*
    * @dev _updateIndex update _index by apy and timestamp
    */
    function _updateIndex() internal {
        uint256 addIndex = 0;
        uint256 curTimestamp = block.timestamp;
        if ( _latestTimestamp > 0 && curTimestamp > _latestTimestamp ) {
            addIndex = _computeIncrement(curTimestamp);
        }
        _index = _index.add(addIndex);
        _latestTimestamp = curTimestamp;
    }

    /*
    * @dev _updateApy update _apy by user stake/unstake token
    *   algorithm:
    *      1. if compute incentives amount by supply less than incentives in year, it will set apy = max;
    *      2. or else, apy = ( incentives in year ) / supply base on APY_BASE
    */
    function _updateApy() internal {
        uint256 supply = _computeTotalsupply();
        if ( supply > 0 ) {
            if ( supply.mul(_apy).div(APY_BASE) <= _incentiveInYear ) {
                _apy = APY_MAX;
            }
            else {
                _apy = _incentiveInYear.mul(APY_BASE).div(supply);
            }
        }
        else {
            _apy = APY_MAX;
        }
    }

    /*
    * @dev _computeIncrement:
    *   first compute current annual income with INDEX_BASE and apy
    *   second compute income by timestamp and current annual income
    */
    function _computeIncrement(uint256 timestamp) internal view returns(uint256) {
        uint256 increment = INDEX_BASE.mul(_apy).div(APY_BASE);
        uint256 diffTimestamp = timestamp.sub(_latestTimestamp);
        return increment.mul(diffTimestamp).div(SECONDS_PER_YEAR);
    }
}