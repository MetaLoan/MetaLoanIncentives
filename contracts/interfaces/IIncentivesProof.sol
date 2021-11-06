// SPDX-License-Identifier: agpl-3.0

pragma solidity ^0.8.0;

import {IERC20Detailed} from './IERC20Detailed.sol';

/**
* @dev Interface of incentives proof
*
**/
interface IIncentivesProof is IERC20Detailed {

    /*
    * @dev initialize incentives proof context
    * @param name_ the name of incentives proof
    * @param symbol_ the symbol of incentives proof
    * @param decimals_ the decimals of incentives proof
    * @param incentivesController which control incentives by proof
    * @param minter who has role to mint the proof
    */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address incentivesController,
        address minter_
    ) external;

    /*
    * @dev mint 'amount' for user
    * @param user The address receiving the minted tokens
    * @param amount The amount of tokens getting minted
    */
    function mint(address user, uint256 amount) external;

    /*
    * @dev burn 'amount' from user
    * @param user The owner of the proof, getting them burned
    * @param amount The amount being burned
    */
    function burn(address user, uint256 amount) external;

    /**
     * @dev Returns the scaled balance of the user. The scaled balance is the sum of all the
     * updated stored balance divided by the reserve's liquidity index at the moment of the update
     * @param account The account whose balance is calculated
     * @return The scaled balance of the user
     **/
    function scaledBalanceOf(address account) external view returns (uint256);

    /**
     * @dev Returns the scaled total supply of the variable debt token. Represents sum(debt/index)
     * @return The scaled total supply
     **/
    function scaledTotalSupply() external view returns (uint256);

    /*
    * @dev mint event is called by user who is minted token
    * @param user who mint token
    * @param amount the mint value of token
    */
    event Mint(address indexed user, uint256 amount);

    /*
    * @dev burn event is called by user who is burned token
    * @param user who burn token
    * @param amount the burn value of token
    */
    event Burn(address indexed user, uint256 amount);
}