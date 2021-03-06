import "@nomiclabs/hardhat-ethers";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";

import ImmutableCreate2FactoryABI from "../abis/ImmutableCreate2Factory.json";
import {
    metamorphicContracts,
    OriginalValidatorAddress,
    TotalRewardsAmountInWei,
    RewardAmountPerByteValidationInWei,
    RewardMultiplierForFirstValidation,
    SaltPadding,
} from "../scripts/config";

task(
    "generateProposal",
    "Generates a SafeSnap proposal to deploy the MagicToken contract and to deploy the ValidatorWithRewards contract"
)
    .addParam("proposer", "The wallet address of the proposer", undefined, types.string, false)
    .addParam("multisig", "The address of the multisig wallet", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        //
        // Immutable Create2 Factory
        //

        // Get the contract address
        if (!(hre.network.name in metamorphicContracts)) {
            throw new Error(`No Metamorphic contracts found for network: ${hre.network.name}`);
        }

        const metamorphicContractAddress = metamorphicContracts[hre.network.name];

        // Generate the factory deployment parameters
        const immutableFactoryInterface = new hre.ethers.utils.Interface(ImmutableCreate2FactoryABI);

        // Get the function prototype
        const safeCreate2Prototype = immutableFactoryInterface
            .getFunction("safeCreate2")
            .format(hre.ethers.utils.FormatTypes.full);

        // The salt contains the multisig address at the beginning to avoid somebody else
        // frontrunning the transaction
        const salt = taskArgs.multisig + SaltPadding;

        //
        // MagicToken proposal
        //
        const tokenFactory = await hre.ethers.getContractFactory("MagicToken");
        const tokenInterface = tokenFactory.interface;
        const tokenBytecode = tokenFactory.bytecode;

        const tokenPayload = tokenInterface.encodeDeploy([taskArgs.proposer, taskArgs.multisig]);

        const tokenDeployBytecode = tokenBytecode + tokenPayload.substring(2);

        const tokenDeploymentAddress = hre.ethers.utils.getCreate2Address(
            metamorphicContractAddress,
            salt,
            hre.ethers.utils.keccak256(tokenDeployBytecode)
        );

        //
        // ValidatorWithRewards proposal
        //
        const validatorWithRewardsFactory = await hre.ethers.getContractFactory("ValidatorWithRewards");
        const validatorWithRewardsInterface = validatorWithRewardsFactory.interface;
        const validatorWithRewardsBytecode = validatorWithRewardsFactory.bytecode;

        const validatorWithRewardsPayload = validatorWithRewardsInterface.encodeDeploy([
            OriginalValidatorAddress,
            tokenDeploymentAddress,
            RewardAmountPerByteValidationInWei,
            RewardMultiplierForFirstValidation,
        ]);

        const validatorWithRewardsDeployBytecode =
            validatorWithRewardsBytecode + validatorWithRewardsPayload.substring(2);

        const validatorWithRewardsDeploymentAddress = hre.ethers.utils.getCreate2Address(
            metamorphicContractAddress,
            salt,
            hre.ethers.utils.keccak256(validatorWithRewardsDeployBytecode)
        );

        //
        // Mint rewards to validator contract
        //
        const totalRewardsAmount = BigNumber.from(TotalRewardsAmountInWei);
        const tokenMintPrototype = tokenInterface.getFunction("mint").format(hre.ethers.utils.FormatTypes.full);

        //
        // Proposals
        //
        console.log("--------------------------------------------------------------------------------");
        console.log("[TX1] Parameters for the MagicToken Snapshot Proposal");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${metamorphicContractAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${safeCreate2Prototype}"]`);
        console.log(`    salt (bytes32):             ${salt}`);
        console.log(`    initializationCode (bytes): ${tokenDeployBytecode}`);
        console.log(`\nContract will be deployed at address ${tokenDeploymentAddress}`);
        console.log("--------------------------------------------------------------------------------\n");

        console.log("--------------------------------------------------------------------------------");
        console.log("[TX2] Parameters for the ValidatorWithRewards Snapshot Proposal");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${metamorphicContractAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${safeCreate2Prototype}"]`);
        console.log(`    salt (bytes32):             ${salt}`);
        console.log(`    initializationCode (bytes): ${validatorWithRewardsDeployBytecode}`);
        console.log(`\nContract will be deployed at address ${validatorWithRewardsDeploymentAddress}`);
        console.log("--------------------------------------------------------------------------------\n");

        console.log("--------------------------------------------------------------------------------");
        console.log("[TX3] Parameters to mint the rewards to the ValidatorWithRewards contract");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${tokenDeploymentAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${tokenMintPrototype}"]`);
        console.log(`    to (address):               ${validatorWithRewardsDeploymentAddress}`);
        console.log(`    amount (uint256):           ${totalRewardsAmount.toString()}`);
        console.log("--------------------------------------------------------------------------------\n");
    });
