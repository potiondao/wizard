// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VestedMerkleDistributor {
    using SafeERC20 for IERC20;

    event Claim(address indexed account, uint256 total, uint256 count);

    bytes32 public immutable merkleRoot;
    IERC20 public immutable rewardToken;
    uint64 public immutable distributionStartTime;
    uint64 public immutable distributionDuration;

    mapping(address => uint256) public claimedCount;

    constructor(
        bytes32 _merkleRoot,
        address _rewardToken,
        uint64 _distributionStartTime,
        uint64 _distributionDuration
    ) {
        merkleRoot = _merkleRoot;
        rewardToken = IERC20(_rewardToken);
        distributionStartTime = _distributionStartTime;
        distributionDuration = _distributionDuration;
    }

    function readyToClaim(
        address _account,
        uint256 _total,
        bytes32[] calldata _merkleProof
    ) public view returns (uint256) {
        bytes32 node = keccak256(abi.encodePacked(_account, _total));
        require(MerkleProof.verify(_merkleProof, merkleRoot, node), "INVALID_PROOF");

        uint256 claimed = claimedCount[_account];
        uint256 vested = _vestingSchedule(_total, uint64(block.timestamp));
        uint256 releasable = vested - claimed;

        return releasable;
    }

    function claim(
        address _account,
        uint256 _total,
        uint256 _count,
        bytes32[] calldata _merkleProof
    ) external {
        require(block.timestamp >= distributionStartTime, "INVALID_TIME");

        uint256 releasable = readyToClaim(_account, _total, _merkleProof);
        // don't revert if the requested amount is bigger than what's ready to be claimed
        if (_count > releasable)
            _count = releasable;

        claimedCount[_account] += _count;

        rewardToken.safeTransfer(_account, _count);
        emit Claim(_account, _total, _count);
    }

    function _vestingSchedule(uint256 totalAllocation, uint64 timestamp) internal view virtual returns (uint256) {
        if (timestamp < distributionStartTime) {
            return 0;
        } else if (timestamp > distributionStartTime + distributionDuration) {
            return totalAllocation;
        } else {
            return (totalAllocation * (timestamp - distributionStartTime)) / distributionDuration;
        }
    }
}
