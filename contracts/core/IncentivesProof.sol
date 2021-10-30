// SPDX-License-Identifier: agpl-3.0

pragma solidity ^0.8.0;

import {Address} from '../lib/Address.sol';
import {Ownable} from '../lib/Ownable.sol';
import {SafeMath} from '../lib/SafeMath.sol';
import {IIncentivesProof} from '../interfaces/IIncentivesProof.sol';
import {IPolylendIncentivesController} from '../interfaces/IPolylendIncentivesController.sol';

contract IncentivesProof is IIncentivesProof, Ownable {
    using Address for address;
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    IPolylendIncentivesController internal _incentivesController;
    address private _minter;

    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address incentivesController,
        address minter_
    ) external override onlyOwner
    {
        require(incentivesController.isContract(), "IncentivesProof initialize fail for address invalid");
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _incentivesController = (IPolylendIncentivesController)(incentivesController);
        _minter = minter_;
    }

    function mint(address user, uint256 amount) external override virtual {
        require(_msgSender() == _minter, "Proof: minter invalid");

        uint256 preBalance = _balances[user];
        uint256 preTotabSupply = _totalSupply;

        _balances[user] = preBalance.add(amount);
        _totalSupply = preTotabSupply.add(amount);

        if ( address(_incentivesController) != address(0) ) {
            _incentivesController.handleAction(user, preTotabSupply, preBalance);
        }

        emit Mint(user, amount);
    }

    function burn(address user, uint256 amount) external override virtual {
        require(_msgSender() == _minter, "Proof: burner invalid");

        uint256 preBalance = _balances[user];
        uint256 preTotabSupply = _totalSupply;

        _balances[user] = preBalance.sub(amount, "Proof: burn amount exceeds balance");
        _totalSupply = preTotabSupply.sub(amount, "Proof: burn amount exceeds totalSupply");

        if ( address(_incentivesController) != address(0) ) {
            _incentivesController.handleAction(user, preTotabSupply, preBalance);
        }

        emit Burn(user, amount);
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        uint256 ownerBalance = _balances[owner];
        uint256 spenderBalance = _balances[spender];
        if ( ownerBalance > spenderBalance ) {
            return 0;
        }
        else {
            return 0;
        }
    }

    function approve(address spender, uint256 amount) external override pure returns (bool) {
        if ( spender != address(0) || amount > 0 ) {
            return false;
        }
        return false;
    }

    function transfer(address recipient, uint256 amount)
        external
        override
        pure
        returns (bool)
    {
        if ( recipient != address(0) || amount > 0 ) {
            return false;
        }
        return false;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    )
        external
        override
        pure
        returns (bool)
    {
        if ( sender != address(0) || recipient != address(0) || amount > 0 ) {
            return false;
        }
        return false;
    }

}