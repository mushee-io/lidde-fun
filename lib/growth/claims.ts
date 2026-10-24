import "server-only";
import { isHash, parseEventLogs, type Address, type Hex } from "viem";
import { getVerifiedContext } from "@/lib/phase2/indexed";
import { deployedCampaign } from "@/lib/quests/vault";
import { questRecord } from "@/lib/quests/records";
import { vaultAbi } from "@/lib/quests/vault-abi";
import { CLAIM_XP } from "@/lib/growth/scoring";

const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export type OnchainXP={
 wallet:Address;chainId:number;vault:Address;campaignUuid:string;
 transactionHash:Hex;logIndex:number;block:bigint;blockHash:Hex;eventAt:number;xp:number;
};
export async function verifyClaimXP(campaignUuid:string,wallet:Address,hash:string):Promise<OnchainXP>{
 if(!isHash(hash))throw new Error("A confirmed quest claim transaction hash is required.");
 const record=await questRecord(campaignUuid);
 if(!record.vault_address||!record.onchain_campaign_id||
  !["registered","active"].includes(record.lifecycle))throw new Error("Quest is not registered on-chain.");
 const ctx=await getVerifiedContext();
 const chain=await deployedCampaign(BigInt(record.onchain_campaign_id));
 if(chain.config.chainId!==ctx.config.chainId||
    chain.config.chainId!==Number(record.chain_id)||
    !same(record.vault_address,chain.vault)||!same(record.creator_address,chain.campaign.creator)||
    !same(record.token_address,chain.campaign.rewardToken)||
    chain.campaign.amountPerClaim!==BigInt(record.reward_each_raw)||
    chain.campaign.maxClaims!==Number(record.max_claims))
  throw new Error("Quest campaign is not canonical to this testnet escrow.");
 const txHash=hash as Hex;
 const [tx,receipt]=await Promise.all([
   ctx.client.getTransaction({hash:txHash}),
   ctx.client.getTransactionReceipt({hash:txHash})
 ]);
 if(!tx.to||!same(tx.to,chain.vault)||!same(tx.from,wallet)||
    receipt.status!=="success"||receipt.blockNumber>ctx.block)
  throw new Error("Wallet must prove its own confirmed successful escrow claim.");
 const header=await ctx.client.getBlock({blockNumber:receipt.blockNumber});
 if(!same(header.hash,receipt.blockHash)||
   header.timestamp<chain.campaign.starts||header.timestamp>chain.campaign.ends)
  throw new Error("Claim is outside the canonical campaign period or reverted.");
 const logs=parseEventLogs({abi:vaultAbi,eventName:"RewardClaimed",logs:receipt.logs,strict:true})
   .filter(log=>same(log.address,chain.vault) &&
      log.args.campaignId===BigInt(record.onchain_campaign_id)&&
      same(log.args.wallet,wallet)&&
      log.args.amount===chain.campaign.amountPerClaim);
 if(logs.length!==1)throw new Error("No unique RewardClaimed escrow event for this wallet.");
 const log=logs[0];
 return {wallet,chainId:ctx.config.chainId,vault:chain.vault,campaignUuid,
   transactionHash:txHash,logIndex:log.logIndex,block:receipt.blockNumber,
   blockHash:receipt.blockHash,eventAt:Number(header.timestamp)*1000,xp:CLAIM_XP};
}
export type RawXP={
 wallet_address:string;chain_id:number;vault_address:string;campaign_id:string;
 transaction_hash:string;log_index:number;block_number:string;block_hash:string;
 event_at:string|Date;xp:number;
};
export async function canonicalScores(raw:RawXP[],maxBlock:bigint,client:ReturnType<typeof getVerifiedContext> extends Promise<infer T>? T["client"] : never){
 const seen=new Map<string,string>();
 const chunks=raw.map(r=>({row:r,block:BigInt(r.block_number)}));
 if(chunks.some(x=>x.block>maxBlock))throw new Error("XP ledger references unindexed blocks.");
 const unique=[...new Set(chunks.map(x=>x.block.toString()))];
 for(let i=0;i<unique.length;i+=8){
  const batch=await Promise.all(unique.slice(i,i+8).map(async n=>{
   const header=await client.getBlock({blockNumber:BigInt(n)});
   return {number:n,hash:header.hash};
  }));
  for(const b of batch)seen.set(b.number,b.hash.toLowerCase());
 }
 for(const x of chunks){
  if(seen.get(x.block.toString())!==x.row.block_hash.toLowerCase())
   throw new Error("XP ledger contains a noncanonical reorged event. Reconciliation required.");
 }
 return chunks;
}
