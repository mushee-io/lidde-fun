import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { authorizedQuest,checkOrigin } from "@/lib/quests/auth";
import { normalizedWallet } from "@/lib/quests/rules";
import { questSql } from "@/lib/quests/db";
export const runtime="nodejs";export const dynamic="force-dynamic";
function nickname(value:unknown):string|null{
 if(value===null||value==="")return null;
 if(typeof value!=="string"||!/^[\p{L}\p{N}][\p{L}\p{N}_. -]{1,23}$/u.test(value.trim())||
  /^(lidde|administrator|official|staff|support|moderator|team)$/i.test(value.trim()))
  throw new Error("Choose a non-impersonating name of 2–24 letters, numbers, spaces or simple punctuation.");
 return value.trim();
}
export async function POST(request:NextRequest){
 try {
  checkOrigin(request);
  const raw=await request.json() as {op?:string;wallet?:unknown;challengeId?:unknown;signature?:unknown;nickname?:unknown;public?:unknown};
  if(!["read","save","delete"].includes(String(raw.op)))throw new Error("Unknown account operation.");
  const wallet=normalizedWallet(raw.wallet);
  await authorizedQuest(wallet,raw.challengeId,raw.signature,"growth-account");
  const sql=questSql(),key=wallet.toLowerCase();
  if(raw.op==="delete"){
   // Delete private referral + profile preferences and off-chain XP.
   // Public blockchain history is immutable and outside this deletion.
   await sql.query("DELETE FROM growth_referrals WHERE referee_wallet=$1 OR referrer_wallet=$1",[key]);
   await sql.query("DELETE FROM growth_xp_events WHERE wallet_address=$1",[key]);
   await sql.query("DELETE FROM growth_profiles WHERE wallet_address=$1",[key]);
   return NextResponse.json({status:"deleted",note:"Off-chain profile, referrals and XP deleted. Public chain receipts remain immutable."});
  }
  if(raw.op==="save"){
   const name=nickname(raw.nickname);
   if(typeof raw.public!=="boolean")throw new Error("Explicit public ranking opt-in is required.");
   const code=randomBytes(9).toString("hex");
   await sql.query(
    "INSERT INTO growth_profiles(wallet_address,nickname,show_on_leaderboard,referral_code) VALUES($1,$2,$3,$4) ON CONFLICT(wallet_address) DO UPDATE SET nickname=EXCLUDED.nickname,show_on_leaderboard=EXCLUDED.show_on_leaderboard,updated_at=NOW()",
    [key,name,raw.public,code]);
  }
  const rows=await sql.query("SELECT nickname,show_on_leaderboard,referral_code FROM growth_profiles WHERE wallet_address=$1 LIMIT 1",[key]);
  return NextResponse.json({status:"ok",wallet,profile:rows[0]?{
   nickname:rows[0].nickname,public:!!rows[0].show_on_leaderboard,
   referralCode:String(rows[0].referral_code)
  }:null,consent:"Public leaderboard appearance is off by default. Referral codes identify wallets, not unique people."},
   {headers:{"Cache-Control":"private,no-store"}});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"Profile request failed."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
