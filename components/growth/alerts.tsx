"use client";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Activity, Bell, Download, Trash2, ShieldAlert, Wallet, RefreshCcw, PlusCircle } from "lucide-react";
import { discovery, type DiscoveryResponse } from "@/lib/phase2/browser-data";
import { connectedAddress, parseApi, signedQuestChallenge } from "@/lib/quests/browser";
import { formatFixedSix } from "@/lib/growth/simulation";
type Rule={id:string;type:"price_above"|"price_below"|"new_pair";chainId:number;pair:string;thresholdSix:string|null;enabled:boolean;createdAtBlock:string;lastFiredAt:string|null};
type Alert={id:string;ruleId:string;pair:string;block:string;blockHash:string;ratioSix:string|null;createdAt:string};
type Result={status:string;rules:Rule[];events:Alert[];note:string};
const short=(x:string)=>x.slice(0,8)+"…"+x.slice(-5);
export function Alerts(){
 const [wallet,setWallet]=useState<Address|null>(null),[data,setData]=useState<Result|null>(null);
 const [markets,setMarkets]=useState<DiscoveryResponse|null>(null),[marketReason,setMarketReason]=useState("");
 const [type,setType]=useState<Rule["type"]>("price_above"),[pair,setPair]=useState(""),[threshold,setThreshold]=useState("1");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{void discovery().then(d=>{setMarkets(d);setPair(d.pools[0]?.pair??"");}).catch(e=>setMarketReason(e instanceof Error?e.message:"Verified markets unavailable."));},[]);
 async function act(op:"list"|"add"|"toggle"|"delete"|"check"|"erase",values:Record<string,unknown>={}){
  setBusy(true);setError("");setNotice("");
  try {
   const connected=await connectedAddress();setWallet(connected);
   const auth=await signedQuestChallenge(connected,"growth-watch");
   const output=await parseApi<Result|{status:"checked";detected:{ruleId:string;state:string;pair:string}[];indexedBlock:string;note:string}|{status:"erased"}>("/api/growth/watch",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({op,wallet:connected,...values,...auth})
   });
   if(output.status==="checked"){
    const x=output as Extract<typeof output,{status:"checked"}>;
    setNotice("Checked canonical indexed block "+x.indexedBlock+". New matching events: "+x.detected.length+". No background delivery is enabled.");
   }else if(output.status==="erased")setNotice("Watch rules and stored alert events erased.");
   else {setData(output as Result);if(op==="add")setNotice("New watch rule saved.");}
   if(!["list","add"].includes(op))void refreshList(connected);
  }catch(e){setError(e instanceof Error?e.message:"Watch request failed.");}
  finally{setBusy(false);}
 }
 async function refreshList(current:Address){
  try{
   const auth=await signedQuestChallenge(current,"growth-watch");
   const output=await parseApi<Result>("/api/growth/watch",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({op:"list",wallet:current,...auth})});
   setData(output);
  }catch(e){setError(e instanceof Error?e.message:"Unable to refresh private watchlist.");}
 }
 function exportJson(){
  if(!data)return;
  const document=JSON.stringify({exportedAt:new Date().toISOString(),wallet,rules:data.rules,events:data.events,
   disclaimer:"Stored on-demand observations; not verified external delivery receipts."},null,2);
  const objectURL=URL.createObjectURL(new Blob([document],{type:"application/json"}));
  const anchor=documentRef();
  anchor.href=objectURL;anchor.download="lidde-fun-watchlist.json";anchor.click();
  URL.revokeObjectURL(objectURL);
 }
 function documentRef(){return globalThis.document.createElement("a");}
 return <div className="growth-workspace">
  <div className="growth-heading"><span><Bell size={16}/> M16 · ON-CHAIN SIGNALS</span><h1>Watch your markets.</h1>
   <p>Private wallet-owned rules for verified testnet pairs. Evaluate signals manually against the canonical indexer; no invented email, Telegram or real-time push notifications.</p></div>
  <div className="growth-grid">
   <div className="growth-side">
    <section className="growth-panel growth-form"><h2><PlusCircle size={18}/> New watch rule</h2>
     <p>Price signals use token 1 per token 0, not USD. Only indexed canonical pairs are selectable.</p>
     {marketReason&&<p className="growth-warning"><ShieldAlert size={14}/>{marketReason}</p>}
     <label>Event condition<select value={type} onChange={e=>setType(e.target.value as Rule["type"])}>
      <option value="price_above">Reserve price above</option><option value="price_below">Reserve price below</option><option value="new_pair">New pair indexed in Factory</option></select></label>
     {type!=="new_pair"&&<><label>Verified pool<select value={pair} onChange={e=>setPair(e.target.value)}>
      {markets?.pools.map(p=><option value={p.pair} key={p.pair}>{p.token0Symbol}/{p.token1Symbol} · {short(p.pair)}</option>)}</select></label>
      <label>Ratio threshold (token 1 per token 0)<input value={threshold} inputMode="decimal" onChange={e=>setThreshold(e.target.value)} placeholder="e.g. 1.25"/></label></>}
     <button className="growth-primary" disabled={busy||!markets||(!pair&&type!=="new_pair")}
       onClick={()=>void act("add",{rule:{type,pair:type==="new_pair"?undefined:pair,threshold:type==="new_pair"?undefined:threshold}})}>
      <PlusCircle size={15}/> Save wallet-owned rule</button>
    </section>
    <section className="growth-panel growth-form"><h2><Wallet size={18}/> My watch settings</h2>
     <p>Each change requires a one-time wallet message, not token approval. Rules belong only to the signing wallet.</p>
     <button className="growth-primary" disabled={busy} onClick={()=>void act("list")}><Wallet size={15}/>{wallet?short(wallet):"Connect & load private rules"}</button>
     <div className="growth-actions"><button disabled={busy||!data} onClick={exportJson}><Download size={14}/> Export JSON</button>
      <button disabled={busy||!data} onClick={()=>{if(globalThis.confirm("Erase all saved watch rules and alert records for this wallet?"))void act("erase");}}><Trash2 size={14}/> Erase all</button></div>
     <p className="growth-note">No personal seed phrase, private key or tracking cookie is needed. Manual evaluation only; third-party delivery requires explicit separately verified consent.</p>
    </section>
   </div>
   <section className="growth-panel"><div className="growth-section-top"><h2><Activity size={18}/> Saved signals & observed events</h2>
    <button disabled={busy||!data} onClick={()=>void act("check")}><RefreshCcw size={15}/> Evaluate verified block</button></div>
    {data?.rules.map(r=><article className="growth-watch-rule" key={r.id}>
      <div><strong>{r.type.replaceAll("_"," ").toUpperCase()}</strong><p>{r.type==="new_pair"?"Factory new-pair feed":short(r.pair)}{r.thresholdSix!==null?" · threshold "+formatFixedSix(BigInt(r.thresholdSix)):""}</p>
       <small>Chain {r.chainId} · started at block {r.createdAtBlock}</small></div>
      <div className="growth-actions"><button disabled={busy} onClick={()=>void act("toggle",{ruleId:r.id,enabled:!r.enabled})}>{r.enabled?"Disable":"Enable"}</button>
       <button aria-label="Delete watch rule" disabled={busy} onClick={()=>void act("delete",{ruleId:r.id})}><Trash2 size={15}/></button></div>
     </article>)}
    {!data&&<div className="growth-empty"><ShieldAlert size={22}/> Connect and sign to see your private market rules.</div>}
    {data&&!data.rules.length&&<div className="growth-empty">No saved watch rules yet.</div>}
    <h3>Stored alert observations</h3><p className="growth-note">Each record refers to an indexed block and pool, but alert history is not a substitute for ongoing independent chain finality monitoring.</p>
    <div className="growth-observed">{data?.events.map(ev=><div key={ev.id}><span>{short(ev.pair)} · block {ev.block}</span><small>{String(ev.createdAt)}</small></div>)}
      {data&&!data.events.length&&<p className="growth-note">Nothing has triggered. No observations were fabricated.</p>}</div>
   </section>
  </div>
  {notice&&<div className="growth-success" role="status">{notice}</div>}
  {error&&<div className="growth-error" role="alert">{error}</div>}
 </div>;
}
