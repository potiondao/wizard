# Wizard

## Requirements

-   An Ethereum wallet
-   An ENS domain: potiongov.eth
-   A Snapshot space: https://snapshot.org/#/potiongov.eth
-   A Gnosis Multi-sig: https://gnosis-safe.io/app/eth:0x39375aeb189a16162dfF8B1669a0165Ed9e46Ca6
-   A Reality Module for the Gnosis Multi-sig: https://etherscan.io/address/0xa7456392Eb978A756264D54968F55bAf227fCbCf
-   Wallets already holding NFTs
-   This repo!

## ERC20 Token and Reward Distributor

If we want the DAO to deploy governance, we need to do add a proposal to deploy an ERC20 that will be given to the NFT holders.
The strategy to decide how many ERC20s to give to each NFT holder may vary, that's why we analyze the revealing process off-chain and generate a merkle tree to distribute tokens.

The next thing to do is to create a SafeSnap proposal that will deploy the ERC20 and the distributor.

## What you can do with this repo?

This repo offers some tools to create a DAO proposal with:

-   An example ERC20 contract
-   An example VestedMerkleDistributor contract
-   A generateMerkleTree task to generate a merkle tree for the VestedMerkleDistributor
-   A generateProposals task that will generate the proposals
-   A decodeProposals task that can be used by anybody to verify the proposals on Snapshot

Let's see how to use it

## Using this repo to create the proposals

### Initialize and compile

Initialize the repo by typing:

```
$ yarn init
```

Once initialized you need to compile the contracts:

```
$ yarn compile
```

### Configure the repo

Open the file `scripts/config.ts`. You will see at the top several variables that you must configure:

-   **TotalRewardsAmountInWei** total amount of tokens that will be minted to the distribution contract in order to give rewards during the vesting period
-   **ProposerRewardsInWei** amount of tokens that will be minted to the proposer
-   **MerkleRoot** is a root of a merkle tree with distribution data
-   **DistributionStartTime** timestamp (seconds) to start distribution of tokens
-   **DistributionDuration** duration (seconds) of the vesting period (distributes linearly over time)
-   **SaltPadding** this value is used to get deterministic addressed for the deployed contracts. If the calculated addresses are not valid (in case they are already in use in the network), this value can be modified to generate different addreses

A _generateMerkleTree_ script returns an amount of tokens (**total tokens in wei**) that will be distributed. You have to copy the value outputed by the script and set it as the **TotalRewardsAmountInWei**.
The same script shows a Merkle root that has to be set as the **MerkleRoot**.

In order to generate a merkle tree please use the following command:

```
$ npx hardhat generateMerkleTree --input <source_data.json> --output <tree_data.json>
```
An example of the source_data file:
```
[
    { "address": "0x845a6610a3bA0B3002385609B69e4942A9dF670b", "tokens": 2000 },
    { "address": "0x7a96246754D94D4f8742e978bBeDD42a7Ab0CAA8", "tokens": 3000 },
    { "address": "0x1d258d23507f429d8f19846B921eC4BF2C1A31DE", "tokens": 4000 },
    { "address": "0xcB610142d1D004e074b9B0689106B3A24A57f9b3", "tokens": 5000 },
    { "address": "0xb9b470B0244a655F62437Dbfbf53A74aB2531613", "tokens": 6000 },
    { "address": "0xe34fA76Ba5899a2C00ea530fd3A3B2B4D2B3545f", "tokens": 7000 }
]
```
The "tokens" field contains a total number of tokens to be distributed.

### Generate the proposal

You can now generate the proposal with the folowing command:

```
$ npx hardhat --network <network_name> generateProposal --proposer <proposer_wallet_address> --multisig <multisig_address>
```

`<network_name>` is the network where the proposal will be executed. It supports **rinkeby** and **mainnet**

`<proposer_wallet_address>` is the wallet address of the person creating the proposal on Snapshot. This address will get a special ERC20 reward for being the one proposing the deployment.

`<multisig_address>` is the address of the Gnosis Multi-sig created in previous steps

The script will output the proposals with the following format:

```
    [TX1] Parameters for the PotionToken Snapshot Proposal
    Type:                       Contract Interaction
    To (address):               0x000000000063b99B8036c31E91c64fC89bFf9ca7
    Value (wei):                0
    ABI:                        ["function safeCreate2(bytes32 salt, bytes initializationCode) payable returns (address deploymentAddress)"]
    salt (bytes32):             0x01547ef97f9140dbdf5ae50f06b77337b95cf4bb000000000000000000000000
    initializationCode (bytes): 0x60806040523480156200001157600080fd5b50604051620020f3380380620020...
```

-   **Type** is always **Contract Interaction** which is the same that you can find when creating a SafeSnap proposal.
-   **To** address is the target contract that the proposal will interact with. For the first 2 proposals this is the
    Metamorphic contracts that allow to deploy contracts by passing the initialization code of the contract. This allow for contract deployment from SafeSnap.
-   **Value** is always 0
-   **ABI** is the specification of the function that we want to call in the target contract.
-   **salt** is a special value that MUST start with the address of the Gnosis Multi-Sig and end with 24 zeroes

### Verify the proposal

You can verify that a proposal is correctly generated by using the `decodeProposal` command:

```
$ npx hardhat --network <network_name> decodeProposal --contract <contract_name> --bytecode <proposal_bytecode>
```

-   **network_name** is the name of the network that the proposal was generated for
-   **contract_name** is the contract name of the contract that the proposal will deploy: either _PotionToken_ or _VestedMerkleDistributor_
-   **proposal_bytecode** is the initialization bytecode of the proposal

The output of the command should be something like:

```
[DECODED PROPOSAL]
PotionToken::constructor(address multisig = 0x01547Ef97f9140dbDF5ae50f06B77337B95cF4BB)
```

Where you can see the parameters of construction of the deployed contract.

### Create the proposal on Snapshot

To use this just create a new SafeSnap proposal and click on **Add transaction batch**. _Type_ must be **Contract Interaction** and then you just have to fill the rest of the fields with the output of the `generateProposal` command. You need to add a total of 4 transactions to the transaction batch.

Then wait for the voting to finish, for the Reality Module (SafeSnap) to confirm the voting on chain, and you can execute the proposal. Upon execution it will do the following things:

-   Deploy the ERC20 Token, that will transfer its ownership to the multisig upon initialization
-   Deploy the VestedMerkleDistributor connected to the previously deployed ERC20
-   Mint enough ERC20 tokens for the VestedMerkleDistributor so it can give rewards to NFT owners
-   Mint ERC20 tokens to the proposer

### Wrap-up

Once done, the system is in place and the NFT DAO members just need to claim their ERC20 tokens from the VestedMerkleDistributor!

Once everybody has their ERC20 tokens, the Snapshot space strategy can be changed to an ERC20 one based on the new token. The contract addresses for both the ERC20 token and the distributor are also outputed through the `generateProposal` command, right after each transaction parameters (look for `Contract will be deployed at address `)

Enjoy!
