import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";

task("decodeProposal", "Parses the bytecode of a SafeSnap proposal to extract the deployment parameters")
    .addParam("contract", "The name of the contract to check", undefined, types.string, false)
    .addParam("bytecode", "The bytecode to check", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        // Generate the token deployment bytecode + payload
        const contractFactory = await hre.ethers.getContractFactory(taskArgs.contract);
        const contractInterface = contractFactory.interface;
        const contractBytecode = contractFactory.bytecode;

        const bytecodeToCheck = taskArgs.bytecode;
        const payloadToCheck = "0x" + bytecodeToCheck.slice(contractBytecode.length);

        // Types from the constructor
        const inputTypes = contractInterface.deploy.inputs;
        const decodedConstructorParams = hre.ethers.utils.defaultAbiCoder.decode(inputTypes, payloadToCheck);
        const inputPrototype = inputTypes.map((input) => input.type + " " + input.name);

        console.log("\n[DECODED PROPOSAL]");

        if (inputPrototype.length !== decodedConstructorParams.length) {
            console.log(
                "ERROR: The number of parameters in the constructor does not match the number of parameters in the proposal"
            );
            console.log(`Constructor: ${inputPrototype}`);
            console.log(`Proposal: ${decodedConstructorParams.toString()}\n`);
        } else {
            process.stdout.write(`${taskArgs.contract}::constructor(`);
            for (let i = 0; i < inputPrototype.length; i++) {
                process.stdout.write(`${inputPrototype[i]} = ${decodedConstructorParams[i]}`);

                if (i < inputPrototype.length - 1) {
                    process.stdout.write(`, `);
                }
            }
            process.stdout.write(`)\n\n`);
        }
    });
