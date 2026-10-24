import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { keccak256, toHex } from "viem";
import { authorizedQuest, checkOrigin } from "@/lib/quests/auth";
import { questRecord } from "@/lib/quests/records";
import { questSql } from "@/lib/quests/db";
import { claimSigner, deployedCampaign, questTypedData, typedDomain } from "@/lib/quests/vault";
import { vaultAbi } from "@/lib/quests/vault-abi";
import { normalizedWallet, isUuid, type QuestRule } from "@/lib/quests/rules";
import { verifyTasks } from "@/lib/quests/proofs";

export const runtime="nodejs";export const dynamic="force-dynamic";
type Proof={txHash?:string};
export async function POST(request:NextRequest) {
 try {
  checkOrigin(request);
  const raw=await request.json() as {
   id?:string;wallet?:unknown;challengeId?:unknown;signature?:unknown;proofs?:unknown;
  };
  if(!isUuid(String(raw.id)))throw new Error("Quest identifier is invalid.");
  const wallet=normalizedWallet(raw.wallet);
  const record=await questRecord(raw.id!);
  if(record.lifecycle!=="registered"&&record.lifecycle!=="active")
   throw new Error("The campaign has not been registered against on-chain escrow.");
  if(!Array.isArray(raw.proofs)||raw.proofs.length!==record.task_rules.length||raw.proofs.length>5)
   throw new Error("Every task requires proof data.");
  const provided=raw.proofs.map((x:unknown):Proof=>{
   if(!x||typeof x!=="object")throw new Error("Invalid evidence input.");
   const value=x as Record<string,unknown>;
   return {txHash:typeof value.txHash==="string"?value.txHash:undefined};
  });
  // A single-use wallet signature deters unauthorized signer usage and issuance for unrelated accounts.
  await authorizedQuest(wallet,raw.challengeId,raw.signature,"verify-quest");
  if(!record.vault_address||!record.onchain_campaign_id)
   throw new Error("Campaign contract registration is incomplete.");
  const onchainId=BigInt(record.onchain_campaign_id);
  const {campaign,config,vault,client}=await deployedCampaign(onchainId);
  const signer=claimSigner();
  if(Number(record.chain_id)!==config.chainId||
   record.vault_address.toLowerCase()!==vault.toLowerCase()||
   campaign.creator.toLowerCase()!==record.creator_address.toLowerCase()||
   campaign.rewardToken.toLowerCase()!==record.token_address.toLowerCase()||
   campaign.amountPerClaim!==BigInt(record.reward_each_raw)||
   campaign.maxClaims!==Number(record.max_claims)||
   campaign.attestor.toLowerCase()!==signer.address.toLowerCase())
   throw new Error("Campaign data no longer agrees with the independently verified escrow.");
  const now=BigInt(Math.floor(Date.now()/1000));
  if(now<campaign.starts||now>campaign.ends||campaign.finalized||campaign.paused||
    campaign.funded!==campaign.budget||campaign.claimCount>=campaign.maxClaims)
   throw new Error("Campaign is not open or fully escrow-funded.");
  const already=await client.readContract({address:vault,abi:vaultAbi,functionName:"claimed",args:[onchainId,wallet]});
  if(already)throw new Error("This wallet already claimed its campaign reward.");
  const {results,chainId}=await verifyTasks(raw.id!,wallet,record.task_rules as QuestRule[],
   {start:campaign.starts,end:campaign.ends},provided);
  if(chainId!==config.chainId)throw new Error("Evidence is not from the active campaign chain.");
  const sql=questSql();
  for(const task of results){
   const existing=await sql.query(
    "INSERT INTO quest_task_evidence(campaign_id,wallet_address,task_number,source_tx_hash,observed_block,observed_block_hash,evidence_digest,evidence_record) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb) ON CONFLICT DO NOTHING RETURNING id",
    [raw.id,wallet.toLowerCase(),task.task,task.sourceTxHash?.toLowerCase()??null,
     task.block.toString(),task.blockHash.toLowerCase(),task.digest.toLowerCase(),JSON.stringify(task.record)]);
   if(existing.length===0){
    const prior=await sql.query("SELECT source_tx_hash,evidence_digest FROM quest_task_evidence WHERE campaign_id=$1 AND LOWER(wallet_address)=$2 AND task_number=$3 LIMIT 1",
     [raw.id,wallet.toLowerCase(),task.task]);
    if(prior.length!==1||String(prior[0].evidence_digest).toLowerCase()!==task.digest.toLowerCase())
     throw new Error("Evidence was already used by a different wallet or task verification attempt.");
   }
  }
  const proofHash=keccak256(toHex(["LIDDE-QUEST-COMPLETION-1",raw.id,wallet.toLowerCase(),...results.map(x=>x.digest)].join("|")));
  const nonce=BigInt("0x"+randomBytes(16).toString("hex"));
  const deadline=now+600n<campaign.ends?now+600n:campaign.ends;
  if(deadline<=now)throw new Error("Claim window has ended.");
  const signature=await signer.signTypedData({
   domain:typedDomain(config.chainId,vault),types:questTypedData,primaryType:"Claim",
   message:{campaignId:onchainId,wallet,evidenceHash:proofHash,nonce,deadline}
  });
  const dbExpiry=new Date(Number(deadline)*1000).toISOString();
  const saved=await sql.query(
   "INSERT INTO quest_claim_attestations(campaign_id,wallet_address,chain_id,vault_address,onchain_campaign_id,evidence_hash,claim_nonce,expires_at,typed_signature) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(campaign_id,wallet_address) DO UPDATE SET evidence_hash=EXCLUDED.evidence_hash,claim_nonce=EXCLUDED.claim_nonce,expires_at=EXCLUDED.expires_at,typed_signature=EXCLUDED.typed_signature,created_at=NOW() WHERE quest_claim_attestations.expires_at<NOW() RETURNING evidence_hash,claim_nonce,expires_at,typed_signature",
   [raw.id,wallet.toLowerCase(),config.chainId,vault.toLowerCase(),onchainId.toString(),proofHash.toLowerCase(),
    nonce.toString(),dbExpiry,signature]);
  if(saved.length===0)throw new Error("A claim authorization already exists for this wallet. Submit the issued authorization before its expiry.");
  return NextResponse.json({status:"eligible",wallet,chainId:config.chainId,vault,
   onchainId:onchainId.toString(),evidenceHash:proofHash,nonce:nonce.toString(),
   deadline:deadline.toString(),signature,proofs:results.map(x=>({task:x.task,kind:x.kind,block:x.block.toString()})),
   note:"Claim authorization is limited to this wallet, vault, campaign, chain, evidence and expiry."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"Unable to verify quest eligibility."},
    {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
