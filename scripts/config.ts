/**
 * Change the default configuration here.
 */

// Address of the original validator contract
const OriginalValidatorAddress = "0x0000000000000000000000000000000000000000";

// Reward amount for each byte of a secret piece of the NFT
const RewardAmountPerByteValidationInWei = "1000000000000000000"; // 1 Token

// Multiplier to apply to the reward amount for the first validation
// of a piece of secret
const RewardMultiplierForFirstValidation = 2;

// Total amount of tokens to mint to the validator contract for rewards
const TotalRewardsAmountInWei = "200000000000000000000000"; // 200000 Tokens

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
    OriginalValidatorAddress,
    TotalRewardsAmountInWei,
    RewardAmountPerByteValidationInWei,
    RewardMultiplierForFirstValidation,
    SaltPadding,
};
