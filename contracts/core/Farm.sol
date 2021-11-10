// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {IncentivesProof} from '../core/IncentivesProof.sol';
import {Ownable} from '../lib/Ownable.sol';
import {IERC20Detailed} from '../interfaces/IERC20Detailed.sol';
import {Address} from '../lib/Address.sol';
import {SafeERC20} from '../lib/SafeERC20.sol';

contract Farm is Ownable {
    using Address for address;
    using SafeERC20 for IERC20Detailed;

    IncentivesProof internal _proof;
    IERC20Detailed internal _asset;

    /*
    * @dev initialize
    * @param implementAsset The address of erc20 token
    * @param proof The proof for store erc20 token(1:1)
    */
    function initialize(
        address implementAsset,
        address proof
    )
        external
        onlyOwner
    {
        require(implementAsset.isContract(), "farm initialize fail for erc20 invalid");
        require(proof.isContract(), "farm initialize fail for proof invalid");

        _asset = IERC20Detailed(implementAsset);
        _proof = IncentivesProof(proof);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "farm deposit fail for amount = 0");

        _asset.safeTransferFrom(_msgSender(), address(this), amount);
        _proof.mint(_msgSender(), amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "farm withdraw fail for amount = 0");

        uint256 balance = _proof.balanceOf(_msgSender());
        require(balance >= amount, "farm withdraw fail for balance less amount");
        _proof.burn(_msgSender(), amount);
        _asset.safeTransfer(_msgSender(), amount);
    }
}