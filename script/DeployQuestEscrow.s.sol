// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import {QuestEscrow} from "contracts/QuestEscrow.sol";

interface VmBroadcast {
 function envUint(string calldata) external returns(uint256);
 function startBroadcast(uint256) external;
 function stopBroadcast() external;
}

/// @notice Public sandbox deployment script; deployment REQUIRES externally
/// verified EVM chain and private, valueless-sandbox-only signer.
contract DeployQuestEscrow {
 VmBroadcast constant vm=VmBroadcast(address(uint160(uint256(keccak256("hevm cheat code")))));
 event QuestVaultDeployed(uint256 indexed chainId,address indexed vault);
 function run() external {
  uint256 expected=vm.envUint("LIDDE_FUN_TESTNET_CHAIN_ID");
  uint256 key=vm.envUint("LIDDE_FUN_DEPLOYER_PRIVATE_KEY");
  require(key!=0 && expected==block.chainid && expected>1000 && expected!=4613
    && expected!=1 && expected!=56 && expected!=8453 && expected!=137,
    "SANDBOX_CHAIN_OR_DEPLOYER_NOT_VERIFIED");
  vm.startBroadcast(key);
  QuestEscrow vault=new QuestEscrow();
  vm.stopBroadcast();
  emit QuestVaultDeployed(expected,address(vault));
 }
}
