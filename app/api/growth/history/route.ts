import { NextRequest, NextResponse } from "next/server";
import { authorizedQuest, checkOrigin } from "@/lib/quests/auth";
import { normalizedWallet } from "@/lib/quests/rules";
import { questSql } from "@/lib/quests/db";
import { getVerifiedContext } from "@/lib/phase2/indexed";
import { canonicalScores, type RawXP } from "@/lib/growth/claims";
import { CLAIM_XP, XP_ALGORITHM } from "@/lib/growth/scoring";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  checkOrigin(request);
  const input=await request.json() as {wallet?:unknown;challengeId?:unknown;signature?:unknown};
  const wallet=normalizedWallet(input.wallet);
  await authorizedQuest(wallet,input.challengeId,input.signature,"growth-account");
  const ctx=await getVerifiedContext();
  const rows=await questSql().query(
   "SELECT wallet_address,chain_id,vault_address,campaign_id,transaction_hash,log_index,block_number,block_hash,event_at,xp FROM growth_xp_events WHERE wallet_address=$1 AND chain_id=$2 AND block_number<=$3 ORDER BY event_at DESC, transaction_hash LIMIT 101",
   [wallet.toLowerCase(),ctx.config.chainId,ctx.block.toString()]);
  if(rows.length>100)throw new Error("Your XP record exceeds the bounded score explorer capacity.");
  await canonicalScores(rows as RawXP[],ctx.block,ctx.client);
  return NextResponse.json({status:"verified",wallet,algorithm:XP_ALGORITHM,
   indexedBlock:ctx.block.toString(),totalXP:rows.length*CLAIM_XP,events:rows.map(r=>({
    campaignId:String(r.campaign_id),transactionHash:String(r.transaction_hash),
    block:String(r.block_number),blockHash:String(r.block_hash),at:r.event_at,xp:Number(r.xp),
    source:"QuestEscrow.RewardClaimed"
   })),note:"Wallet-private off-chain event explorer; source transactions remain publicly queryable on the test blockchain."},
   {headers:{"Cache-Control":"private,no-store"}});
 }catch(e){
  return NextResponse.json({status:"unavailable",reason:e instanceof Error?e.message:"XP history not verified."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
