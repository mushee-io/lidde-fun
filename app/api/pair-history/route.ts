import { NextRequest, NextResponse } from "next/server";
import { isAddress, parseAbiItem, erc20Abi } from "viem";
import { getVerifiedContext, MarketsUnavailable } from "@/lib/phase2/indexed";
import { factoryAbi, pairAbi } from "@/lib/phase2/abis";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const sync = parseAbiItem("event Sync(uint112 reserve0,uint112 reserve1)");
const noStore = { "Cache-Control": "private, no-store" };
function ratio(reserve0: bigint, reserve1: bigint, d0: number, d1: number) {
  if(reserve0===0n || reserve1===0n) return null;
  const fixed = reserve1*(10n**BigInt(d0))*1_000_000n/(reserve0*(10n**BigInt(d1)));
  const integer=fixed/1_000_000n;
  const fractional=(fixed%1_000_000n).toString().padStart(6,"0").replace(/0+$/,"");
  return integer.toString()+(fractional?"."+fractional:"");
}
export async function GET(request: NextRequest) {
  const address=request.nextUrl.searchParams.get("pair")??"";
  if(!isAddress(address))return NextResponse.json({status:"invalid-pair"}, {status:400,headers:noStore});
  try{
    const {config,client,indexed,block}=await getVerifiedContext();
    const pool=indexed.pools.find(p=>p.pair.toLowerCase()===address.toLowerCase());
    if(!pool) return NextResponse.json({status:"not-listed",samples:[]}, {status:404,headers:noStore});
    const [registered,t0,t1,d0,d1]=await Promise.all([
      client.readContract({address:config.factory,abi:factoryAbi,functionName:"getPair",args:[pool.token0,pool.token1],blockNumber:block}),
      client.readContract({address:pool.pair,abi:pairAbi,functionName:"token0",blockNumber:block}),
      client.readContract({address:pool.pair,abi:pairAbi,functionName:"token1",blockNumber:block}),
      client.readContract({address:pool.token0,abi:erc20Abi,functionName:"decimals",blockNumber:block}),
      client.readContract({address:pool.token1,abi:erc20Abi,functionName:"decimals",blockNumber:block})
    ]);
    if(registered.toLowerCase()!==pool.pair.toLowerCase() ||
      t0.toLowerCase()!==pool.token0.toLowerCase() ||t1.toLowerCase()!==pool.token1.toLowerCase()||
      ![6,8,18].includes(d0)||![6,8,18].includes(d1))throw new Error("Invalid pair metadata");
    // Bounded RPC read: recent synchronized reserve prices, NOT a complete trade-candle archive.
    const fromBlock=block>900n?block-900n:0n;
    const logs=await client.getLogs({address:pool.pair,event:sync,fromBlock,toBlock:block,strict:true});
    const sampled=logs.slice(-60);
    const unique=[...new Set(sampled.map(x=>x.blockNumber.toString()))];
    const blocks=new Map(await Promise.all(unique.map(async n=>{
      const b=await client.getBlock({blockNumber:BigInt(n)});
      return [n,b.timestamp.toString()] as const;
    })));
    const samples=sampled.flatMap(log=>{
      const price=ratio(log.args.reserve0,log.args.reserve1,d0,d1);
      if(price===null)return [];
      return [{block:log.blockNumber.toString(),time:blocks.get(log.blockNumber.toString())??null,
        transactionHash:log.transactionHash,price,unit:"token1 per token0"}];
    });
    return NextResponse.json({
      status:"indexed",chainId:config.chainId,pair:pool.pair,indexedBlock:indexed.indexedBlock,
      rangeFromBlock:fromBlock.toString(),unit:"token1 per token0",
      methodology:"Recent on-chain Sync reserve-price samples, not trade-derived OHLC candles; at most 60 observations from up to 900 blocks.",
      samples
    },{headers:noStore});
  }catch(error){
    return NextResponse.json({status:"unavailable",reason:error instanceof MarketsUnavailable?error.reason:"Cannot verify pool price history.",samples:[]},
      {status:503,headers:noStore});
  }
}
