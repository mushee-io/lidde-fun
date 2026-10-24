"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Plus, RefreshCcw, ShieldAlert, Trophy } from "lucide-react";
import { parseApi, type PublicQuest } from "@/lib/quests/browser";
type Directory={status:string;reason?:string;campaigns:PublicQuest[]};
export function QuestDirectory(){
 const [quests,setQuests]=useState<PublicQuest[]>([]),[error,setError]=useState("Checking funded on-chain quests…");
 const [busy,setBusy]=useState(false),[filter,setFilter]=useState<"all"|"active"|"scheduled">("all");
 async function refresh(){
  setBusy(true);try{
   const data=await parseApi<Directory>("/api/quests");
   setQuests(data.campaigns);setError("");
  }catch(e){setQuests([]);setError(e instanceof Error?e.message:"Quest registry is not configured.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const filtered=quests.filter(q=>filter==="all"||q.state===filter);
 return <div className="quest-live-space">
  <div className="quest-live-header"><div><span className="quest-kicker"><Trophy size={17}/> ON-CHAIN QUESTS · VALueless SANDBOX</span>
   <h1>Discover. Complete. Claim.</h1><p>Campaigns are checked against the escrow contract each time they're listed. No fabricated rewards or claim counts.</p></div>
   <Link href="/quests/create" className="quest-live-main-action"><Plus size={18}/> Create quest</Link></div>
  <div className="quest-live-panel"><div className="quest-live-filters"><div>
   {(["all","active","scheduled"] as const).map(f=><button key={f} className={filter===f?"chosen":""} onClick={()=>setFilter(f)}>{f==="all"?"All verified":f==="active"?"Active":"Scheduled"}</button>)}</div>
   <button onClick={()=>void refresh()} disabled={busy}><RefreshCcw size={15}/>{busy?"Checking…":"Refresh"}</button></div>
   {error&&<div className="quest-live-alert" role="status"><ShieldAlert size={22}/><div><strong>Reward infrastructure is not live yet</strong><p>{error}</p><p>Quests only become publicly funded after their separate blockchain deployment and actual escrow funding.</p></div></div>}
   {!error&&<div className="quest-live-grid">{filtered.map(q=><article key={q.id} className="quest-live-card">
    <div className="quest-live-card-top"><span className={"quest-live-state "+q.state}>{q.state.replace("-"," ")}</span><Gift size={20}/></div>
    <h2>{q.title}</h2><p>{q.description}</p>
    <div className="quest-live-reward"><small>TEST TOKEN REWARD · RAW UNITS</small><strong>{q.rewardEachRaw}</strong><span>{q.token.slice(0,9)}…{q.token.slice(-5)}</span></div>
    <div className="quest-live-steps"><span>{q.tasks.length} on-chain task{q.tasks.length!==1?"s":""}</span><span>{q.claims} / {q.maxClaims} claimed</span></div>
    <Link href={"/quests/"+q.id}>View verified quest <ArrowRight size={16}/></Link></article>)}</div>}
   {!error&&filtered.length===0&&<div className="quest-live-empty"><Gift size={27}/><h2>No verified quests in this category</h2><p>Quests appear after deployment, real funding and campaign registration. You can prepare a signed draft now.</p><Link href="/quests/create">Create a draft <ArrowRight size={15}/></Link></div>}
  </div>
  <div className="quest-live-footer"><ShieldAlert size={16}/> Campaign rewards, even on a test chain, are subject to proof rules and the escrow budget. Signing an eligibility message never authorizes a token transfer.</div>
 </div>;
}
