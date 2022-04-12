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
    const PotionToken = await ethers.getContractFactory("PotionToken");
    const potionToken = await PotionToken.deploy('0x0000000000000000000000000000000000000000');

    await potionToken.deployed();

    console.log("PotionToken deployed to:", potionToken.address);

    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const currentTimestamp = block.timestamp;

    const VestedMerkleDistributor = await ethers.getContractFactory("VestedMerkleDistributor");
    const vestedMerkleDistributor = await VestedMerkleDistributor.deploy(
        "0x8656b6af7c8b8843ed35442b2d25eb0e47468538926e2726f564fce1b4ce282a",
        potionToken.address,
        currentTimestamp + 3600, // 1 hour
        2 * 24 * 3600 // 2 days
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
