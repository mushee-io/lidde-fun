import { NextRequest, NextResponse } from "next/server";
import { checkOrigin, authorizedDraft } from "@/lib/quests/auth";
import { questRecord } from "@/lib/quests/records";
import { questSql } from "@/lib/quests/db";
import { claimSigner, deployedCampaign } from "@/lib/quests/vault";
import { isUuid } from "@/lib/quests/rules";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  checkOrigin(request);
  const raw=await request.json() as {id?:string;onchainId?:string;creator?:unknown;challengeId?:unknown;signature?:unknown};
  if(!isUuid(String(raw.id))||typeof raw.onchainId!=="string"||!/^[1-9]\d{0,25}$/.test(raw.onchainId))
   throw new Error("Provide a valid quest draft and deployed campaign ID.");
  const record=await questRecord(raw.id!);
  if(record.lifecycle!=="draft"||record.creator_address.toLowerCase()!==String(raw.creator).toLowerCase())
   throw new Error("Only the draft creator may register a new campaign.");
  const wallet=await authorizedDraft(raw.creator,raw.challengeId,raw.signature);
  const chain=await deployedCampaign(BigInt(raw.onchainId));
  const info=chain.campaign;
  if(chain.config.chainId!==Number(record.chain_id)||
    wallet.toLowerCase()!==info.creator.toLowerCase()||
    String(record.token_address).toLowerCase()!==info.rewardToken.toLowerCase()||
    BigInt(record.reward_each_raw)!==info.amountPerClaim||
    Number(record.max_claims)!==info.maxClaims||
    BigInt(Math.floor(new Date(record.starts_at).getTime()/1000))!==info.starts||
    BigInt(Math.floor(new Date(record.ends_at).getTime()/1000))!==info.ends||
    claimSigner().address.toLowerCase()!==info.attestor.toLowerCase())
   throw new Error("On-chain campaign terms or attestor do not match the approved draft.");
  const updated=await questSql().query(
   "UPDATE quest_campaigns SET onchain_campaign_id=$1,vault_address=$2,lifecycle='registered',updated_at=NOW() WHERE id=$3 AND lifecycle='draft' AND LOWER(creator_address)=$4 RETURNING id",
   [raw.onchainId,chain.vault.toLowerCase(),raw.id,wallet.toLowerCase()]);
  if(updated.length!==1)throw new Error("Campaign was already registered or modified.");
  return NextResponse.json({status:"registered",id:raw.id,fullyFunded:info.funded===info.budget,
    note:"Public listing verifies escrow funding again against the chain."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"Campaign registration failed."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
