"use client";
import {useEffect,useState} from "react";
import {RefreshCw,ShieldAlert,ShieldCheck,ExternalLink} from "lucide-react";
type Report={generatedAt:string;gate:string;publicBeta:boolean;writeEnabled:boolean;
 checks:Record<string,{status:string;note:string}>;blockers:string[];disclaimer:string};
const names:Record<string,string>={
 build:"Application build",rpc:"Verified sandbox RPC",explorer:"Explorer",
 factory:"Factory deployment",router:"Router deployment",faucet:"Verified test faucet",
 indexer:"Canonical indexer",vault:"QuestEscrow",database:"Quest database",attestor:"Secure attestor",
 independentWalletProof:"External wallet receipts",securityReview:"Independent security review",vercel:"Vercel runtime"
};
export function BetaChecks(){
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function inspect(){
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/ops/status",{cache:"no-store"});
   if(!res.ok)throw Error("Runtime status unavailable.");
   setReport(await res.json() as Report);
  }catch(e){setError(e instanceof Error?e.message:"Unable to inspect runtime.");setReport(null);}
  finally{setBusy(false);}
 }
 useEffect(()=>{void inspect();},[]);
 return <section className="phase2-panel phase2-form">
  <div className="phase2-panel-head"><div><h2><ShieldCheck size={19}/> Public beta release gate</h2>
   <p>Each prerequisite must be independently verifiable. Build success alone is not a launch.</p></div>
   <button onClick={()=>void inspect()} disabled={busy}><RefreshCw size={15}/>{busy?"Checking…":"Recheck"}</button></div>
  {error&&<p className="phase2-error">{error}</p>}
  {report&&<><div className="phase2-stats"><div><small>Highest verified gate</small><strong>{report.gate}</strong></div>
    <div><small>Wallet writes</small><strong>{report.writeEnabled?"Enabled by operator":"Disabled"}</strong></div>
    <div><small>Public beta approved</small><strong>{report.publicBeta?"Yes":"No"}</strong></div>
    <div><small>Pending prerequisites</small><strong>{report.blockers.length}</strong></div></div>
   <div className="beta-check-grid">{Object.entries(report.checks).map(([id,value])=><div className="beta-check" key={id}>
    <span>{value.status==="verified"?<ShieldCheck color="#83d8a9" size={19}/>:<ShieldAlert color="#bfa0a4" size={19}/>}</span>
    <div><strong>{names[id]??id}</strong><p>{value.note}</p></div>
   </div>)}</div>
   <p className="phase2-muted">Checked {report.generatedAt}. {report.disclaimer}</p>
  </>}
  <div className="phase2-warning"><ShieldAlert size={20}/> No source code, account balance screenshot or local disposable-Anvil test should be presented as evidence of a persistent public chain.</div>
  <p className="phase2-muted">Read source: <a href="https://github.com/mushee-io/lidde-fun/blob/main/docs/PHASE-05.md" target="_blank" rel="noreferrer">Phase 5 release playbook <ExternalLink size={12}/></a></p>
 </section>;
}
