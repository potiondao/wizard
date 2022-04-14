import "@nomiclabs/hardhat-ethers";
import { BigNumber, utils } from "ethers";
import { task, types } from "hardhat/config";
const fs = require('fs').promises;
const treeHelper = require('../lib/tree');

task(
    "generateMerkleTree",
    "Generates a merkle tree to claim tokens"
)
    .addParam("input", "A file with raw data", undefined, types.string, false)
    .addParam("output", "A file with generated tree data", undefined, types.string, false)
    .addParam("format", "Use JSON formatting", false, types.boolean, true)
    .setAction(async (taskArgs, hre) => {
        const usersText: string = await fs.readFile(taskArgs.input, { encoding: 'utf8' });
        const users: any = JSON.parse(usersText);

        var totalTokens: BigNumber = BigNumber.from(0);

        // enrich users with the proper token count
        users.forEach((u: any) => {
            const tokenCount: BigNumber = utils.parseUnits(u.tokens.toString(), 18);
            u.count = tokenCount;
            totalTokens = totalTokens.add(tokenCount);
        });

        const addressToLeafDict = {} as any;

        const leaves = treeHelper.getLeaves(users, addressToLeafDict);
        const tree = treeHelper.makeTree(leaves);

        const treeLeaves: any[] = [];

        users.forEach((u: any) => {
            const leaf = addressToLeafDict[u.address];
            const proof = leaf ? tree.getHexProof(leaf, leaves.indexOf(leaf)) : null;
            treeLeaves.push({
                address: u.address,
                count: u.count.toHexString(),
                proof
            });
        });

        const jsonContent = {
            treeRoot: tree.getHexRoot(),
            tokens: totalTokens.toHexString(),
            treeLeaves: treeLeaves
        } as any;

        const space: string | undefined = taskArgs.format ? '\t' : undefined;
        const serializedTree: string = JSON.stringify(jsonContent, null, space);

        await fs.writeFile(taskArgs.output, serializedTree, { encoding: 'utf8' });

        console.log(`File ${taskArgs.output} is ready (${users.length} users)`);
        console.log(`Total tokens in Wei: ${totalTokens.toString()}`);
        console.log(`Merkle tree root: ${tree.getHexRoot()}`);
    });
