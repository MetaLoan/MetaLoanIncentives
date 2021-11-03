// SPDX-License-Identifier: agpl-3.0

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {SafeMath} from '../lib/SafeMath.sol';
import {DistributionTypes} from '../lib/DistributionTypes.sol';

import {IERC20Detailed} from '../interfaces/IERC20Detailed.sol';
import {IPolylendIncentivesController} from '../interfaces/IPolylendIncentivesController.sol';
import {VersionedInitializable} from '../utils/VersionedInitializable.sol';
import {PolylendDistributionManager} from './PolylendDistributionManager.sol';
import {Address} from '../lib/Address.sol';

import {DebugTool} from '../lib/DebugTool.sol';

contract PolylendIncentivesController is IPolylendIncentivesController,
                                         VersionedInitializable,
                                         PolylendDistributionManager
{
    using SafeMath for uint256;
    using Address for address;

    /******* Variable Definition ********/
    uint256 public constant REVISION = 1;
    // reward token
    IERC20Detailed public immutable REWARD_TOKEN;
    // the unclaimed rewards of user
    mapping(address => uint256) internal _usersUnclaimedRewards;

    /******* Event Definition ********/
    event RewardsAccrued(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, address indexed to, uint256 amount);

    /*********  Function Definition  *********/
    constructor(
        address pcoin,
        address emissionManager,
        uint256 distributionDuration
    ) PolylendDistributionManager(emissionManager, distributionDuration)
    {
        require(pcoin.isContract(), "Pcoin is not contract");
        REWARD_TOKEN = IERC20Detailed(pcoin);
        _PRECISION = 10**(uint256(REWARD_TOKEN.decimals()));
    }

    /*
    * @dev handleAction
    */
    function handleAction(
        address user,
        uint256 totalSupply,
        uint256 userBalance
    )
        external
        override
    {
        uint256 accruedRewards = _updateUserAssetInternal(user, msg.sender, userBalance, totalSupply);
        if (accruedRewards != 0) {
            _usersUnclaimedRewards[user] = _usersUnclaimedRewards[user].add(accruedRewards);
            emit RewardsAccrued(user, accruedRewards);
        }
    }

    /*
    * @dev getRewardsBalance
    */
    function getRewardsBalance(address[] calldata assets, address user)
        external
        override
        view
        returns (uint256)
    {
        uint256 unclaimedRewards = _usersUnclaimedRewards[user];
        DistributionTypes.UserStakeInput[] memory userState =
            new DistributionTypes.UserStakeInput[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            userState[i].underlyingAsset = assets[i];
            userState[i].stakedByUser = IERC20Detailed(assets[i]).balanceOf(user);
            userState[i].totalStaked = IERC20Detailed(assets[i]).totalSupply();
        }
        unclaimedRewards = unclaimedRewards.add(_getUnclaimedRewards(user, userState));

        uint256 balance = REWARD_TOKEN.balanceOf(address(this));
        if ( balance < unclaimedRewards ) {
            unclaimedRewards = balance;
        }
        return unclaimedRewards;
    }

    function claimRewards(
        address[] calldata assets,
        uint256 amount,
        address to
    )
        external
        override
        returns (uint256)
    {
        if (amount == 0) {
            return 0;
        }
        address user = msg.sender;
        uint256 unclaimedRewards = _usersUnclaimedRewards[user];

        DistributionTypes.UserStakeInput[] memory userState =
            new DistributionTypes.UserStakeInput[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            userState[i].underlyingAsset = assets[i];
            userState[i].stakedByUser = IERC20Detailed(assets[i]).balanceOf(user);
            userState[i].totalStaked = IERC20Detailed(assets[i]).totalSupply();
        }

        uint256 accruedRewards = _claimRewards(user, userState);
        if (accruedRewards != 0) {
            unclaimedRewards = unclaimedRewards.add(accruedRewards);
            emit RewardsAccrued(user, accruedRewards);
        }

        if (unclaimedRewards == 0) {
            return 0;
        }

        uint256 amountToClaim = amount > unclaimedRewards ? unclaimedRewards : amount;
        _usersUnclaimedRewards[user] = unclaimedRewards - amountToClaim; // Safe due to the previous line

        uint256 balance = REWARD_TOKEN.balanceOf(address(this));

        if ( amountToClaim > balance ) {
            amountToClaim = balance;
        }

        if ( amountToClaim > 0 ) {
            REWARD_TOKEN.transfer(to, amountToClaim);
        }
        else {
            require(false, 'reward fail for incentives pool is empty');
        }

        emit RewardsClaimed(msg.sender, to, amountToClaim);
        return amountToClaim;
    }

    /**
    * @dev returns the unclaimed rewards of the user
    * @param _user the address of the user
    * @return the unclaimed user rewards
    */
    function getUserUnclaimedRewards(address _user) external view returns (uint256) {
        return _usersUnclaimedRewards[_user];
    }

    /**
       * @dev returns the revision of the implementation contract
    */
    function getRevision() internal pure override returns (uint256) {
        return REVISION;
    }
}


