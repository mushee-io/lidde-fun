import {NextRequest,NextResponse} from "next/server";
import {checkOrigin,authorizedQuest} from "@/lib/quests/auth";
import {questSql} from "@/lib/quests/db";
import {normalizedWallet} from "@/lib/quests/rules";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(req:NextRequest){
 try{
  checkOrigin(req);
  if(Number(req.headers.get("content-length")??"0")>2500)throw Error("Request is too large.");
  const data=await req.json() as Record<string,unknown>;
  const wallet=await authorizedQuest(data.wallet,data.challengeId,data.signature,"growth-account");
  const me=wallet.toLowerCase();
  const op=data.op;
  if(!["list","follow","unfollow"].includes(String(op)))throw Error("Unknown follow operation.");
  const db=questSql();
  if(op!=="list"){
   const target=normalizedWallet(data.followed).toLowerCase();
   if(me===target)throw Error("You cannot follow your own wallet.");
   if(op==="follow"){
    const count=await db.query("SELECT COUNT(*)::int AS n FROM growth_follows WHERE follower_wallet=$1",[me]);
    if(Number(count[0].n)>=100)throw Error("Follow limit is 100 wallets.");
    await db.query("INSERT INTO growth_follows(follower_wallet,followed_wallet) VALUES($1,$2) ON CONFLICT DO NOTHING",[me,target]);
   }else await db.query("DELETE FROM growth_follows WHERE follower_wallet=$1 AND followed_wallet=$2",[me,target]);
  }
  const rows=await db.query("SELECT followed_wallet FROM growth_follows WHERE follower_wallet=$1 ORDER BY created_at DESC LIMIT 100",[me]);
  return NextResponse.json({status:"verified",wallet,follows:rows.map(x=>String(x.followed_wallet))},{headers});
 }catch(e){
  return NextResponse.json({status:"unavailable",reason:e instanceof Error?e.message:"Wallet follow operation is unavailable."},{status:400,headers});
 }
}
