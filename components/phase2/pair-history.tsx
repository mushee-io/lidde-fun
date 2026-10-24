"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldAlert } from "lucide-react";
type Sample={block:string;time:string|null;price:string;transactionHash:string};
type Data={status:string;reason?:string;chainId?:number;indexedBlock?:string;rangeFromBlock?:string;methodology?:string;samples:Sample[]};
export function PairHistory({address}:{address:string}) {
  const [data,setData]=useState<Data|null>(null),[busy,setBusy]=useState(false);
  async function refresh(signal?:AbortSignal){
    setBusy(true);
    try{
      const res=await fetch("/api/pair-history?pair="+encodeURIComponent(address),{cache:"no-store",signal});
      const json=await res.json() as Data;if(!signal?.aborted)setData(json);
    }catch{if(!signal?.aborted)setData({status:"unavailable",reason:"History request could not be completed.",samples:[]});}
    finally{if(!signal?.aborted)setBusy(false);}
  }
  useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort();},[address]);
  const points=useMemo(()=>data?.samples.map(s=>({...s,n:Number(s.price)})).filter(s=>Number.isFinite(s.n))??[],[data]);
  const coords=useMemo(()=>{
    if(points.length<2)return "";
    const lowest=Math.min(...points.map(s=>s.n)),highest=Math.max(...points.map(s=>s.n));
    const span=highest-lowest||1;
    return points.map((s,i)=>{
      const x=20+i*660/(points.length-1);
      const y=205-(s.n-lowest)*175/span;
      return x.toFixed(2)+","+y.toFixed(2);
    }).join(" ");
  },[points]);
  return <section className="phase2-panel phase2-form">
    <div className="phase2-panel-head"><div><h2>On-chain reserve price history</h2><p>Actual observed testnet Sync events only — not artificial price candles.</p></div>
      <button onClick={()=>void refresh()} disabled={busy}><RefreshCcw size={15}/>{busy?"Loading…":"Refresh"}</button></div>
    {data?.status!=="indexed"?<div className="phase2-blocked"><ShieldAlert size={20}/><p>{data?.reason??"No verified price observations yet."}</p></div>:
      <><div className="phase2-stats"><div><small>Confirmed indexed block</small><strong>{data.indexedBlock}</strong></div>
        <div><small>Recent reserve snapshots</small><strong>{data.samples.length}</strong></div></div>
        {coords?<svg role="img" aria-label="Historical relative pool reserve price samples; not USD valuations" viewBox="0 0 700 230" className="phase2-sparkline">
          <line x1="20" y1="205" x2="680" y2="205" stroke="#40364f"/><line x1="20" y1="30" x2="680" y2="30" stroke="#40364f" strokeDasharray="4 6"/>
          <polyline points={coords} fill="none" stroke="#9389ff" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>:<p className="phase2-muted">No multi-point price history has been indexed within this bounded window.</p>}
        {points.length>0&&<div className="phase2-quote"><small>Last observed reserve ratio</small><strong>{points[points.length-1].price} token1 per token0</strong></div>}
        <p className="phase2-muted">{data.methodology}. This chart does not establish market cap, USD value, trading volume or a guaranteed executable price.</p></>}
  </section>;
}
