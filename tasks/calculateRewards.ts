import "@nomiclabs/hardhat-ethers";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
import { RewardAmountPerByteValidationInWei, RewardMultiplierForFirstValidation } from "../scripts/config";

task(
    "calculateRewards",
    "Connects to the original validator and calculates how many tokens must be minted to the rewards validator"
)
    .addParam("contract", "The address of the original validator contract", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const rarityInterface = new hre.ethers.utils.Interface([
            "function rarityConfig(uint256) external view returns (uint32 startTokenId, uint32 endTokenId, uint32 secretSegmentStart, uint32 secretSegmentLength, uint32 bytesPerPiece)",
        ]);
        const rarityContract = new hre.ethers.Contract(taskArgs.contract, rarityInterface, hre.ethers.provider);

        const rarityConfig = [];

        let totalBytesInTokens = 0;
        let totalUniqueBytes = 0;

        const rewardPerByte = BigNumber.from(RewardAmountPerByteValidationInWei);
        const rewardMultiplier = RewardMultiplierForFirstValidation;
        let rarityId = 0;

        while (true) {
            let configItem;
            try {
                configItem = await rarityContract.rarityConfig(rarityId);
            } catch (e) {
                break;
            }

            rarityConfig.push(configItem);

            const numTokens = configItem.endTokenId - configItem.startTokenId + 1;

            totalBytesInTokens += numTokens * configItem.bytesPerPiece;
            totalUniqueBytes += configItem.secretSegmentLength;

            rarityId++;
        }

        const totalRewards = rewardPerByte.mul((rewardMultiplier - 1) * totalUniqueBytes + totalBytesInTokens);

        console.log(`Total rewards: ${totalRewards.toString()}`);
    });
