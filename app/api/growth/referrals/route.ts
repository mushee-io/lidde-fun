import { NextRequest, NextResponse } from "next/server";
import { checkOrigin, authorizedQuest } from "@/lib/quests/auth";
import { normalizedWallet } from "@/lib/quests/rules";
import { questSql } from "@/lib/quests/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try {
  checkOrigin(request);
  const input=await request.json() as {op?:string;wallet?:unknown;code?:unknown;challengeId?:unknown;signature?:unknown};
  if(!["join","summary"].includes(String(input.op)))throw new Error("Unknown referral action.");
  const wallet=normalizedWallet(input.wallet);
  await authorizedQuest(wallet,input.challengeId,input.signature,"growth-referral");
  const sql=questSql(),me=wallet.toLowerCase();
  if(input.op==="join"){
   if(typeof input.code!=="string"||!/^[0-9a-f]{18}$/.test(input.code))
    throw new Error("Enter a valid referral invite code.");
   const parent=await sql.query(
    "SELECT wallet_address FROM growth_profiles WHERE referral_code=$1 AND show_on_leaderboard=TRUE LIMIT 1",[input.code]);
   if(parent.length!==1)throw new Error("Referrer must have an opted-in Lidde Fun profile.");
   const inviter=String(parent[0].wallet_address).toLowerCase();
   if(inviter===me)throw new Error("A wallet cannot refer itself.");
   // Do not label this registration a verified conversion, new person or reward.
   const saved=await sql.query(
    "INSERT INTO growth_referrals(referee_wallet,referrer_wallet,referral_code) VALUES($1,$2,$3) ON CONFLICT(referee_wallet) DO NOTHING RETURNING referee_wallet",
    [me,inviter,input.code]);
   if(saved.length===0)throw new Error("Wallet is already attributed to an earlier invite.");
   return NextResponse.json({status:"attributed",note:"Referral attributed only. No XP or token payout for clicking or accepting an invite."});
  }
  const profile=await sql.query("SELECT referral_code,show_on_leaderboard FROM growth_profiles WHERE wallet_address=$1 LIMIT 1",[me]);
  const aggregate=await sql.query(
   "SELECT r.referee_wallet, r.accepted_at, EXISTS(SELECT 1 FROM growth_xp_events x WHERE x.wallet_address=r.referee_wallet) AS verified_claim FROM growth_referrals r WHERE r.referrer_wallet=$1 ORDER BY r.accepted_at DESC LIMIT 100",
   [me]);
  const member=await sql.query(
   "SELECT r.referrer_wallet,r.accepted_at FROM growth_referrals r WHERE r.referee_wallet=$1 LIMIT 1",[me]);
  return NextResponse.json({status:"ok",code:profile[0]&&profile[0].show_on_leaderboard?String(profile[0].referral_code):null,
    invitees:aggregate.map(x=>({wallet:String(x.referee_wallet),acceptedAt:x.accepted_at,verifiedClaim:!!x.verified_claim})),
    attributedTo:member[0]?String(member[0].referrer_wallet):null,
    disclaimer:"A verified claim is one observed wallet event—not proof of a unique human. No automatic referral rewards.",
    truncated:aggregate.length===100},{headers:{"Cache-Control":"private,no-store"}});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"Cannot verify referral request."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
