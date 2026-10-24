import { NextResponse } from "next/server";
import { questSql } from "@/lib/quests/db";
import { deployedCampaign } from "@/lib/quests/vault";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{
  const rows=await questSql().query(
   "SELECT id,creator_address,chain_id,title,description,task_rules,token_address,reward_each_raw,max_claims,starts_at,ends_at,onchain_campaign_id,vault_address FROM quest_campaigns WHERE lifecycle IN('registered','active') AND onchain_campaign_id IS NOT NULL ORDER BY created_at DESC LIMIT 20");
  const published=[];
  for(const raw of rows){
   try{
    const id=BigInt(raw.onchain_campaign_id);
    const {campaign,vault,config}=await deployedCampaign(id);
    if(String(raw.vault_address).toLowerCase()!==vault.toLowerCase()||
      Number(raw.chain_id)!==config.chainId||
      String(raw.creator_address).toLowerCase()!==campaign.creator.toLowerCase()||
      String(raw.token_address).toLowerCase()!==campaign.rewardToken.toLowerCase()||
      BigInt(raw.reward_each_raw)!==campaign.amountPerClaim||
      Number(raw.max_claims)!==campaign.maxClaims)continue;
    const fullyFunded=campaign.funded===campaign.budget;
    published.push({
      id:raw.id,title:raw.title,description:raw.description,tasks:raw.task_rules,
      token:campaign.rewardToken,rewardEachRaw:campaign.amountPerClaim.toString(),
      chainId:config.chainId,vault,onchainId:id.toString(),
      start:Number(campaign.starts),end:Number(campaign.ends),
      claims:Number(campaign.claimCount),maxClaims:Number(campaign.maxClaims),
      funded:fullyFunded,paused:campaign.paused,finalized:campaign.finalized,
      state:!fullyFunded?"awaiting-funding":campaign.finalized?"finalized":
       campaign.paused?"paused":Number(campaign.ends)<Date.now()/1000?"ended":
       Number(campaign.starts)>Date.now()/1000?"scheduled":"active"
    });
   }catch{ /* invalid or stale registration is never surfaced as funded */ }
  }
  return NextResponse.json({status:"verified",campaigns:published,verifiedAt:new Date().toISOString()},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  return NextResponse.json({status:"unavailable",campaigns:[],reason:e instanceof Error?e.message:"Campaign registry unavailable."},
    {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
