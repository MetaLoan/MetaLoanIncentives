// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {SafeMath} from '../lib/SafeMath.sol';
import {DebugTool} from '../lib/DebugTool.sol';
import {DistributionTypes} from '../lib/DistributionTypes.sol';
import {Address} from "../lib/Address.sol";

import {IIncentivesProof} from '../interfaces/IIncentivesProof.sol';
import {IPolylendDistributionManager} from "../interfaces/IPolylendDistributionManager.sol";

contract PolylendDistributionManager is IPolylendDistributionManager {
    using SafeMath for uint256;
    using Address for address;

    /******** emission ratio modify algorithm ********/
    /*
         Ut = VDTokenSupply / ATokenSupply
         When VDTokenSupply == 0, aRatio = 100%, vdRatio = 0%;
         When Ut >= Ut_Threshold, aRatio = 100% - vdRatio_min, vdRatio = vdRatio_min;
         When Ut < Ut_Threshold,  vdRatio = vdRatio_max - K*Ut, where K = (vdRatio_max-vdRatio_min)/Ut_Threshold.
    */
    uint256 public constant RATIO_BASE = 10000;    // e.g  Ut=90% => 9000
    uint256 public VdRatioMax;               // the max ratio for VDToken
    uint256 public VdRatioMin;               // the min ratio for VDToken
    uint256 public UtThreshold;              // the threshold for load utilization

    /******** Variable Definition  *********/
    struct AssetData {
        uint128 emissionPerSecond;            // pcoin emission rate in one second for this asset
        uint128 lastUpdateTimestamp;          // the last timestamp fo emission status
        uint256 index;                        // the cumulative emission capacity of each collateral asset
        mapping(address => uint256) users;    // the index for user when it update
        uint64 id;                            // pool id
        uint256 ratio;                        // the emission ratio
    }

    struct AssetAddress {
        address aToken;
        address variableToken;
    }

    address public immutable EMISSION_MANAGER;     // the manager of emission
    uint256 public immutable DISTRIBUTION_END;     // the end time of emission
    uint256 public _PRECISION;

    AssetAddress[] public _assetPool;
    mapping(address => AssetData) public assets;

    /********  Event Definition  *********/
    event AssetIndexUpdated(address indexed asset, uint256 index);
    event UserIndexUpdated(address indexed user, address indexed asset, uint256 index);

    /********  Function Definition  *********/
    constructor(address emissionManager, uint256 distributionDuration) {
        EMISSION_MANAGER = emissionManager;
        DISTRIBUTION_END = block.timestamp.add(distributionDuration);

        VdRatioMax = 9500;
        VdRatioMin = 4000;
        UtThreshold = 9500;
    }

    /**
        * @dev Configures the distribution of rewards for a list of assets
        * @param assetsConfigInput The list of configurations to apply
    **/
    function configureAssets(DistributionTypes.AssetConfigInput[] calldata assetsConfigInput)
        external
        override
    {
        require(msg.sender == EMISSION_MANAGER, 'ONLY_EMISSION_MANAGER');

        for (uint256 i = 0; i < assetsConfigInput.length; i++) {
            AssetData storage atokenConfig = assets[assetsConfigInput[i].aToken];
            AssetData storage variableTokenConfig = assets[assetsConfigInput[i].variableToken];
            require(assetsConfigInput[i].aToken.isContract(), "aToken must contract");

            _updateAssetStateInternal(
                assetsConfigInput[i].aToken,
                atokenConfig,
                assetsConfigInput[i].aTokenStaked
            );

            if ( assetsConfigInput[i].variableToken != address(0) ) {
                require(assetsConfigInput[i].variableToken.isContract(), "variableToken must contract");
                _updateAssetStateInternal(
                    assetsConfigInput[i].variableToken,
                    variableTokenConfig,
                    assetsConfigInput[i].variableTokenStaked
                );
            }

            if ( atokenConfig.ratio == 0 && variableTokenConfig.ratio == 0 ) {
                AssetAddress memory assetAddress;
                assetAddress.aToken = assetsConfigInput[i].aToken;
                assetAddress.variableToken = assetsConfigInput[i].variableToken;
                atokenConfig.id = (uint64)(_assetPool.length);
                variableTokenConfig.id = atokenConfig.id;
                _assetPool.push(assetAddress);
            }
            else {
                if ( atokenConfig.ratio == 0 || variableTokenConfig.ratio == 0 ) {
                    string memory print1 = DebugTool.uintToString((uint)((uint160)(assetsConfigInput[i].aToken)));
                    print1 = DebugTool.strConcat("atoken=", print1);
                    print1 = DebugTool.strConcat(print1, " ratio == 0");
                    require(false, print1);
                }
            }
            // update emissionPerSecond
            atokenConfig.emissionPerSecond = assetsConfigInput[i].emissionPerSecond;
            variableTokenConfig.emissionPerSecond = assetsConfigInput[i].emissionPerSecond;

            if ( atokenConfig.id != variableTokenConfig.id ) {
                string memory print2 = DebugTool.uintToString((uint)((uint160)(assetsConfigInput[i].aToken)));
                print2 = DebugTool.strConcat("atoken(", print2);
                print2 = DebugTool.strConcat(print2, ").id=");
                print2 = DebugTool.strConcat(print2, DebugTool.uintToString(atokenConfig.id));
                print2 = DebugTool.strConcat(print2, " not same to vtoken");
                require(false, print2);
            }
            // update ratio
            _updateRatio(
                atokenConfig,
                assetsConfigInput[i].aTokenStaked,
                variableTokenConfig,
                assetsConfigInput[i].variableTokenStaked
            );
        }
    }

    /*
    * @dev configureParams algorithm param for the mint ratio
    * @params AlgorithmInput the algorithm modify param
    */
    function configureAlgorithmParams(DistributionTypes.AlgorithmInput calldata algorithmInput)
        external
        override
    {
        require(msg.sender == EMISSION_MANAGER, 'ONLY_EMISSION_MANAGER');
        require(algorithmInput.max > algorithmInput.min, 'Params config fail for max <= min');
        require(algorithmInput.max < RATIO_BASE, 'Params config fail for max >= RATIO_BASE');
        require(algorithmInput.threshold < RATIO_BASE, 'Params config fail for threshold >= RATIO_BASE');
        require(algorithmInput.threshold > 0, 'Params config fail for threshold == 0');

        VdRatioMax = algorithmInput.max;
        VdRatioMin = algorithmInput.min;
        UtThreshold = algorithmInput.threshold;
    }

    function getUserIndex(address asset, address user)
        external
        view
        returns (uint256)
    {
        return assets[asset].users[user];
    }

    function getBlockTime()
        external
        view
        returns (uint256)
    {
        return block.timestamp;
    }

    /**
    * @dev Updates the state of one distribution, mainly rewards index and timestamp
    * @param underlyingAsset The address used as key in the distribution, for example sAAVE or the aTokens addresses on Aave
    * @param assetConfig Storage pointer to the distribution's config
    * @param totalStaked Current total of staked assets for this distribution
    * @return The new distribution index
    **/
    function _updateAssetStateInternal(
        address underlyingAsset,
        AssetData storage assetConfig,
        uint256 totalStaked
    ) internal returns (uint256) {
        uint256 oldIndex = assetConfig.index;
        uint128 lastUpdateTimestamp = assetConfig.lastUpdateTimestamp;
        uint128 curTimestamp = uint128(block.timestamp);

        if (curTimestamp == lastUpdateTimestamp) {
            return oldIndex;
        }

        uint256 newIndex =
            _getAssetIndex(oldIndex, assetConfig.emissionPerSecond, lastUpdateTimestamp, totalStaked, assetConfig.ratio);

        if (newIndex != oldIndex) {
            assetConfig.index = newIndex;
            emit AssetIndexUpdated(underlyingAsset, newIndex);
        }

        assetConfig.lastUpdateTimestamp = curTimestamp;

        return newIndex;
    }

    /**
    * @dev Updates the state of an user in a distribution
    * @param user The user's address
    * @param asset The address of the reference asset of the distribution
    * @param stakedByUser Amount of tokens staked by the user in the distribution at the moment
    * @param totalStaked Total tokens staked in the distribution
    * @return The accrued rewards for the user until the moment
    **/
    function _updateUserAssetInternal(
        address user,
        address asset,
        uint256 stakedByUser,
        uint256 totalStaked
    ) internal returns (uint256) {
        if ( asset == address(0) ) {
            return 0;
        }

        AssetData storage assetData = assets[asset];
        uint256 userIndex = assetData.users[user];
        uint256 accruedRewards = 0;

        // update index for asset
        uint256 newIndex = _updateAssetStateInternal(asset, assetData, totalStaked);

        if (userIndex != newIndex) {
            if ( stakedByUser != 0 ) {
                if ( userIndex > 0 ) {
                    accruedRewards = _getRewards(stakedByUser, newIndex, userIndex);
                }
            }

            assetData.users[user] = newIndex;
            emit UserIndexUpdated(user, asset, newIndex);
        }

        if ( assetData.users[user] == 0 ) {
            assetData.users[user] = 1;
        }

        // update ratio between atoken and variable token
        if ( assetData.id < _assetPool.length ) {
            AssetAddress memory assetAddr = _assetPool[assetData.id];
            address otherAsset = address(0);

            if ( assetAddr.aToken == asset ) {
                otherAsset = assetAddr.variableToken;
            }
            else {
                otherAsset = assetAddr.aToken;
            }

            if ( otherAsset != address(0) ) {
                _updateAssetStateInternal(otherAsset, assets[otherAsset], IIncentivesProof(otherAsset).scaledTotalSupply());

                _updateRatio(assets[assetAddr.aToken],
                             IIncentivesProof(assetAddr.aToken).scaledTotalSupply(),
                             assets[assetAddr.variableToken],
                             IIncentivesProof(assetAddr.variableToken).scaledTotalSupply());
            }
        }

        return accruedRewards;
}

    /**
    * @dev Calculates the next value of an specific distribution index, with validations
    * @param currentIndex Current index of the distribution
    * @param emissionPerSecond Representing the total rewards distributed per second per asset unit, on the distribution
    * @param lastUpdateTimestamp Last moment this distribution was updated
    * @param totalBalance of tokens considered for the distribution
    * @param ratio of emission ratio
    * @return The new index.
    **/
    function _getAssetIndex(
        uint256 currentIndex,
        uint256 emissionPerSecond,
        uint128 lastUpdateTimestamp,
        uint256 totalBalance,
        uint256 ratio
    ) internal view returns (uint256) {
        if ( emissionPerSecond == 0 ||
             totalBalance == 0 ||
             lastUpdateTimestamp == block.timestamp ||
             lastUpdateTimestamp >= DISTRIBUTION_END ||
             ratio <= 1 ) {
            return currentIndex;
        }

        uint256 currentTimestamp =
            block.timestamp > DISTRIBUTION_END ? DISTRIBUTION_END : block.timestamp;
        uint256 timeDelta = currentTimestamp.sub(lastUpdateTimestamp, "_getAssetIndex:timestamp current less last");
        uint256 index = emissionPerSecond.mul(timeDelta).mul(_PRECISION);
        if ( ratio < 9999 ) {
            index = index.mul(ratio).div(RATIO_BASE, "_getAssetIndex:div RATIO_BASE = 0");
        }
        index = index.div(totalBalance, "_getAssetIndex:div totalBalance = 0").add(currentIndex);

        return index;
    }

    /**
    * @dev update emission ratio by the total supply between the atoken and variableToken.
    *  algorithm:
    *      Ut = VDTokenSupply / ATokenSupply
    *    When VDTokenSupply == 0, aRatio = 100%, vdRatio = 0%;
    *    When Ut >= Ut_Threshold, aRatio = 100% - vdRatio_min, vdRatio = vdRatio_min;
    *    When Ut < Ut_Threshold,  vdRatio = vdRatio_max - K*Ut, where K = (vdRatio_max-vdRatio_min)/Ut_Threshold.
    * @param aTokenConfig Storage pointer to the distribution's atoken config
    * @param aTokenTotalSupply total supply of the atoken
    * @param variableTokenConfig Storage pointer to the distribution's variable token config
    * @param variableTokenTotalSupply total supply of the variable Token
    **/
    function _updateRatio(
        AssetData storage aTokenConfig,
        uint256 aTokenTotalSupply,
        AssetData storage variableTokenConfig,
        uint256 variableTokenTotalSupply
    ) internal
    {
        if ( variableTokenTotalSupply > 0 && aTokenTotalSupply == 0 ) {
            aTokenConfig.ratio = 1;
            variableTokenConfig.ratio = RATIO_BASE.sub(1, "_updateRatio-1:RATIO_BASE less 1");
            return;
        }

        if ( variableTokenTotalSupply == 0 ) {  // the maximum ratio
            aTokenConfig.ratio = RATIO_BASE.sub(1, "_updateRatio-2:RATIO_BASE less 1");
            variableTokenConfig.ratio = 1;
            return;
        }

        uint256 Ut = variableTokenTotalSupply.mul(RATIO_BASE).div(aTokenTotalSupply, "_updateRatio-1:div aTokenTotalSupply=0");
        if ( Ut >= UtThreshold ) {
            aTokenConfig.ratio = RATIO_BASE.sub(VdRatioMin, "_updateRatio-1:RATIO_BASE less VdRatioMin");
            variableTokenConfig.ratio = VdRatioMin;
        }
        else {
            uint256 x = Ut.mul(VdRatioMax-VdRatioMin).div(UtThreshold, "_updateRatio-1: div UtThreshold=0");
            variableTokenConfig.ratio = VdRatioMax.sub(x, "_updateRatio-1: VdRatioMax less x");
            if ( variableTokenConfig.ratio > VdRatioMax ) {
                variableTokenConfig.ratio = VdRatioMax;
            }
            if ( variableTokenConfig.ratio < VdRatioMin ) {
                variableTokenConfig.ratio = VdRatioMin;
            }
            aTokenConfig.ratio = RATIO_BASE.sub(variableTokenConfig.ratio, "_updateRatio-1: RATIO_BASE less variableTokenConfig.ratio");
        }
    }

    /**
    * @dev Internal function for the calculation of user's rewards on a distribution
    * @param principalUserBalance Amount staked by the user on a distribution
    * @param reserveIndex Current index of the distribution
    * @param userIndex Index stored for the user, representation his staking moment
    * @return The rewards
    **/
    function _getRewards(
        uint256 principalUserBalance,
        uint256 reserveIndex,
        uint256 userIndex
    ) internal view returns (uint256) {
        uint256 tUserIndex = 0;
        if ( userIndex > 1 ) {
            tUserIndex = userIndex;
        }
        return principalUserBalance.mul(reserveIndex.sub(tUserIndex, "_getRewards:reserveIndex less tUserIndex")).div(_PRECISION, "_getRewards:div _PRECISION = 0");

    }

    /**
    * @dev Return the accrued rewards for an user over a list of distribution
    * @param user The address of the user
    * @param stakes List of structs of the user data related with his stake
    * @return The accrued rewards for the user until the moment
    **/
    function _getUnclaimedRewards(address user, DistributionTypes.UserStakeInput[] memory stakes)
        internal
        view
        returns (uint256)
    {
        uint256 accruedRewards = 0;

        for (uint256 i = 0; i < stakes.length; i++) {
            AssetData storage assetConfig = assets[stakes[i].underlyingAsset];
            if ( assetConfig.users[user] > 0 ) {
                uint256 assetIndex =
                    _getAssetIndex(
                    assetConfig.index,
                    assetConfig.emissionPerSecond,
                    assetConfig.lastUpdateTimestamp,
                    stakes[i].totalStaked,
                    assetConfig.ratio
                    );

                accruedRewards = accruedRewards.add(
                    _getRewards(stakes[i].stakedByUser, assetIndex, assetConfig.users[user])
                );
            }
        }
        return accruedRewards;
    }

    /**
    * @dev Used by "frontend" stake contracts to update the data of an user when claiming rewards from there
    * @param user The address of the user
    * @param stakes List of structs of the user data related with his stake
    * @return The accrued rewards for the user until the moment
    **/
    function _claimRewards(address user, DistributionTypes.UserStakeInput[] memory stakes)
        internal
        returns (uint256)
    {
        uint256 accruedRewards = 0;

        for (uint256 i = 0; i < stakes.length; i++) {
            accruedRewards = accruedRewards.add(
                _updateUserAssetInternal(
                user,
                stakes[i].underlyingAsset,
                stakes[i].stakedByUser,
                stakes[i].totalStaked
                )
            );
        }

        return accruedRewards;
    }
}