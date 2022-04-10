// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MagicToken is ERC20, Ownable {
    uint256 public constant PROPOSER_REWARD = 1000 * (10**18);

    constructor(address proposer, address multisig) ERC20("MagicToken", "MTK") {
        // Proposer gets a reward
        _mint(proposer, PROPOSER_REWARD);

        // Multisig must be the owner
        _transferOwnership(multisig);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
