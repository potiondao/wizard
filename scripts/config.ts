/**
 * Change the default configuration here.
 */

// Rewards to transfer to the distribution contract
const TotalRewardsAmountInWei = "0";

// Merkle root to claim tokens
const MerkleRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";

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
    MerkleRoot,
    DistributionStartTime,
    DistributionDuration,
    SaltPadding,
};
