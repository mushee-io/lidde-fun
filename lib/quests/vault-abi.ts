import { parseAbi } from "viem";
export const vaultAbi=parseAbi([
 "function campaigns(uint256) view returns(address creator,address rewardToken,address attestor,uint128 amountPerClaim,uint32 maxClaims,uint32 claimCount,uint64 start,uint64 end,uint256 funded,uint256 distributed,bool paused,bool finalized)",
 "function totalBudget(uint256) view returns(uint256)",
 "function isClaimable(uint256,address) view returns(bool)",
 "function claimed(uint256,address) view returns(bool)",
 "function createCampaign(address rewardToken,address attestor,uint128 amountPerClaim,uint32 maxClaims,uint64 start,uint64 end) returns(uint256)",
 "function fund(uint256 campaignId,uint256 amount)",
 "function pause(uint256 campaignId,bool paused)",
 "function finalize(uint256 campaignId)",
 "function claim(uint256 campaignId,bytes32 evidenceHash,uint256 nonce,uint256 deadline,bytes signature)",
 "event CampaignCreated(uint256 indexed campaignId,address indexed creator,address indexed token,address attestor,uint256 amountPerClaim,uint32 maxClaims,uint64 start,uint64 end)",
 "event CampaignFunded(uint256 indexed campaignId,address indexed creator,uint256 amount,uint256 totalFunded)",
 "event RewardClaimed(uint256 indexed campaignId,address indexed wallet,bytes32 indexed evidenceHash,uint256 nonce,uint256 amount)"
]);
