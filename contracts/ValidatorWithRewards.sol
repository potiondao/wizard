// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IValidator {
    function validate(
        uint256 tokenId,
        bytes calldata decryptedSecret,
        bytes32[] calldata proof
    ) external returns (uint256);
}

contract ValidatorWithRewards {
    using SafeERC20 for IERC20;

    IValidator public validator;
    IERC20 public rewardToken;
    uint256 public rewardPerByte;
    uint256 public firstValidationRewardMultiplier;
    mapping(uint256 => bool) public isSecretValidated;
    mapping(uint256 => bool) public isTokenValidated;

    constructor(
        address _validator,
        address _rewardToken,
        uint256 _rewardPerByte,
        uint256 _firstValidationRewardMultiplier
    ) {
        validator = IValidator(_validator);
        rewardToken = IERC20(_rewardToken);
        rewardPerByte = _rewardPerByte;
        firstValidationRewardMultiplier = _firstValidationRewardMultiplier;
    }

    function validate(
        uint256 tokenId,
        bytes calldata decryptedSecret,
        bytes32[] calldata proof
    ) external {
        require(isTokenValidated[tokenId] == false, "Token already validated");

        uint256 secretId = validator.validate(tokenId, decryptedSecret, proof);

        uint256 rewardAmount = rewardPerByte * decryptedSecret.length;

        if (!isSecretValidated[secretId]) {
            rewardAmount *= firstValidationRewardMultiplier;

            isSecretValidated[secretId] = true;
        }

        rewardToken.safeTransfer(msg.sender, rewardAmount);
    }

    function validateList(
        uint256[] calldata tokenIds,
        bytes[] calldata decryptedSecrets,
        bytes32[][] calldata proofs
    ) external {
        uint256 totalRewardAmount = 0;

        for (uint256 i = 0; i < tokenIds.length; ++i) {
            if (isTokenValidated[tokenIds[i]]) {
                continue;
            }

            uint256 secretId = validator.validate(tokenIds[i], decryptedSecrets[i], proofs[i]);

            if (!isSecretValidated[secretId]) {
                totalRewardAmount += decryptedSecrets[i].length * rewardPerByte * firstValidationRewardMultiplier;

                isSecretValidated[secretId] = true;
            } else {
                totalRewardAmount += decryptedSecrets[i].length * rewardPerByte;
            }
        }

        rewardToken.safeTransfer(msg.sender, totalRewardAmount);
    }
}
