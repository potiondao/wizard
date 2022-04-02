// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    const MagicToken = await ethers.getContractFactory("MagicToken");
    const magicToken = await MagicToken.deploy();

    await magicToken.deployed();

    console.log("MagicToken deployed to:", magicToken.address);

    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const currentTimestamp = block.timestamp;

    const VestedMerkleDistributor = await ethers.getContractFactory("VestedMerkleDistributor");
    const vestedMerkleDistributor = await VestedMerkleDistributor.deploy(
        "0x8656b6af7c8b8843ed35442b2d25eb0e47468538926e2726f564fce1b4ce282a",
        magicToken.address,
        currentTimestamp + 2 * 24 * 3600, // 2 days
        180 * 24 * 3600 // 180 days
    );

    await vestedMerkleDistributor.deployed();

    console.log("VestedMerkleDistributor deployed to:", vestedMerkleDistributor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
