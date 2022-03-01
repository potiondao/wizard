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

    const ValidatorWithRewards = await ethers.getContractFactory("ValidatorWithRewards");
    const validatorWithRewards = await ValidatorWithRewards.deploy(
        "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        magicToken.address,
        100,
        2
    );

    await validatorWithRewards.deployed();

    console.log("ValidatorWithRewards deployed to:", validatorWithRewards.address);

    magicToken.transferOwnership(validatorWithRewards.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
