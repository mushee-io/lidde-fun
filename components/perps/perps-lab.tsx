"use client";
import {useMemo,useState} from "react";
import {asFixed8,formatFixed8,scenarioRisk,evaluateRisk,SCALE, type Direction} from "@/lib/perps/risk";
import {AlertTriangle,FlaskConical,LockKeyhole,ShieldCheck} from "lucide-react";
export function PerpsLab(){
 const [collateral,setCollateral]=useState("100"),[price,setPrice]=useState("100");
 const [leverage,setLeverage]=useState("3"),[direction,setDirection]=useState<Direction>("long");
 const [reference,setReference]=useState("100");
 const preview=useMemo(()=>{
  try{
   const now=BigInt(Math.floor(Date.now()/1000));
   const input={collateral:asFixed8(collateral),entryPrice:asFixed8(price),markPrice:asFixed8(reference),
    leverage:BigInt(leverage),direction,maintenanceBps:500n,openFeeBps:10n,
    oracleTimestamp:now,now};
   return {ok:true as const,current:evaluateRisk(input),scenarios:scenarioRisk(input),inputs:input};
  }catch(e){return {ok:false as const,message:e instanceof Error?e.message:"Invalid simulation"};}
 },[collateral,price,leverage,direction,reference]);
 return <section className="phase2-panel phase2-form">
  <h2><FlaskConical size={20}/> Perpetuals risk simulator — offline only</h2>
  <p>Explore liquidation risk using hypothetical prices. This module does not read a real oracle, create positions, sign orders, pay funding or perform liquidations.</p>
  <div className="phase2-warning"><AlertTriangle size={20}/> Isolated research sandbox: these values have no market price, no real collateral and no settlement value. All leverage transactions remain disabled.</div>
  <div className="phase2-fields">
   <label>Position side<select value={direction} onChange={e=>setDirection(e.target.value as Direction)}><option value="long">Long</option><option value="short">Short</option></select></label>
   <label>Research leverage<select value={leverage} onChange={e=>setLeverage(e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(x=><option value={x} key={x}>{x}×</option>)}</select></label>
   <label>Hypothetical collateral (units)<input value={collateral} inputMode="decimal" onChange={e=>setCollateral(e.target.value)}/></label>
   <label>Entry reference (units)<input value={price} inputMode="decimal" onChange={e=>setPrice(e.target.value)}/></label>
   <label>Hypothetical mark (units)<input value={reference} inputMode="decimal" onChange={e=>setReference(e.target.value)}/></label>
  </div>
  {preview.ok?<><div className="phase2-stats"><div><small>Position notional (units)</small><strong>{formatFixed8(preview.current.notional)}</strong></div>
    <div><small>Hypothetical P/L (units)</small><strong>{formatFixed8(preview.current.unrealizedPnl)}</strong></div>
    <div><small>Equity after opening fee</small><strong>{formatFixed8(preview.current.equity)}</strong></div>
    <div><small>Maintenance requirement</small><strong>{formatFixed8(preview.current.requiredMaintenance)}</strong></div></div>
    {preview.current.liquidatable&&<p className="phase2-error"><AlertTriangle size={18}/> Simulated collateral would be liquidatable.</p>}
    <div className="phase2-table-scroll"><table className="phase2-table"><thead><tr><th>Hypothetical move</th><th>Mark price</th><th>Equity</th><th>Liquidatable</th></tr></thead>
      <tbody>{preview.scenarios.map(s=><tr key={s.changeBps.toString()}><td>{Number(s.changeBps)/100}%</td><td>{formatFixed8(s.markPrice)}</td>
       <td>{formatFixed8(s.equity)}</td><td>{s.liquidatable?"Yes":"No"}</td></tr>)}</tbody></table></div></>:<p className="phase2-error">{preview.message}</p>}
  <div className="phase2-warning"><LockKeyhole size={18}/> Position creation, funding, margin transfers, oracle routing, liquidations and signing are not implemented. Production requires a separate audited risk engine and independent oracles.</div>
  <p className="phase2-muted"><ShieldCheck size={15}/> Risk math uses fixed-point integers; the mark timestamp is only an assumed instant for a scenario, not an external observation.</p>
 </section>;
}
