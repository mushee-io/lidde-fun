// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import {QuestEscrow} from "../contracts/QuestEscrow.sol";
interface Vm {
 function envUint(string calldata) external returns(uint256);
 function envAddress(string calldata) external returns(address);
 function addr(uint256) external returns(address);
 function sign(uint256,bytes32) external returns(uint8,bytes32,bytes32);
 function startBroadcast(uint256) external;
 function stopBroadcast() external;
}
contract QuestDevnetClaim {
 Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
 function run() external {
  require(block.chainid==31337,"DISPOSABLE_ANVIL_ONLY");
  uint256 tester=vm.envUint("ANVIL_DEVNET_PRIVATE_KEY");
  uint256 witness=vm.envUint("ANVIL_ATTESTOR_TEST_KEY");
  QuestEscrow vault=QuestEscrow(vm.envAddress("ANVIL_QUEST_VAULT"));
  address claimant=vm.addr(tester);
  bytes32 evidence=keccak256("confirmed-isolated-devnet-smoke-evidence");
  uint256 deadline=block.timestamp+300;
  bytes32 digest=vault.hashClaim(1,claimant,evidence,1,deadline);
  (uint8 v,bytes32 r,bytes32 s)=vm.sign(witness,digest);
  vm.startBroadcast(tester);
  vault.claim(1,evidence,1,deadline,abi.encodePacked(r,s,v));
  vm.stopBroadcast();
 }
}
