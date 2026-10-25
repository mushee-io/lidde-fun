import {NextResponse} from "next/server";
import {isAddress,parseAbiItem,parseEventLogs,type Hex} from "viem";
import {getVerifiedContext,MarketsUnavailable,eq} from "@/lib/phase2/indexed";
import {acceptableEndpoint} from "@/lib/infra/config";
export const dynamic="force-dynamic";export const runtime="nodejs";
const eventAbi=[parseAbiItem("event Swap(address indexed sender,uint256 amount0In,uint256 amount1In,uint256 amount0Out,uint256 amount1Out,address indexed to)")];
const headers={"Cache-Control":"private, no-store"};
type EventRow={transaction_hash:string;block_number:string|number;log_index:number;token0:string;token1:string;amount0_in:string;amount1_in:string;amount0_out:string;amount1_out:string};
const uint=(v:unknown)=>typeof v==="string"&&/^\d{1,78}$/.test(v);
function isRow(v:unknown):v is EventRow{
 if(!v||typeof v!=="object")return false;
 const x=v as Record<string,unknown>;
 return typeof x.transaction_hash==="string"&&/^0x[0-9a-fA-F]{64}$/.test(x.transaction_hash)&&
  (uint(x.block_number)||typeof x.block_number==="number"&&Number.isSafeInteger(x.block_number)&&x.block_number>=0)&&
  typeof x.log_index==="number"&&Number.isSafeInteger(x.log_index)&&x.log_index>=0&&
  typeof x.token0==="string"&&isAddress(x.token0)&&typeof x.token1==="string"&&isAddress(x.token1)&&
  ["amount0_in","amount1_in","amount0_out","amount1_out"].every(k=>uint(x[k]));
}
export async function GET(){
 try{
  const ctx=await getVerifiedContext();
  const url=process.env.LIDDE_DEX_MARKETS_API_URL?.trim()??"";
  if(!acceptableEndpoint(url,process.env.NODE_ENV!=="production"))throw new Error("Verified markets API is unavailable.");
  const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw new Error("The canonical index is not responding.");
  const payload=await response.json() as Record<string,unknown>;
  if(payload.status!=="indexed"||payload.chainId!==ctx.config.chainId||
    !eq(String(payload.factory),ctx.config.factory)||
    !Array.isArray(payload.recentSwaps)||
    !uint(payload.canonicalBlock)||
    !/^0x[0-9a-fA-F]{64}$/.test(String(payload.canonicalBlockHash))||
    BigInt(payload.canonicalBlock as string)!==ctx.block||
    !eq(String(payload.canonicalBlockHash),ctx.indexed.blockHash))
   throw new Error("Indexer activity payload is not anchored to the canonical checkpoint.");
  const rows=payload.recentSwaps.slice(0,8);
  const events=[];
  for(const item of rows){
   if(!isRow(item))continue;
   const height=BigInt(item.block_number);
   if(height>ctx.block)continue;
   const pool=ctx.indexed.pools.find(p=>
    eq(p.token0,item.token0)&&eq(p.token1,item.token1));
   if(!pool)continue;
   try{
    const hash=item.transaction_hash as Hex;
    const [tx,receipt,block]=await Promise.all([
     ctx.client.getTransaction({hash}),ctx.client.getTransactionReceipt({hash}),
     ctx.client.getBlock({blockNumber:height})
    ]);
    if(receipt.status!=="success"||receipt.blockNumber!==height||
      !eq(receipt.blockHash,block.hash)||!tx.to||!eq(tx.to,ctx.config.router))
     continue;
    const decoded=parseEventLogs({abi:eventAbi,eventName:"Swap",logs:receipt.logs,strict:true});
    const log=decoded.find(x=>eq(x.address,pool.pair)&&x.logIndex===item.log_index);
    if(!log)continue;
    const values=log.args;
    if(values.amount0In!==BigInt(item.amount0_in)||
      values.amount1In!==BigInt(item.amount1_in)||
      values.amount0Out!==BigInt(item.amount0_out)||
      values.amount1Out!==BigInt(item.amount1_out))continue;
    const outgoing=values.amount0Out>0n?{token:pool.token0,quantity:values.amount0Out}:{token:pool.token1,quantity:values.amount1Out};
    events.push({txHash:hash,wallet:tx.from,pair:pool.pair,side:"swap",token:outgoing.token,
     rawAmount:outgoing.quantity.toString(),block:height.toString()});
   }catch{/* unverified rows do not reach the UI */}
  }
  return NextResponse.json({status:"indexed",events,indexedBlock:ctx.block.toString(),
   note:"Only confirmed, canonical direct-router Swap logs are displayed. Amounts are raw token units, never USD values."},{headers});
 }catch(e){
  return NextResponse.json({status:"unavailable",events:[],reason:e instanceof Error?e.message:"Canonical wallet activity is not verified."},
    {status:503,headers});
 }
}
