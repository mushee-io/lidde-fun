// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {QuestEscrow} from "../QuestEscrow.sol";

interface Vm {
    function warp(uint256) external;
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function prank(address) external;
    function expectRevert(bytes4) external;
}
contract DemoReward {
    string public constant name = "Test FUN";
    string public constant symbol = "tFUN";
    uint8 public constant decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 quantity) external { balanceOf[to] += quantity; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 approved = allowance[from][msg.sender];
        require(approved >= amount, "LOW_ALLOWANCE");
        allowance[from][msg.sender] = approved - amount;
        _move(from, to, amount);
        return true;
    }
    function _move(address from, address to, uint256 amount) private {
        require(balanceOf[from] >= amount, "LOW_BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}
contract QuestEscrowTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    QuestEscrow internal vault;
    DemoReward internal token;
    uint256 internal constant ATTESTOR_KEY = 0xA11CE;
    address internal attestor;
    address internal creator = address(0xCAFE);
    address internal alice = address(0xAA11);
    address internal bob = address(0xBB22);
    uint64 internal start;
    uint64 internal end;
    uint256 internal id;

    function setUp() public {
        vm.warp(1_700_000_000);
        vault = new QuestEscrow();
        token = new DemoReward();
        attestor = vm.addr(ATTESTOR_KEY);
        start = uint64(block.timestamp + 10);
        end = uint64(block.timestamp + 100);
        token.mint(creator, 1000 ether);
        vm.prank(creator);
        id = vault.createCampaign(address(token), attestor, 10 ether, 2, start, end);
    }

    function fund() private {
        vm.prank(creator);
        token.approve(address(vault), 20 ether);
        vm.prank(creator);
        vault.fund(id, 20 ether);
    }
    function proof(address wallet, bytes32 evidence, uint256 nonce) private returns (bytes memory) {
        bytes32 digest = vault.hashClaim(id, wallet, evidence, nonce, end);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ATTESTOR_KEY, digest);
        return abi.encodePacked(r, s, v);
    }
    function started() private {
        fund();
        vm.warp(start + 1);
    }

    function testCreateAndFullyFundFixedBudget() public {
        fund();
        (,,,,,, , ,uint256 funded,uint256 distributed,,) = vault.campaigns(id);
        require(funded == 20 ether && distributed == 0);
        require(vault.totalBudget(id) == 20 ether);
    }

    function testValidClaimThenSecondWalletCanClaim() public {
        started();
        bytes32 a = keccak256("alice-proof");
        vm.prank(alice);
        vault.claim(id, a, 1, end, proof(alice, a, 1));
        require(token.balanceOf(alice) == 10 ether && vault.claimed(id, alice));
        bytes32 b = keccak256("bob-proof");
        vm.prank(bob);
        vault.claim(id, b, 2, end, proof(bob, b, 2));
        require(token.balanceOf(bob) == 10 ether && vault.claimed(id, bob));
    }

    function testCannotClaimWithoutFullEscrowFunding() public {
        vm.warp(start + 1);
        bytes32 evidence=keccak256("underfunded");
        vm.expectRevert(QuestEscrow.Underfunded.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
    }

    function testSignatureBoundToWallet() public {
        started();
        bytes32 evidence=keccak256("evidence");
        bytes memory sig=proof(alice,evidence,1);
        vm.expectRevert(QuestEscrow.InvalidSignature.selector);
        vm.prank(bob);
        vault.claim(id,evidence,1,end,sig);
    }

    function testCannotDoubleClaim() public {
        started();
        bytes32 evidence=keccak256("claim");
        bytes memory sig=proof(alice,evidence,1);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,sig);
        vm.expectRevert(QuestEscrow.AlreadyClaimed.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,sig);
    }

    function testEvidenceCannotBeSharedBetweenWallets() public {
        started();
        bytes32 evidence=keccak256("shared-tx");
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
        vm.expectRevert(QuestEscrow.EvidenceUsed.selector);
        vm.prank(bob);
        vault.claim(id,evidence,2,end,proof(bob,evidence,2));
    }

    function testNoClaimAfterEnd() public {
        started();
        vm.warp(end + 1);
        bytes32 evidence=keccak256("too-late");
        vm.expectRevert(QuestEscrow.NotActive.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
    }

    function testOnlyCreatorCanFundOrRefund() public {
        vm.expectRevert(QuestEscrow.NotCreator.selector);
        vm.prank(alice);
        vault.fund(id, 10 ether);
        started();
        vm.warp(end + 1);
        vm.expectRevert(QuestEscrow.NotCreator.selector);
        vm.prank(alice);
        vault.finalize(id);
    }

    function testPauseAndRotateAttestor() public {
        started();
        vm.prank(creator);
        vault.pause(id,true);
        bytes32 evidence=keccak256("paused");
        vm.expectRevert(QuestEscrow.NotActive.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
        vm.prank(creator);
        vault.rotateAttestor(id,address(0x1234));
        vm.prank(creator);
        vault.pause(id,false);
        vm.expectRevert(QuestEscrow.InvalidSignature.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
    }

    function testRemainingEscrowCanOnlyBeRefundedAfterWindow() public {
        started();
        bytes32 evidence=keccak256("one-claim");
        vm.prank(alice);
        vault.claim(id,evidence,1,end,proof(alice,evidence,1));
        vm.expectRevert(QuestEscrow.NotActive.selector);
        vm.prank(creator);
        vault.finalize(id);
        vm.warp(end + 1);
        uint256 original=token.balanceOf(creator);
        vm.prank(creator);
        vault.finalize(id);
        require(token.balanceOf(creator)==original+10 ether,"must return unclaimed budget");
        vm.expectRevert(QuestEscrow.NotActive.selector);
        vm.prank(creator);
        vault.finalize(id);
    }

    function testRejectExpiredProof() public {
        started();
        bytes32 evidence=keccak256("expired");
        vm.expectRevert(QuestEscrow.Expired.selector);
        vm.prank(alice);
        vault.claim(id,evidence,1,start-1,proof(alice,evidence,1));
    }
}
