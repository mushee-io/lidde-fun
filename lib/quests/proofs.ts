import "server-only";
import { erc20Abi, getAddress, isAddress, keccak256, parseAbi, parseEventLogs, toHex, type Address, type Hex } from "viem";
import { factoryAbi, pairAbi } from "@/lib/phase2/abis";
import { getVerifiedContext, eq, type VerifiedContext } from "@/lib/phase2/indexed";
import type { QuestRule } from "@/lib/quests/rules";

const swapAbi=parseAbi([
 "event Swap(address indexed sender,uint256 amount0In,uint256 amount1In,uint256 amount0Out,uint256 amount1Out,address indexed to)"
]);
export type VerifiedTask={
 task:number;kind:QuestRule["kind"];sourceTxHash:Hex|null;
 block:bigint;blockHash:Hex;digest:Hex;record:{kind:string;quantityRaw:string;token?:string;pair?:string};
};
type Window={start:bigint;end:bigint};
type Provided={txHash?:string};
async function checkPair(ctx:VerifiedContext,pair:Address,at:bigint){
 const code=await ctx.client.getBytecode({address:pair,blockNumber:at});
 if(!code||code==="0x")throw new Error("Quest pair is not a contract on the canonical sandbox.");
 const [t0,t1]=await Promise.all([
  ctx.client.readContract({address:pair,abi:pairAbi,functionName:"token0",blockNumber:at}),
  ctx.client.readContract({address:pair,abi:pairAbi,functionName:"token1",blockNumber:at})
 ]);
 const canonical=await ctx.client.readContract({address:ctx.config.factory,abi:factoryAbi,
  functionName:"getPair",args:[t0,t1],blockNumber:at});
 if(!eq(canonical,pair))throw new Error("Proof pool is not registered in the verified Lidde factory.");
 return {token0:t0,token1:t1};
}
function taskHash(campaignId:string,wallet:Address,index:number,kind:string,block:bigint,reference:string,raw:bigint):Hex{
 return keccak256(toHex(["LIDDE-QUEST-TASK-1",campaignId,wallet.toLowerCase(),String(index),kind,String(block),reference.toLowerCase(),String(raw)].join("|")));
}
export async function verifyTasks(
 campaignId:string,wallet:Address,rules:QuestRule[],window:Window,provided:Provided[]
):Promise<{results:VerifiedTask[];chainId:number;block:bigint}>{
 if(provided.length!==rules.length)throw new Error("Provide task proof data for every configured step.");
 const ctx=await getVerifiedContext();
 const max=ctx.block;
 const current=await ctx.client.getBlock({blockNumber:max});
 if(current.timestamp<window.start||current.timestamp>window.end)
  throw new Error("The indexed canonical block is outside the campaign claim window.");
 const results:VerifiedTask[]=[];
 for(let i=0;i<rules.length;i++){
  const rule=rules[i],proof=provided[i]??{};
  if(!/^[1-9]\d{0,76}$/.test(rule.minRaw))throw new Error("Invalid quest task threshold.");
  const needed=BigInt(rule.minRaw);
  if(rule.kind==="hold"){
   if(!rule.token||!isAddress(rule.token))throw new Error("Missing hold token address.");
   const contract=getAddress(rule.token);
   const code=await ctx.client.getBytecode({address:contract,blockNumber:max});
   if(!code||code==="0x")throw new Error("Hold token is not deployed on the verified sandbox.");
   const bal=await ctx.client.readContract({address:contract,abi:erc20Abi,
    functionName:"balanceOf",args:[wallet],blockNumber:max});
   if(bal<needed)throw new Error("Wallet does not hold the minimum quest token balance.");
   results.push({task:i,kind:"hold",sourceTxHash:null,block:max,blockHash:current.hash,
    digest:taskHash(campaignId,wallet,i,"hold",max,contract,bal),
    record:{kind:"hold",quantityRaw:bal.toString(),token:contract}});
   continue;
  }
  if(!rule.pair||!isAddress(rule.pair))throw new Error("Task requires a pool address.");
  const pair=getAddress(rule.pair);
  if(rule.kind==="lp"){
   await checkPair(ctx,pair,max);
   const amount=await ctx.client.readContract({address:pair,abi:pairAbi,functionName:"balanceOf",
    args:[wallet],blockNumber:max});
   if(amount<needed)throw new Error("Wallet LP holdings are below the quest threshold.");
   results.push({task:i,kind:"lp",sourceTxHash:null,block:max,blockHash:current.hash,
    digest:taskHash(campaignId,wallet,i,"lp",max,pair,amount),
    record:{kind:"lp",quantityRaw:amount.toString(),pair}});
   continue;
  }
  if(rule.kind!=="swap"||!rule.token||!isAddress(rule.token))
   throw new Error("Swap proof requires a target output token.");
  if(!proof.txHash||!/^0x[0-9a-fA-F]{64}$/.test(proof.txHash))
   throw new Error("Swap task requires a confirmed transaction hash.");
  const hash=proof.txHash as Hex;
  const [tx,receipt]=await Promise.all([
   ctx.client.getTransaction({hash}),ctx.client.getTransactionReceipt({hash})
  ]);
  if(receipt.status!=="success"||receipt.blockNumber>max||
     !tx.to||!eq(tx.to,ctx.config.router)||!eq(tx.from,wallet))
   throw new Error("Swap evidence must be a completed direct Router transaction by the claimant.");
  const observed=await ctx.client.getBlock({blockNumber:receipt.blockNumber});
  if(!eq(observed.hash,receipt.blockHash)||observed.timestamp<window.start||observed.timestamp>window.end)
   throw new Error("Swap receipt is outside canonical campaign blocks.");
  const tokens=await checkPair(ctx,pair,receipt.blockNumber);
  const out0=eq(rule.token,tokens.token0),out1=eq(rule.token,tokens.token1);
  if(!out0&&!out1)throw new Error("Swap output token is not in the referenced pool.");
  const events=parseEventLogs({abi:swapAbi,eventName:"Swap",logs:receipt.logs,strict:true})
    .filter(log=>eq(log.address,pair));
  const received=events.reduce((sum,log)=>sum+(out0?log.args.amount0Out:log.args.amount1Out),0n);
  if(received<needed)throw new Error("Confirmed swap output is below the specified task minimum.");
  results.push({task:i,kind:"swap",sourceTxHash:hash,block:receipt.blockNumber,blockHash:receipt.blockHash,
   digest:taskHash(campaignId,wallet,i,"swap",receipt.blockNumber,hash,received),
   record:{kind:"swap",quantityRaw:received.toString(),token:rule.token,pair}});
 }
 return {results,chainId:ctx.config.chainId,block:max};
}
