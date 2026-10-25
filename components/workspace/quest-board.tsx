"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowRight, Clock3, Gift, Plus, ShieldCheck, Sparkles, Trophy, Zap} from "lucide-react";
import type {PublicQuest} from "@/lib/quests/browser";
type Props={quests:PublicQuest[];error:string;loading:boolean;selected:string;onSelect:(id:string)=>void};
const slim=(x:string)=>x.slice(0,6)+"…"+x.slice(-4);
export function QuestBoard({quests,error,loading,selected,onSelect}:Props){
 const selectedQuest=quests.find(q=>q.id===selected)??quests[0];
 const others=quests.filter(q=>q.id!==selectedQuest?.id).slice(0,9);
 const count=quests.filter(q=>q.state==="active"&&q.funded).length;
 const [showDetails,setShowDetails]=useState(false);
 const percent=selectedQuest?.maxClaims?Math.min(100,selectedQuest.claims/selectedQuest.maxClaims*100):0;
 return <div className="lf-quest-board">
  <div className="lf-page-heading"><div><h1><Trophy size={27}/> Quests</h1><p>Complete tasks, claim on-chain rewards and grow with the Lidde Fun community. <span>{count} live now</span></p></div>
   <Link className="lf-primary-action" href="/quests/create"><Plus size={19}/> Create quest</Link></div>
  {selectedQuest?<article className="lf-featured">
   <div className="lf-feature-banner">
    <div className="lf-overlap-avatars"><span className="lf-quest-avatar"><Gift size={27}/></span><span className="lf-secondary-avatar">{selectedQuest.tasks.length}</span></div>
    <div className="lf-feature-content"><div className="lf-badges"><span className={selectedQuest.state==="active"?"lf-status live":"lf-status"}>{selectedQuest.state.toUpperCase()}</span><span className="lf-status"><Clock3 size={12}/>{selectedQuest.state==="active"?"On-chain funded":"Verified campaign"}</span></div>
     <h2>{selectedQuest.title}</h2><p>{selectedQuest.description}</p></div>
   </div>
   <div className="lf-feature-bottom"><div><div className="lf-label">REWARD EACH · RAW TEST TOKEN UNITS</div><div className="lf-feature-reward"><span className="lf-small-emblem"><Gift size={20}/></span><strong>{selectedQuest.rewardEachRaw}</strong><span title={selectedQuest.token}>{slim(selectedQuest.token)}</span></div>
    <div className="lf-chips">{selectedQuest.tasks.map((t,i)=><span key={i}>{t.kind==="lp"?"Provide LP":t.kind==="swap"?"Trade":"Hold"}</span>)}</div></div>
    <div className="lf-feature-progress"><div><strong>{selectedQuest.claims} / {selectedQuest.maxClaims}</strong> claimed <span>{Math.max(0,selectedQuest.maxClaims-selectedQuest.claims)} left</span></div><div className="lf-progress"><i style={{width:percent+"%"}}/></div>
     <Link href={"/quests/"+selectedQuest.id} className="lf-claim-action">{selectedQuest.state==="active"?"Start quest":"View quest"} <ArrowRight size={17}/></Link></div></div>
  </article>:<section className="lf-empty-feature"><Gift size={28}/><h2>{loading?"Verifying funded campaigns…":"No verified on-chain quests"}</h2>
   <p>{error||"Campaigns appear after registration with QuestEscrow and verified reward funding. No placeholder rewards or claim counts are displayed."}</p>
   <Link href="/quests/create">Prepare a signed quest draft <ArrowRight size={15}/></Link></section>}
  <div className="lf-more-title"><span><Zap size={16}/> MORE QUESTS</span><Link href="/quests">All verified quests <ArrowRight size={14}/></Link></div>
  {others.length?<div className="lf-quest-mini-grid">{others.map(q=><button className="lf-quest-mini" key={q.id} onClick={()=>{onSelect(q.id);setShowDetails(false);}}>
   <div className="lf-mini-top"><span className="lf-mini-avatar"><Gift size={22}/></span><div><small><span className="lf-status">{q.state.toUpperCase()}</span> By {slim(q.vault)}</small><strong>{q.title}</strong></div><div className="lf-mini-reward"><small>REWARD</small><strong>{q.rewardEachRaw}</strong><small>{slim(q.token)}</small></div></div>
   <div className="lf-mini-bottom"><span className="lf-chips">{q.tasks.slice(0,2).map((t,i)=><span key={i}>{t.kind}</span>)}</span><span>{q.claims}/{q.maxClaims}</span></div>
   <div className="lf-progress"><i style={{width:q.maxClaims?Math.min(100,q.claims/q.maxClaims*100)+"%":"0%"}}/></div>
  </button>)}</div>:<div className="lf-no-more">No additional verified campaigns. Community-created quests will appear here when confirmed.</div>}
  <div className="lf-integrity-foot"><ShieldCheck size={16}/> Every campaign, reward amount and claim count on this page is sourced from the verified escrow contract. Creation, verification and claims remain in the existing on-chain quest flow.</div>
 </div>;
}
