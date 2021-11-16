// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

library DistributionTypes {
    struct AssetConfigInput {
        uint104 emissionPerSecond;
        uint256 aTokenStaked;
        address aToken;
        uint256 variableTokenStaked;
        address variableToken;
    }

    struct UserStakeInput {
        address underlyingAsset;
        uint256 stakedByUser;
        uint256 totalStaked;
    }

    struct AlgorithmInput {
        uint256 max;
        uint256 min;
        uint256 threshold;
    }
}