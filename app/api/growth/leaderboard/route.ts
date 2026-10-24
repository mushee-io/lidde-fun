import { NextRequest, NextResponse } from "next/server";
import { getVerifiedContext } from "@/lib/phase2/indexed";
import { questSql } from "@/lib/quests/db";
import { canonicalScores, type RawXP } from "@/lib/growth/claims";
import { periodLabel,rankEvidence,type ScoreWindow,XP_ALGORITHM } from "@/lib/growth/scoring";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try {
  const window=request.nextUrl.searchParams.get("window")??"week";
  if(!["week","month","season","all"].includes(window))throw new Error("Invalid ranking window.");
  const ctx=await getVerifiedContext();
  const sql=questSql();
  // Deliberate hard limit: never publish a partial leaderboard that could misrank wallets.
  const rows=await sql.query(
   "SELECT wallet_address,chain_id,vault_address,campaign_id,transaction_hash,log_index,block_number,block_hash,event_at,xp FROM growth_xp_events WHERE chain_id=$1 AND block_number<=$2 ORDER BY event_at DESC,transaction_hash ASC LIMIT 501",
   [ctx.config.chainId,ctx.block.toString()]);
  if(rows.length>500)throw new Error("The verified XP event query exceeds the safe in-process boundary. Deploy a separate reconciled ranking worker.");
  await canonicalScores(rows as RawXP[],ctx.block,ctx.client);
  const profiles=await sql.query("SELECT wallet_address,nickname,show_on_leaderboard FROM growth_profiles WHERE show_on_leaderboard=TRUE ORDER BY wallet_address LIMIT 501");
  if(profiles.length>500)throw new Error("Profile count exceeds bounded public ranking capacity.");
  const timestamp=Date.now();
  const scores=rankEvidence(rows.map(x=>({
    wallet:String(x.wallet_address),eventId:String(x.chain_id)+":"+String(x.transaction_hash)+":"+String(x.log_index),
    at:new Date(String(x.event_at)).getTime(),xp:Number(x.xp),type:"quest_claim" as const
  })),profiles.map(p=>({
    wallet:String(p.wallet_address),nickname:p.nickname===null?null:String(p.nickname),public:!!p.show_on_leaderboard
  })),window as ScoreWindow,timestamp);
  return NextResponse.json({status:"verified",algorithm:XP_ALGORITHM,window,period:periodLabel(window as ScoreWindow,timestamp),
   chainId:ctx.config.chainId,indexedBlock:ctx.block.toString(),rankings:scores,
   disclosure:"Only opted-in wallets with verified escrow claim events are ranked. One confirmed campaign claim = 100 off-chain XP. No trade volume, referral clicks, monetary rewards or Sybil identity guarantees."},
   {headers:{"Cache-Control":"private,no-store"}});
 } catch(e){
  return NextResponse.json({status:"unavailable",rankings:[],reason:e instanceof Error?e.message:"Verified rankings unavailable."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
