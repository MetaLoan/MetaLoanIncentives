// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

interface IStakeToken {

    event Stake(address account, uint256 amount);
    event UnStake(address account, uint256 amount);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);

    /*
    *@dev stake for account lock token into pool
    *@params amount the lock amount of token
    */
    function stake(uint256 amount) external;

    /*
    * @dev unstake for account unlock token form pool
    * @params amount the unlock amount of token
    */
    function unstake(uint256 amount) external;
}