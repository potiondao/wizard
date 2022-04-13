/**
 * Change the default configuration here.
 */

// Rewards to transfer to the distribution contract
const TotalRewardsAmountInWei = "30000000000000372194400000";

// Rewards to transfer to the proposer
const ProposerRewardsInWei = "1000000000000000000000";

// Merkle root to claim tokens
const MerkleRoot = "0x7a29625a0d9ed5fdb1f439d99dd91d7c0082d47e25b05e87d9eceae84d00e493";

// Timestamp to start token distribution
const DistributionStartTime = 1651363200;

// Duration of the token distribution
const DistributionDuration = 90 * 24 * 3600;

// Contract addresses are deterministic. Change this value if you need to
// generate different addresses, for example if the calculated addresses
// are already used. It is an hex number
const SaltPadding = "000000000000000000000000";

/**
 * Do not change anything below this line.
 */

// Metamorphic deployed contracts
interface MetamorphicContracts {
    [key: string]: string;
}

const metamorphicContracts: MetamorphicContracts = {
    mainnet: "0x000000000063b99B8036c31E91c64fC89bFf9ca7",
    rinkeby: "0x5749A83946f18DcD426F3A5144763D48c2cd7F99",
    ropsten: "0x000000B64Df4e600F23000dbAEEB8c0052C88e73",
};

export {
    metamorphicContracts,
    TotalRewardsAmountInWei,
    ProposerRewardsInWei,
    MerkleRoot,
    DistributionStartTime,
    DistributionDuration,
    SaltPadding,
};
