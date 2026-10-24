// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Valueless, isolated-EVM-sandbox quest vault. NOT audited; NEVER deploy with real-value tokens.
/// @dev Every campaign has fixed terms and a segregated liability; proofs are EIP-712 signed off-chain.
///      No upgradeability, no platform fees, no custody keys and no admin siphon.
contract QuestEscrow {
    error InvalidCampaign();
    error InvalidTerms();
    error InvalidProof();
    error InvalidSignature();
    error NotCreator();
    error NotActive();
    error AlreadyClaimed();
    error EvidenceUsed();
    error Underfunded();
    error Expired();
    error TransferFailed();
    error Reentrant();

    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(uint256 campaignId,address wallet,bytes32 evidenceHash,uint256 nonce,uint256 deadline)");
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant NAME_HASH = keccak256("Lidde Fun QuestEscrow");
    bytes32 private constant VERSION_HASH = keccak256("1");
    uint256 private constant SECP256K1_HALF_ORDER =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    struct Campaign {
        address creator;
        address rewardToken;
        address attestor;
        uint128 amountPerClaim;
        uint32 maxClaims;
        uint32 claimCount;
        uint64 start;
        uint64 end;
        uint256 funded;
        uint256 distributed;
        bool paused;
        bool finalized;
    }
    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public claimed;
    mapping(uint256 => mapping(bytes32 => bool)) public consumedEvidence;
    uint256 private lockState = 1;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, address indexed token,
        address attestor, uint256 amountPerClaim, uint32 maxClaims, uint64 start, uint64 end);
    event CampaignFunded(uint256 indexed campaignId, address indexed creator, uint256 amount, uint256 totalFunded);
    event CampaignPaused(uint256 indexed campaignId, bool paused);
    event AttestorRotated(uint256 indexed campaignId, address oldAttestor, address newAttestor);
    event RewardClaimed(uint256 indexed campaignId, address indexed wallet, bytes32 indexed evidenceHash,
        uint256 nonce, uint256 amount);
    event CampaignFinalized(uint256 indexed campaignId, uint256 returnedAmount);

    modifier nonReentrant() {
        if (lockState != 1) revert Reentrant();
        lockState = 2;
        _;
        lockState = 1;
    }

    constructor() {
        if (block.chainid <= 1000 || block.chainid == 4613 || block.chainid == 1)
            revert InvalidTerms();
    }

    function createCampaign(
        address rewardToken, address attestor, uint128 amountPerClaim, uint32 maxClaims, uint64 start, uint64 end
    ) external returns (uint256 id) {
        if (rewardToken == address(0) || rewardToken.code.length == 0 || attestor == address(0) ||
            amountPerClaim == 0 || maxClaims == 0 || maxClaims > 100_000 ||
            start < block.timestamp || end <= start || end > block.timestamp + 365 days)
            revert InvalidTerms();
        // Multiplication remains safe in uint256 because arguments are uint128 and uint32.
        id = nextCampaignId++;
        campaigns[id] = Campaign({
            creator: msg.sender, rewardToken: rewardToken, attestor: attestor,
            amountPerClaim: amountPerClaim, maxClaims: maxClaims, claimCount: 0,
            start: start, end: end, funded: 0, distributed: 0, paused: false, finalized: false
        });
        emit CampaignCreated(id, msg.sender, rewardToken, attestor, amountPerClaim, maxClaims, start, end);
    }

    function totalBudget(uint256 campaignId) public view returns (uint256) {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        return uint256(c.amountPerClaim) * c.maxClaims;
    }

    function fund(uint256 campaignId, uint256 amount) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        if (msg.sender != c.creator) revert NotCreator();
        if (c.finalized || block.timestamp >= c.end || amount == 0 ||
            amount > totalBudget(campaignId) - c.funded) revert InvalidTerms();
        uint256 beforeBal = _balance(c.rewardToken);
        _safeTransferFrom(c.rewardToken, msg.sender, address(this), amount);
        uint256 afterBal = _balance(c.rewardToken);
        if (afterBal < beforeBal || afterBal - beforeBal != amount) revert TransferFailed();
        c.funded += amount;
        emit CampaignFunded(campaignId, msg.sender, amount, c.funded);
    }

    function pause(uint256 campaignId, bool paused) external {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        if (msg.sender != c.creator) revert NotCreator();
        if (c.finalized) revert InvalidTerms();
        c.paused = paused;
        emit CampaignPaused(campaignId, paused);
    }

    /// @notice Key rotation only while paused. Previously signed claims stop being valid immediately.
    function rotateAttestor(uint256 campaignId, address replacement) external {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        if (msg.sender != c.creator) revert NotCreator();
        if (!c.paused || c.finalized || replacement == address(0)) revert InvalidTerms();
        address old = c.attestor;
        c.attestor = replacement;
        emit AttestorRotated(campaignId, old, replacement);
    }

    function claim(
        uint256 campaignId, bytes32 evidenceHash, uint256 nonce, uint256 deadline, bytes calldata signature
    ) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        if (c.finalized || c.paused || block.timestamp < c.start || block.timestamp > c.end)
            revert NotActive();
        if (block.timestamp > deadline) revert Expired();
        if (c.claimCount >= c.maxClaims) revert NotActive();
        if (c.funded != totalBudget(campaignId)) revert Underfunded();
        if (evidenceHash == bytes32(0)) revert InvalidProof();
        if (claimed[campaignId][msg.sender]) revert AlreadyClaimed();
        if (consumedEvidence[campaignId][evidenceHash]) revert EvidenceUsed();
        bytes32 digest = hashClaim(campaignId, msg.sender, evidenceHash, nonce, deadline);
        if (_recover(digest, signature) != c.attestor) revert InvalidSignature();
        claimed[campaignId][msg.sender] = true;
        consumedEvidence[campaignId][evidenceHash] = true;
        c.claimCount += 1;
        c.distributed += c.amountPerClaim;
        _safeTransfer(c.rewardToken, msg.sender, c.amountPerClaim);
        emit RewardClaimed(campaignId, msg.sender, evidenceHash, nonce, c.amountPerClaim);
    }

    /// @notice Refund only once the entire claim window has ended, never while participants can claim.
    function finalize(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        if (c.creator == address(0)) revert InvalidCampaign();
        if (msg.sender != c.creator) revert NotCreator();
        if (block.timestamp <= c.end || c.finalized) revert NotActive();
        c.finalized = true;
        uint256 remaining = c.funded - c.distributed;
        if (remaining > 0) _safeTransfer(c.rewardToken, c.creator, remaining);
        emit CampaignFinalized(campaignId, remaining);
    }

    function isClaimable(uint256 campaignId, address wallet) external view returns (bool) {
        Campaign storage c = campaigns[campaignId];
        return c.creator != address(0) && !c.paused && !c.finalized &&
            block.timestamp >= c.start && block.timestamp <= c.end &&
            c.claimCount < c.maxClaims && !claimed[campaignId][wallet] &&
            c.funded == uint256(c.amountPerClaim) * c.maxClaims;
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH, block.chainid, address(this)));
    }

    function hashClaim(uint256 campaignId, address wallet, bytes32 evidenceHash, uint256 nonce, uint256 deadline)
        public view returns (bytes32)
    {
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, campaignId, wallet, evidenceHash, nonce, deadline));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) revert InvalidSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) > SECP256K1_HALF_ORDER || (v != 27 && v != 28))
            revert InvalidSignature();
        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
    }

    function _balance(address token) private view returns (uint256 value) {
        (bool ok, bytes memory result) = token.staticcall(
            abi.encodeWithSelector(bytes4(keccak256("balanceOf(address)")), address(this))
        );
        if (!ok || result.length < 32) revert TransferFailed();
        value = abi.decode(result, (uint256));
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        _callToken(token, abi.encodeWithSelector(bytes4(keccak256("transfer(address,uint256)")), to, amount));
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) private {
        _callToken(token, abi.encodeWithSelector(
            bytes4(keccak256("transferFrom(address,address,uint256)")), from, to, amount
        ));
    }

    function _callToken(address token, bytes memory data) private {
        (bool ok, bytes memory result) = token.call(data);
        if (!ok || (result.length != 0 && (result.length != 32 || !abi.decode(result, (bool)))))
            revert TransferFailed();
    }
}
