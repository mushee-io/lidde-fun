"use client";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import Link from "next/link";
import { Activity, ArrowLeftRight, ArrowRight, ShieldAlert, LockKeyhole, FlaskConical, RefreshCcw } from "lucide-react";
import { discovery, type DiscoveryResponse } from "@/lib/phase2/browser-data";
import { simulateSpot, type PoolQuote } from "@/lib/growth/simulation";
type LabCalculation={ok:true;quantity:bigint;cap:bigint;quote:PoolQuote;warning:boolean;scenarios:{scale:number;output:string;impact:number|null}[]}|{ok:false;error:string};
const short=(s:string)=>s.slice(0,8)+"…"+s.slice(-5);
export function TradingLab(){
 const [markets,setMarkets]=useState<DiscoveryResponse|null>(null),[error,setError]=useState("Checking verified Lidde indexer…");
 const [busy,setBusy]=useState(false);
 const [pair,setPair]=useState(""),[inverse,setInverse]=useState(false),[amount,setAmount]=useState("1");
 const [budget,setBudget]=useState("10"),[slippage,setSlippage]=useState("0.5");
 const [confirmRisk,setConfirmRisk]=useState(false);
 async function refresh(){
  setBusy(true);
  try{const data=await discovery();setMarkets(data);setPair(prev=>data.pools.some(p=>p.pair===prev)?prev:data.pools[0]?.pair??"");setError("");}
  catch(e){setMarkets(null);setError(e instanceof Error?e.message:"No canonical markets available.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const target=markets?.pools.find(p=>p.pair===pair);
 const tokenIn=target?(inverse?target.token1Symbol:target.token0Symbol):"—";
 const tokenOut=target?(inverse?target.token0Symbol:target.token1Symbol):"—";
 const precisionIn=target?(inverse?target.token1Decimals:target.token0Decimals):18;
 const precisionOut=target?(inverse?target.token0Decimals:target.token1Decimals):18;
 const calculation=useMemo<LabCalculation|null>(()=>{
  if(!target)return null;
  try{
   if(!/^\d+(?:\.\d+)?$/.test(amount)||!/^\d+(?:\.\d+)?$/.test(budget))throw Error("Use positive token units.");
   const quantity=parseUnits(amount,precisionIn),cap=parseUnits(budget,precisionIn);
   if(quantity<=0n||cap<=0n||quantity>cap)throw Error("Amount exceeds the self-imposed per-trade token budget.");
   const raw0=BigInt(target.reserve0),raw1=BigInt(target.reserve1);
   const slippageBps=Math.round(Number(slippage)*100);
   const quote=simulateSpot(inverse?raw1:raw0,inverse?raw0:raw1,quantity,30,slippageBps);
   return {ok:true,quantity,cap,quote,warning:quote.priceImpactBps>500,
    scenarios:[0.5,1,2].map(scale=>{
      const input=quantity*BigInt(Math.round(scale*1000))/1000n;
      try{const x=simulateSpot(inverse?raw1:raw0,inverse?raw0:raw1,input,30,slippageBps);return {scale,output:formatUnits(x.amountOut,precisionOut),impact:x.priceImpactBps};}
      catch{return {scale,output:"Unquotable",impact:null};}
    })};
  }catch(e){return {ok:false,error:e instanceof Error?e.message:"Cannot simulate pool."};}
 },[target,amount,budget,slippage,precisionIn,precisionOut,inverse]);
 return <div className="growth-workspace">
  <div className="growth-heading"><span><FlaskConical size={16}/> M17 · RESEARCH ONLY</span><h1>Advanced trading lab.</h1>
   <p>Analyze bounded, valueless AMM quotes before choosing to open the normal wallet-signed spot screen. The lab never signs transactions or operates automated bots.</p></div>
  <div className="growth-grid">
   <section className="growth-panel growth-form"><div className="growth-section-top"><h2><Activity size={18}/> Canonical pool research</h2><button onClick={()=>void refresh()} disabled={busy}><RefreshCcw size={14}/> Refresh</button></div>
    {error&&<div className="growth-unavailable"><ShieldAlert size={21}/><p>{error}</p></div>}
    {markets&&<><div className="growth-meta"><span>Indexed block: {markets.indexedBlock}</span><span>Chain: {markets.chainId}</span><span>AMM: v2-style; assumed 30 bps fee</span></div>
      <label>Verified pair<select value={pair} onChange={e=>setPair(e.target.value)}>
       {markets.pools.map(p=><option key={p.pair} value={p.pair}>{p.token0Symbol} / {p.token1Symbol} · {short(p.pair)}</option>)}</select></label>
      <div className="growth-actions"><button onClick={()=>setInverse(v=>!v)}><ArrowLeftRight size={15}/> Direction: {tokenIn} → {tokenOut}</button></div>
      <div className="growth-two"><label>Research input ({tokenIn})<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
       <label>Maximum budget ({tokenIn})<input inputMode="decimal" value={budget} onChange={e=>setBudget(e.target.value)}/></label></div>
      <label>Slippage policy<select value={slippage} onChange={e=>setSlippage(e.target.value)}>
       <option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1">1%</option><option value="3">3%</option><option value="5">5%</option></select></label>
      {calculation?.ok===false&&<div className="growth-error">{calculation.error}</div>}
      {calculation?.ok===true&&<><div className="growth-quote"><small>Estimated output (indexed reserves)</small>
        <strong>{formatUnits(calculation.quote.amountOut,precisionOut)} {tokenOut}</strong>
        <div><span>Minimum with chosen slippage</span><b>{formatUnits(calculation.quote.minimumOut,precisionOut)} {tokenOut}</b></div>
        <div><span>Price impact incl. swap fee</span><b>{(calculation.quote.priceImpactBps/100).toFixed(2)}%</b></div>
        <div><span>Fee assumption</span><b>{calculation.quote.feeBps} basis points</b></div>
       </div>
       <h3>Slippage sensitivity from current reserves</h3>
       <div className="growth-scenarios">{calculation.scenarios.map(x=><div key={x.scale}><span>{x.scale}× input</span><strong>{x.output}</strong><span>{x.impact===null?"—":(x.impact/100).toFixed(2)+"% impact"}</span></div>)}</div>
       {calculation.warning&&<p className="growth-warning"><ShieldAlert size={17}/> More than 5% estimated impact. Current execution could be significantly worse.</p>}
       <label className="growth-checkbox"><input checked={confirmRisk} onChange={e=>setConfirmRisk(e.target.checked)} type="checkbox"/>
        I understand the displayed quote uses old indexed reserves and may differ when a transaction actually executes.</label>
       {confirmRisk?<Link className="growth-primary" href={"/trade?pair="+encodeURIComponent(pair)}>Open normal wallet-signed spot quote <ArrowRight size={16}/></Link>:
        <button className="growth-primary" disabled><LockKeyhole size={16}/> Acknowledge quote risk to continue</button>}
      </>}
     </>}
    <p className="growth-note">These are research estimates, not executable orders, fill guarantees, USD market values, liquidation controls or MEV protection. The existing Spot terminal will independently requote and simulate before any signature.</p>
   </section>
   <section className="growth-panel growth-form"><h2><LockKeyhole size={19}/> Safety & automation gates</h2>
    <p>All automated or delegated trading remains disabled; the lab requires a deliberate wallet action for every trade elsewhere.</p>
    <div className="growth-safety-matrix">
     <div><strong>Wallet-held signing</strong><span>Spot only, separate simulation</span></div>
     <div><strong>Unrestricted approvals</strong><span>Disabled</span></div>
     <div><strong>Copy-trading execution</strong><span>Research only</span></div>
     <div><strong>Background trading bots</strong><span>Disabled</span></div>
     <div><strong>Custodial/agent wallets</strong><span>Disabled</span></div>
     <div><strong>Live funds / leverage</strong><span>Disabled</span></div>
    </div>
    <div className="growth-warning"><ShieldAlert size={20}/> Price impact is derived from the token reserve ratio and swap-fee assumption. There are no current MEV, security audit, sellability or anti-rug guarantees.</div>
    <p className="growth-note">To consider copy trading, delegated spending or scheduled automation, Phase 4 would additionally need explicit user policies, independently reviewed smart accounts, noncustodial revocation, execution receipts and a separate risk assessment.</p>
   </section>
  </div>
 </div>;
}
