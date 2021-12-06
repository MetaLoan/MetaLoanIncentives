// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {IncentivesProof} from '../core/IncentivesProof.sol';
import {Ownable} from '../lib/Ownable.sol';
import {PolylendIncentivesController} from '../core/PolylendIncentivesController.sol';
import {IERC20Detailed} from '../interfaces/IERC20Detailed.sol';
import {DistributionTypes} from '../lib/DistributionTypes.sol';

import {Farm} from "./Farm.sol";

contract FarmPoolFactory is Ownable {
    struct PoolContext{
        address farm;
        address proof;
    }

    // key asset, value is the address of farm
    mapping (address => PoolContext) internal _farms;
    address[] internal _farmList;
    // PolylendIncentivesController
    PolylendIncentivesController internal _incentivesController;
    // mint distribution duration = 10 years
    uint256 public constant _distributionDuration = 3650 days;

    event CreateFarm(address indexed asset, address farm, address proof);

    /*
    * @dev construct
    * @param salt for create the instance of PolylendIncentivesController
    */
    constructor (
        address pcoin,
        bytes32 salt)
    {
        bytes memory bytecode = type(PolylendIncentivesController).creationCode;
        bytecode = abi.encodePacked(bytecode, abi.encode(pcoin, address(this), _distributionDuration));

        address predictedAddress = address(uint160(uint(keccak256(abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
            ))));
        _incentivesController = new PolylendIncentivesController{salt: salt}(pcoin, address(this), _distributionDuration);
        require(address(_incentivesController) == predictedAddress, 'Create PolylendIncentivesController fail for address');
    }

    function getPolylendIncentivesController()
        external
        view
        returns(address)
    {
        return address(_incentivesController);
    }

    function getFarmList()
        external
        view
        returns(address[] memory)
    {
        return _farmList;
    }

    function getFarm(address implementAsset)
        external
        view
        returns(PoolContext memory farm)
    {
        return _farms[implementAsset];
    }

    /*
    * @dev create farm to mint pcoin by add lp-token
    * @param implementAsset the address of lp-token;
    * @param name the name of farm proof;
    * @param symbol the symbol of farm proof;
    * @param emissionPerSecond the rate of emission in one second.
    */
    function createFarm(
        address implementAsset,
        string calldata name,
        string calldata symbol,
        uint104 emissionPerSecond
    ) external onlyOwner {
        require(_farms[implementAsset].farm == address(0), "Farm has exist");

        // step.1 create incentives proof and farm
        IncentivesProof proof = new IncentivesProof();
        Farm farm = new Farm();

        // step.2 configure asset for incentives controller
        DistributionTypes.AssetConfigInput[] memory input =
        new DistributionTypes.AssetConfigInput[](1);

        input[0].emissionPerSecond = emissionPerSecond;
        input[0].aTokenStaked = 0;
        input[0].aToken = address(proof);
        input[0].variableTokenStaked = 0;
        input[0].variableToken = address(0);
        _incentivesController.configureAssets(input);

        // step.3 initialize for farm and proof
        farm.initialize(implementAsset, address(proof));
        proof.initialize(
            name,
            symbol,
            IERC20Detailed(implementAsset).decimals(),
            address(_incentivesController),
            address(farm)
        );

        // step.4 push farm into _farms
        PoolContext storage pool = _farms[implementAsset];
        pool.farm = address(farm);
        pool.proof = address(proof);
        _farmList.push(implementAsset);

        emit CreateFarm(implementAsset, address(farm), address(proof));
    }
}