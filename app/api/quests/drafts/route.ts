import { NextRequest, NextResponse } from "next/server";
import { questSql } from "@/lib/quests/db";
import { authorizedDraft, checkOrigin } from "@/lib/quests/auth";
import { validateDraft } from "@/lib/quests/rules";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  checkOrigin(request);
  const raw=await request.json() as {draft?:unknown;challengeId?:unknown;signature?:unknown};
  const draft=validateDraft(raw.draft);
  const wallet=await authorizedDraft(draft.creator,raw.challengeId,raw.signature);
  const chainId=Number(process.env.LIDDE_FUN_TESTNET_CHAIN_ID);
  if(!Number.isSafeInteger(chainId)||chainId<=1000||[4613,1].includes(chainId))
   throw new Error("A separate sandbox chain ID is required for a durable quest draft.");
  const rows=await questSql().query(
   "INSERT INTO quest_campaigns(creator_address,chain_id,title,description,task_rules,token_address,reward_each_raw,max_claims,starts_at,ends_at,lifecycle) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,'draft') RETURNING id",
   [wallet.toLowerCase(),chainId,draft.title,draft.description,JSON.stringify(draft.tasks),
    draft.token.toLowerCase(),draft.rewardEachRaw,draft.maxClaims,draft.startsAt,draft.endsAt]);
  return NextResponse.json({status:"draft",id:rows[0].id,note:"Draft only; no claim rights or token funding."},
   {status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return NextResponse.json({status:"rejected",reason:error instanceof Error?error.message:"Draft creation failed."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
