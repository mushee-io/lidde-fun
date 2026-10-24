import { NextRequest, NextResponse } from "next/server";
import { authorizedQuest, checkOrigin } from "@/lib/quests/auth";
import { normalizedWallet, isUuid } from "@/lib/quests/rules";
import { verifyClaimXP } from "@/lib/growth/claims";
import { questSql } from "@/lib/quests/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  checkOrigin(request);
  const raw=await request.json() as {wallet?:unknown;id?:string;transactionHash?:string;challengeId?:unknown;signature?:unknown};
  if(!isUuid(String(raw.id)))throw new Error("Valid campaign UUID required.");
  const wallet=normalizedWallet(raw.wallet);
  await authorizedQuest(wallet,raw.challengeId,raw.signature,"growth-claim");
  const claim=await verifyClaimXP(raw.id!,wallet,String(raw.transactionHash??""));
  const rows=await questSql().query(
   "INSERT INTO growth_xp_events(chain_id,vault_address,campaign_id,wallet_address,transaction_hash,log_index,block_number,block_hash,event_at,xp) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING id",
   [claim.chainId,claim.vault.toLowerCase(),claim.campaignUuid,claim.wallet.toLowerCase(),
     claim.transactionHash.toLowerCase(),claim.logIndex,claim.block.toString(),
     claim.blockHash.toLowerCase(),new Date(claim.eventAt).toISOString(),claim.xp]);
  if(rows.length===0){
   const prior=await questSql().query(
    "SELECT transaction_hash,wallet_address FROM growth_xp_events WHERE campaign_id=$1 AND LOWER(wallet_address)=$2 LIMIT 1",
    [claim.campaignUuid,wallet.toLowerCase()]);
   if(prior.length!==1||String(prior[0].transaction_hash).toLowerCase()!==claim.transactionHash.toLowerCase())
    throw new Error("This claim event is already credited elsewhere or conflicts with an existing proof.");
  }
  return NextResponse.json({status:rows.length?"credited":"already-credited",xp:claim.xp,algorithm:"lidde-quest-v1",
   chainId:claim.chainId,block:claim.block.toString(),txHash:claim.transactionHash,
   note:"Off-chain XP only. No token redemption, transfer or guaranteed retrodrop."},
   {headers:{"Cache-Control":"private,no-store"}});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"XP proof rejected."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
