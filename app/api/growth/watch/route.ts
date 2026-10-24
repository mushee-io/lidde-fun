import { NextRequest, NextResponse } from "next/server";
import { zeroAddress } from "viem";
import { authorizedQuest, checkOrigin } from "@/lib/quests/auth";
import { normalizedWallet, isUuid } from "@/lib/quests/rules";
import { questSql } from "@/lib/quests/db";
import { buildDiscovery } from "@/lib/phase2/discovery";
import { getVerifiedContext } from "@/lib/phase2/indexed";
import { checkAlert, fixedSix } from "@/lib/growth/simulation";
import { validateWatch } from "@/lib/growth/watch";

export const runtime="nodejs";export const dynamic="force-dynamic";
const responseHeaders={"Cache-Control":"private,no-store"};
export async function POST(request:NextRequest){
 try{
  checkOrigin(request);
  const raw=await request.json() as {op?:string;wallet?:unknown;challengeId?:unknown;signature?:unknown;
   rule?:unknown;ruleId?:string;enabled?:boolean};
  if(!["list","add","toggle","delete","check","export","erase"].includes(String(raw.op)))
   throw new Error("Unknown watchlist action.");
  const wallet=normalizedWallet(raw.wallet);
  await authorizedQuest(wallet,raw.challengeId,raw.signature,"growth-watch");
  const sql=questSql(),owner=wallet.toLowerCase();
  if(raw.op==="erase"){
   await sql.query("DELETE FROM growth_watch_rules WHERE owner_wallet=$1",[owner]);
   return NextResponse.json({status:"erased",note:"All off-chain rules and their alert history were deleted."},{headers:responseHeaders});
  }
  if(raw.op==="add"){
   const spec=validateWatch(raw.rule);
   const ctx=await getVerifiedContext();
   const list=await buildDiscovery(ctx);
   if(spec.type!=="new_pair"&&!list.pools.some(p=>p.pair.toLowerCase()===spec.pair.toLowerCase()))
    throw new Error("Rule target is not a canonical indexed Factory pair.");
   const count=await sql.query("SELECT COUNT(*)::INT AS total FROM growth_watch_rules WHERE owner_wallet=$1",[owner]);
   if(Number(count[0].total)>=20)throw new Error("Maximum 20 watch rules per wallet.");
   await sql.query(
    "INSERT INTO growth_watch_rules(owner_wallet,chain_id,pair_address,rule_type,threshold_six,created_at_block) VALUES($1,$2,$3,$4,$5,$6)",
    [owner,ctx.config.chainId,spec.pair.toLowerCase(),spec.type,
     spec.thresholdSix?.toString()??null,ctx.block.toString()]);
  }
  if(raw.op==="delete"||raw.op==="toggle"){
   if(!isUuid(String(raw.ruleId)))throw new Error("Valid rule ID required.");
   if(raw.op==="delete")await sql.query("DELETE FROM growth_watch_rules WHERE id=$1 AND owner_wallet=$2",
     [raw.ruleId,owner]);
   else {
    if(typeof raw.enabled!=="boolean")throw new Error("Choose enabled or disabled.");
    await sql.query("UPDATE growth_watch_rules SET enabled=$1,updated_at=NOW(),last_matched=FALSE WHERE id=$2 AND owner_wallet=$3",
     [raw.enabled,raw.ruleId,owner]);
   }
  }
  if(raw.op==="check"){
   const ctx=await getVerifiedContext();
   const list=await buildDiscovery(ctx);
   const rows=await sql.query("SELECT * FROM growth_watch_rules WHERE owner_wallet=$1 AND chain_id=$2 AND enabled=TRUE ORDER BY created_at,id LIMIT 21",
    [owner,ctx.config.chainId]);
   if(rows.length>20)throw new Error("Rule list exceeds verification budget.");
   const outcomes:{ruleId:string;state:string;pair:string;block?:string}[]=[];
   for(const r of rows){
    const type=String(r.rule_type) as "new_pair"|"price_above"|"price_below";
    const id=String(r.id),created=BigInt(r.created_at_block);
    if(type==="new_pair"){
     // A bounded subset of latest pool registrations; no invented discovery.
     const targets=list.pools.filter(p=>BigInt(p.createdBlock)>created && BigInt(p.createdBlock)<=ctx.block).slice(0,5);
     for(const p of targets){
      const header=await ctx.client.getBlock({blockNumber:BigInt(p.createdBlock)});
      const inserted=await sql.query(
       "INSERT INTO growth_alert_events(rule_id,chain_id,pair_address,block_number,block_hash,event_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id",
       [id,ctx.config.chainId,p.pair.toLowerCase(),p.createdBlock,header.hash.toLowerCase(),"new:"+p.pair.toLowerCase()]);
      if(inserted.length)outcomes.push({ruleId:id,state:"new-pair",pair:p.pair,block:p.createdBlock});
     }
     continue;
    }
    const pool=list.pools.find(p=>p.pair.toLowerCase()===String(r.pair_address).toLowerCase());
    if(!pool||pool.price0In1===null){
     outcomes.push({ruleId:id,state:"unavailable",pair:String(r.pair_address)});continue;
    }
    const ratio=fixedSix(pool.price0In1);
    const match=checkAlert(type,ratio,BigInt(r.threshold_six),BigInt(pool.createdBlock),created);
    if(!match) {
     await sql.query("UPDATE growth_watch_rules SET last_matched=FALSE,updated_at=NOW() WHERE id=$1 AND owner_wallet=$2",[id,owner]);
     continue;
    }
    // Edge-triggered alert (false→true) with a 30-minute cooldown.
    const fired=await sql.query(
     "UPDATE growth_watch_rules SET last_matched=TRUE,last_fired_at=NOW(),updated_at=NOW() WHERE id=$1 AND owner_wallet=$2 AND last_matched=FALSE AND (last_fired_at IS NULL OR last_fired_at<NOW()-INTERVAL '30 minutes') RETURNING id",
     [id,owner]);
    if(!fired.length)continue;
    const saved=await sql.query(
     "INSERT INTO growth_alert_events(rule_id,chain_id,pair_address,block_number,block_hash,observed_ratio_six,event_key) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id",
     [id,ctx.config.chainId,pool.pair.toLowerCase(),ctx.block.toString(),ctx.indexed.blockHash.toLowerCase(),
      ratio.toString(),"cross:"+ctx.indexed.blockHash.toLowerCase()]);
    if(saved.length)outcomes.push({ruleId:id,state:"threshold-crossed",pair:pool.pair,block:ctx.block.toString()});
   }
   return NextResponse.json({status:"checked",indexedBlock:ctx.block.toString(),
    detected:outcomes,note:"Rules are evaluated on demand against verified indexed pools. No background push, Telegram or email delivery is active."},
    {headers:responseHeaders});
  }
  const rules=await sql.query(
   "SELECT id,chain_id,pair_address,rule_type,threshold_six,enabled,created_at_block,last_fired_at FROM growth_watch_rules WHERE owner_wallet=$1 ORDER BY created_at,id LIMIT 20",
   [owner]);
  const events=await sql.query(
   "SELECT e.id,e.rule_id,e.pair_address,e.block_number,e.block_hash,e.observed_ratio_six,e.created_at FROM growth_alert_events e JOIN growth_watch_rules r ON r.id=e.rule_id WHERE r.owner_wallet=$1 ORDER BY e.created_at DESC LIMIT 50",
   [owner]);
  return NextResponse.json({status:"ok",rules:rules.map(x=>({
   id:x.id,chainId:Number(x.chain_id),pair:String(x.pair_address),type:x.rule_type,
   thresholdSix:x.threshold_six===null?null:String(x.threshold_six),
   enabled:!!x.enabled,createdAtBlock:String(x.created_at_block),lastFiredAt:x.last_fired_at
  })),events:events.map(x=>({
   id:x.id,ruleId:x.rule_id,pair:x.pair_address,block:String(x.block_number),
   blockHash:x.block_hash,ratioSix:x.observed_ratio_six===null?null:String(x.observed_ratio_six),
   createdAt:x.created_at
  })),note:"Wallet-private saved rules and confirmed-indexed alert records. No background delivery configured."},
   {headers:responseHeaders});
 }catch(e){
  return NextResponse.json({status:"rejected",reason:e instanceof Error?e.message:"Watch operation failed."},
   {status:400,headers:{"Cache-Control":"no-store"}});
 }
}
