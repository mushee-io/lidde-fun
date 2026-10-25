"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowUpRight, CandlestickChart, ChevronDown, Info, LockKeyhole, Maximize2, Settings2, Star} from "lucide-react";
import {asFixed8,evaluateRisk,formatFixed8,SCALE} from "@/lib/perps/risk";
type Side="long"|"short";
const periods=["1m","5m","15m","1H","4H","1D"] as const;
export function PerpTerminal({market="BTC"}:{market?:string}){
 const [side,setSide]=useState<Side>("long"),[period,setPeriod]=useState<typeof periods[number]>("5m");
 const [leverage,setLeverage]=useState(5),[amount,setAmount]=useState("0");
 const [reference,setReference]=useState(""),[isOpen,setIsOpen]=useState(false),[tp,setTp]=useState(""),[sl,setSl]=useState("");
 const [style,setStyle]=useState<"candles"|"line">("candles"),[watch,setWatch]=useState(false),[help,setHelp]=useState(false);
 const risk=useMemo(()=>{
  try{
   if(!reference||Number(reference)<=0||!amount||Number(amount)<=0)return null;
   const now=BigInt(Math.floor(Date.now()/1000));
   return evaluateRisk({direction:side,collateral:asFixed8(amount),leverage:BigInt(leverage),
    entryPrice:asFixed8(reference),markPrice:asFixed8(reference),
    maintenanceBps:500n,openFeeBps:10n,oracleTimestamp:now,now});
  }catch{return null;}
 },[amount,reference,leverage,side]);
 return <div className="lf-perp-columns">
  <section className="lf-perp-market">
   <div className="lf-market-heading">
    <div className="lf-market-identity"><span className="lf-market-emblem">{market.toUpperCase().slice(0,1)}</span>
     <div><h1>{market.toUpperCase()} <span className="lf-chip">RESEARCH · MAX 10x</span></h1><p>Lidde Fun Perpetual Research · no deployed market</p></div></div>
    <div className="lf-icon-actions"><button title="Save in this browser" onClick={()=>setWatch(!watch)} aria-pressed={watch}><Star size={18} fill={watch?"#576bf6":"none"}/></button><Link href="/perps" title="Open full risk laboratory"><ArrowUpRight size={18}/></Link></div>
   </div>
   <div className="lf-market-price"><div><strong>—</strong><p>No verified oracle or live mark price</p></div><div><small>Open interest</small><strong>—</strong><small>Unavailable</small></div></div>
   <div className="lf-chart-panel">
    <div className="lf-chart-toolbar"><div className="lf-timeframe">{periods.map(p=><button key={p} className={period===p?"on":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
     <div className="lf-icon-actions"><button onClick={()=>setStyle(style==="candles"?"line":"candles")} title="Switch chart presentation"><CandlestickChart size={16}/></button><button onClick={()=>setHelp(!help)} title="Chart settings"><Settings2 size={16}/></button><button onClick={()=>document.getElementById("lf-chart")?.requestFullscreen?.()} title="Fullscreen chart"><Maximize2 size={16}/></button></div></div>
    {help&&<p className="lf-chart-hint">Showing {style} layout at {period}. Candles only appear after genuine market OHLCV and price-oracle integration.</p>}
    <div id="lf-chart" className="lf-empty-chart" role="img" aria-label="Empty professional trading chart grid. No confirmed perpetual market price observations.">
     <div className="lf-chart-grid-lines"/>
     <div className="lf-chart-no-data"><CandlestickChart size={30}/><strong>Awaiting verified market data</strong><span>No OHLCV candles, funding rates, oracle quotes or open positions are available for this instrument.</span><Link href="/perps">Explore risk calculations <ArrowUpRight size={14}/></Link></div>
     <div className="lf-chart-axis"><span>—</span><span>—</span><span>—</span><span>—</span><span>—</span></div>
    </div>
   </div>
   <div className="lf-market-metrics">{[["Funding / hour","—"],["24h volume","—"],["Oracle price","—"],["Mark price","—"]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v}</strong></div>)}</div>
   <div className="lf-market-extra"><h3>Positions & orders</h3><p>There are no deployed perpetual contracts, funding settlements or verified account positions. This screen is a non-executable research interface.</p></div>
  </section>
  <aside className="lf-order">
   <div className="lf-buy-sell"><button className={side==="long"?"buy":""} onClick={()=>setSide("long")}>Buy / Long</button><button className={side==="short"?"sell":""} onClick={()=>setSide("short")}>Sell / Short</button></div>
   <p className="lf-order-explain">{side==="long"?"Buy opens a long: the hypothetical position gains as its reference price rises.":"Sell opens a short: the hypothetical position gains as its reference price falls."}</p>
   <div className="lf-form-caption"><label htmlFor="lf-collateral">Hypothetical collateral</label><span>Available —</span></div>
   <div className="lf-big-input"><input id="lf-collateral" aria-label="Hypothetical collateral amount" type="number" min="0" step="0.1" value={amount} onChange={e=>setAmount(e.target.value)}/><span>test units</span></div>
   <div className="lf-size-buttons">{[10,25,50,100].map(n=><button onClick={()=>setAmount(String(n))} key={n}>{n}</button>)}<button onClick={()=>setAmount("0")} title="Live balance unavailable">Clear</button></div>
   <div className="lf-form-caption"><span>Leverage <small>Isolated · research</small></span><strong>{leverage}x</strong></div>
   <input aria-label="Hypothetical leverage" type="range" min="1" max="10" step="1" value={leverage} onChange={e=>setLeverage(Number(e.target.value))}/>
   <div className="lf-leverage-scale"><span>1x</span><span>3x</span><span>5x</span><span>8x</span><span>10x</span></div>
   <label className="lf-reference-label">Hypothetical entry reference <span>(not a price feed)</span><input type="number" inputMode="decimal" placeholder="Enter an illustrative price" min="0" value={reference} onChange={e=>setReference(e.target.value)}/></label>
   <div className="lf-form-caption"><span>Liq estimate</span><strong>—</strong></div>
   <p className="lf-muted-help">Real liquidation thresholds require a validated oracle, fees and a deployed margin engine.</p>
   <button className="lf-expand" aria-expanded={isOpen} onClick={()=>setIsOpen(!isOpen)}>TP / SL <ChevronDown size={14}/></button>
   {isOpen&&<div className="lf-conditional"><label>Take profit reference<input value={tp} onChange={e=>setTp(e.target.value)} inputMode="decimal" placeholder="Optional hypothetical target"/></label><label>Stop loss reference<input value={sl} onChange={e=>setSl(e.target.value)} inputMode="decimal" placeholder="Optional hypothetical limit"/></label><p>Research inputs only. No TP/SL orders are scheduled or placed.</p></div>}
   <div className="lf-risk-facts"><div><span>Position notional</span><strong>{risk?formatFixed8(risk.notional):"—"}</strong></div><div><span>Opening fee (assumed 0.1%)</span><strong>{risk?formatFixed8(risk.estimatedOpenFee):"—"}</strong></div><div><span>Maintenance (assumed 5%)</span><strong>{risk?formatFixed8(risk.requiredMaintenance):"—"}</strong></div><div><span>Funding estimate</span><strong>—</strong></div></div>
   <button className="lf-order-disabled" disabled><LockKeyhole size={17}/> Trading not deployed</button>
   <div className="lf-order-caveat"><Info size={15}/><span>Orders are disabled until audited settlement, custody, risk, funding and liquidation contracts are operational. Nothing here is a live BTC quote.</span></div>
  </aside>
 </div>;
}
