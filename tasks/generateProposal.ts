import "@nomiclabs/hardhat-ethers";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";

import ImmutableCreate2FactoryABI from "../abis/ImmutableCreate2Factory.json";
import {
    metamorphicContracts,
    TotalRewardsAmountInWei,
    ProposerRewardsInWei,
    MerkleRoot,
    DistributionStartTime,
    DistributionDuration,
    SaltPadding,
} from "../scripts/config";

task(
    "generateProposal",
    "Generates a SafeSnap proposal to deploy the PotionToken contract and to deploy the ValidatorWithRewards contract"
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
        // PotionToken proposal
        //
        const tokenFactory = await hre.ethers.getContractFactory("PotionToken");
        const tokenInterface = tokenFactory.interface;
        const tokenBytecode = tokenFactory.bytecode;

        const tokenPayload = tokenInterface.encodeDeploy([taskArgs.multisig]);

        const tokenDeployBytecode = tokenBytecode + tokenPayload.substring(2);

        const tokenDeploymentAddress = hre.ethers.utils.getCreate2Address(
            metamorphicContractAddress,
            salt,
            hre.ethers.utils.keccak256(tokenDeployBytecode)
        );

        //
        // VestedMerkleDistributor proposal
        //
        const vestedMerkleDistributorFactory = await hre.ethers.getContractFactory("VestedMerkleDistributor");
        const vestedMerkleDistributorInterface = vestedMerkleDistributorFactory.interface;
        const vestedMerkleDistributorBytecode = vestedMerkleDistributorFactory.bytecode;

        const vestedMerkleDistributorPayload = vestedMerkleDistributorInterface.encodeDeploy([
            MerkleRoot,
            tokenDeploymentAddress,
            DistributionStartTime,
            DistributionDuration,
        ]);

        const vestedMerkleDistributorDeployBytecode =
        vestedMerkleDistributorBytecode + vestedMerkleDistributorPayload.substring(2);

        const vestedMerkleDistributorDeploymentAddress = hre.ethers.utils.getCreate2Address(
            metamorphicContractAddress,
            salt,
            hre.ethers.utils.keccak256(vestedMerkleDistributorDeployBytecode)
        );

        //
        // Mint rewards to validator contract
        //
        const totalRewardsAmount = BigNumber.from(TotalRewardsAmountInWei);

        //
        // Mint rewards to proposer
        //
        const proposerRewardsAmount = BigNumber.from(ProposerRewardsInWei);

        const tokenMintPrototype = tokenInterface.getFunction("mint").format(hre.ethers.utils.FormatTypes.full);

        //
        // Proposals
        //
        console.log("--------------------------------------------------------------------------------");
        console.log("[TX1] Parameters for the PotionToken Snapshot Proposal");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${metamorphicContractAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${safeCreate2Prototype}"]`);
        console.log(`    salt (bytes32):             ${salt}`);
        console.log(`    initializationCode (bytes): ${tokenDeployBytecode}`);
        console.log(`\nContract will be deployed at address ${tokenDeploymentAddress}`);
        console.log("--------------------------------------------------------------------------------\n");

        console.log("--------------------------------------------------------------------------------");
        console.log("[TX2] Parameters for the VestedMerkleDistributor Snapshot Proposal");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${metamorphicContractAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${safeCreate2Prototype}"]`);
        console.log(`    salt (bytes32):             ${salt}`);
        console.log(`    initializationCode (bytes): ${vestedMerkleDistributorDeployBytecode}`);
        console.log(`\nContract will be deployed at address ${vestedMerkleDistributorDeploymentAddress}`);
        console.log("--------------------------------------------------------------------------------\n");

        console.log("--------------------------------------------------------------------------------");
        console.log("[TX3] Parameters to mint the rewards to the VestedMerkleDistributor contract");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${tokenDeploymentAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${tokenMintPrototype}"]`);
        console.log(`    to (address):               ${vestedMerkleDistributorDeploymentAddress}`);
        console.log(`    amount (uint256):           ${totalRewardsAmount.toString()}`);
        console.log("--------------------------------------------------------------------------------\n");

        console.log("--------------------------------------------------------------------------------");
        console.log("[TX4] Parameters to mint the rewards to the proposer");
        console.log(`    Type:                       Contract Interaction`);
        console.log(`    To (address):               ${tokenDeploymentAddress}`);
        console.log(`    Value (wei):                0`);
        console.log(`    ABI:                        ["${tokenMintPrototype}"]`);
        console.log(`    to (address):               ${taskArgs.proposer}`);
        console.log(`    amount (uint256):           ${proposerRewardsAmount.toString()}`);
        console.log("--------------------------------------------------------------------------------\n");
    });
