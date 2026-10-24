// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {QuestEscrow} from "../contracts/QuestEscrow.sol";

interface Vm {
    function envUint(string calldata) external returns (uint256);
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8,bytes32,bytes32);
    function startBroadcast(uint256) external;
    function stopBroadcast() external;
    function warp(uint256) external;
}

contract SmokeToken {
    mapping(address=>uint256) public balanceOf;
    mapping(address=>mapping(address=>uint256)) public allowance;
    constructor(address creator) { balanceOf[creator]=1000 ether; }
    function transfer(address to,uint256 amount) external returns(bool) {
        require(balanceOf[msg.sender]>=amount,"NO_BALANCE");
        balanceOf[msg.sender]-=amount;balanceOf[to]+=amount;return true;
    }
    function approve(address spender,uint256 amount) external returns(bool) {
        allowance[msg.sender][spender]=amount;return true;
    }
    function transferFrom(address from,address to,uint256 amount) external returns(bool) {
        require(allowance[from][msg.sender]>=amount && balanceOf[from]>=amount,"NO_ALLOWANCE");
        allowance[from][msg.sender]-=amount;balanceOf[from]-=amount;balanceOf[to]+=amount;return true;
    }
}

/// @notice Broadcast real, valueless transactions ONLY on a disposable local Anvil chain.
/// @dev Never run against public chains; no real-value token or signer data is accepted.
contract QuestDevnet {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function run() external {
        require(block.chainid==31337,"EXCLUSIVELY_DISPOSABLE_ANVIL");
        uint256 tester=vm.envUint("ANVIL_DEVNET_PRIVATE_KEY");
        uint256 witness=vm.envUint("ANVIL_ATTESTOR_TEST_KEY");
        address wallet=vm.addr(tester);
        address signer=vm.addr(witness);
        require(wallet!=signer && wallet!=address(0) && signer!=address(0),"INVALID_TEST_KEYS");

        vm.startBroadcast(tester);
        SmokeToken token=new SmokeToken(wallet);
        QuestEscrow escrow=new QuestEscrow();
        uint64 begin=uint64(block.timestamp+2);
        uint64 end=uint64(block.timestamp+3600);
        uint256 id=escrow.createCampaign(address(token),signer,100 ether,1,begin,end);
        token.approve(address(escrow),100 ether);
        escrow.fund(id,100 ether);
        vm.stopBroadcast();

        vm.warp(uint256(begin)+1);
        bytes32 evidence=keccak256("confirmed-isolated-devnet-smoke-evidence");
        bytes32 digest=escrow.hashClaim(id,wallet,evidence,1,end);
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(witness,digest);
        bytes memory proof=abi.encodePacked(r,s,v);

        vm.startBroadcast(tester);
        escrow.claim(id,evidence,1,end,proof);
        vm.stopBroadcast();

        require(escrow.claimed(id,wallet),"NO_CLAIM");
        require(token.balanceOf(wallet)==1000 ether,"MISSING_REWARD");
        require(escrow.isClaimable(id,wallet)==false,"DOUBLE_CLAIM_AVAILABLE");
    }
}
