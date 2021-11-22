// SPDX-License-Identifier: agpl-3.0

pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;

import {IMetaLoanDistributionManager} from '../interfaces/IMetaLoanDistributionManager.sol';

interface IMetaLoanIncentivesController is IMetaLoanDistributionManager {

    function handleAction(
        address user,
        uint256 totalSupply,
        uint256 userBalance
    ) external;

    function getRewardsBalance(address[] calldata assets, address user)
    external
    view
    returns (uint256);

    function claimRewards(
        address[] calldata assets,
        uint256 amount,
        address to
    ) external returns (uint256);

    function retrieve(uint256 amount) external returns(uint256);
}