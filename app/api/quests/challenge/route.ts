import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { normalizedWallet } from "@/lib/quests/rules";
import { questSql } from "@/lib/quests/db";
import { publicQuestOrigin } from "@/lib/quests/auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{
  const wallet=normalizedWallet(request.nextUrl.searchParams.get("wallet"));
  const action=request.nextUrl.searchParams.get("action")??"create-draft";
  if(!["create-draft","register-campaign","verify-quest"].includes(action))throw new Error("Unknown challenge action.");
  const origin=publicQuestOrigin();
  const expiry=new Date(Date.now()+5*60000);
  const message=["Lidde Fun - Quest Draft Authorization","Origin: "+origin,"Wallet: "+wallet,
   "Action: "+action,"Nonce: "+randomBytes(32).toString("hex"),
   "Expires: "+expiry.toISOString(),"No funds move and no token approvals are requested."].join("\n");
  const rows=await questSql().query(
   "INSERT INTO quest_auth_challenges(wallet_address,message,expires_at) VALUES($1,$2,$3) RETURNING id",
   [wallet.toLowerCase(),message,expiry.toISOString()]);
  return NextResponse.json({status:"challenge",id:rows[0].id,message,expiresAt:expiry.toISOString()},
   {headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return NextResponse.json({status:"unavailable",reason:error instanceof Error?error.message:"Challenge not available."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
