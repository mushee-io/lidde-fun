"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, Trophy, Wallet, RefreshCcw, ExternalLink } from "lucide-react";
import { connectedAddress, parseApi, signedQuestChallenge } from "@/lib/quests/browser";
import type { Address } from "viem";
type Score={rank:number;wallet:string;nickname:string|null;xp:number;claims:number};
type Board={status:string;algorithm:string;period:string;indexedBlock:string;rankings:Score[];disclosure:string};
type Profile={nickname:string|null;public:boolean;referralCode:string};
type Account={status:string;wallet:Address;profile:Profile|null};
type History={status:string;indexedBlock:string;totalXP:number;events:{campaignId:string;transactionHash:string;block:string;at:string;xp:number;source:string}[]};
const addr=(x:string)=>x.slice(0,7)+"…"+x.slice(-5);
export function Leaderboard(){
 const [period,setPeriod]=useState<"week"|"month"|"season"|"all">("week");
 const [history,setHistory]=useState<History|null>(null);
 const [board,setBoard]=useState<Board|null>(null),[reason,setReason]=useState("Verifying indexed sandbox rankings…");
 const [busy,setBusy]=useState(false),[wallet,setWallet]=useState<Address|null>(null);
 const [profile,setProfile]=useState<Profile|null>(null);
 const [nickname,setNickname]=useState(""),[publicOptin,setPublicOptin]=useState(false);
 const [campaign,setCampaign]=useState(""),[claimHash,setClaimHash]=useState("");
 const [info,setInfo]=useState(""),[error,setError]=useState("");
 async function load(w:typeof period){
  setBusy(true);setReason("");setError("");
  try{setBoard(await parseApi<Board>("/api/growth/leaderboard?window="+w));}
  catch(e){setBoard(null);setReason(e instanceof Error?e.message:"No verified XP rankings are available.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load(period);},[period]);
 async function account(op:"read"|"save"|"delete"){
  setBusy(true);setInfo("");setError("");
  try{
   const current=await connectedAddress();setWallet(current);
   const auth=await signedQuestChallenge(current,"growth-account");
   const x=await parseApi<Account|{status:"deleted";note:string}>("/api/growth/account",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({op,wallet:current,nickname,public:publicOptin,...auth})});
   if(x.status==="deleted"){setProfile(null);setNickname("");setPublicOptin(false);setInfo("Off-chain profile and XP records deleted. Blockchain claims remain public.");}
   else{const p=(x as Account).profile;setProfile(p);setNickname(p?.nickname??"");setPublicOptin(p?.public??false);setInfo(op==="save"?"Profile preferences saved.":"Wallet profile loaded.");}
   void load(period);
  }catch(e){setError(e instanceof Error?e.message:"Wallet profile operation failed.");}
  finally{setBusy(false);}
 }
 async function historyRead(){
  setBusy(true);setError("");setInfo("");setHistory(null);
  try{
   const connected=await connectedAddress();setWallet(connected);
   const auth=await signedQuestChallenge(connected,"growth-account");
   const evidence=await parseApi<History>("/api/growth/history",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({wallet:connected,...auth})
   });
   setHistory(evidence);
  }catch(e){setError(e instanceof Error?e.message:"Verified score history is unavailable.");}
  finally{setBusy(false);}
 }
 async function submitXP(){
  setBusy(true);setInfo("");setError("");
  try{
   const current=await connectedAddress();setWallet(current);
   const auth=await signedQuestChallenge(current,"growth-claim");
   const saved=await parseApi<{status:string;xp:number;block:string;txHash:string}>("/api/growth/claim",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({wallet:current,id:campaign,transactionHash:claimHash,...auth})});
   setInfo(saved.status==="credited"?"Verified escrow claim credited with "+saved.xp+" off-chain XP at block "+saved.block:
    "This confirmed quest claim was already credited. No XP was issued again.");
   void load(period);
  }catch(e){setError(e instanceof Error?e.message:"Claim proof not accepted.");}
  finally{setBusy(false);}
 }
 return <div className="growth-workspace">
  <div className="growth-heading"><span><Trophy size={16}/> M14 · VERIFIED REPUTATION</span>
   <h1>Quest XP leaderboard.</h1><p>Earn 100 off-chain XP for each unique, independently confirmed QuestEscrow claim. This is not transferable, tradeable, a token or a promised airdrop.</p></div>
  <div className="growth-grid">
   <section className="growth-panel"><div className="growth-section-top"><h2><Trophy size={18}/> Transparent ranking</h2>
    <button onClick={()=>void load(period)} disabled={busy}><RefreshCcw size={15}/> Refresh</button></div>
    <div className="growth-tabs">
     {(["week","month","season","all"] as const).map(x=><button key={x} className={x===period?"active":""} onClick={()=>setPeriod(x)}>{x==="all"?"All time":x}</button>)}</div>
    {reason&&<div className="growth-unavailable"><ShieldAlert size={20}/><div><strong>Rankings unavailable</strong><p>{reason}</p></div></div>}
    {board&&<><div className="growth-meta"><span>Period: {board.period}</span><span>Confirmed indexed block: {board.indexedBlock}</span><span>Algorithm: {board.algorithm}</span></div>
     <div className="growth-score-table"><div className="growth-score-head"><span>Rank / identity</span><span>Verified claims</span><span>XP</span></div>
      {board.rankings.map(x=><div className="growth-score-row" key={x.wallet}><span><b>#{x.rank}</b> {x.nickname??addr(x.wallet)} <small>{x.nickname?addr(x.wallet):"Pseudonymous"}</small></span><span>{x.claims}</span><strong>{x.xp}</strong></div>)}
      {!board.rankings.length&&<div className="growth-empty">No opted-in wallets have canonical XP evidence for this period.</div>}</div>
     <p className="growth-note">{board.disclosure}</p></>}
   </section>
   <div className="growth-side">
    <section className="growth-panel growth-form"><h2><Wallet size={18}/> Your opt-in profile</h2>
     <p>Public ranking is off by default. You control your nickname and may delete your off-chain profile data.</p>
     <button className="growth-primary" onClick={()=>void account("read")} disabled={busy}><Wallet size={15}/>{wallet?addr(wallet):"Connect & view profile"}</button>
     <button className="growth-primary" disabled={busy||!wallet} onClick={()=>void historyRead()}>View my verified XP evidence</button>
     <label>Public nickname<input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Optional nickname" maxLength={24}/></label>
     <label className="growth-checkbox"><input type="checkbox" checked={publicOptin} onChange={e=>setPublicOptin(e.target.checked)}/> Include my wallet on the public XP board</label>
     <div className="growth-actions"><button disabled={busy||!wallet} onClick={()=>void account("save")}>Save profile</button><button disabled={busy||!wallet} onClick={()=>{if(globalThis.confirm("Delete off-chain profile, XP, referrals and watch alerts? Blockchain transactions cannot be deleted."))void account("delete");}}>Delete my data</button></div>
     {history&&<div className="growth-evidence"><strong>Verified XP: {history.totalXP}</strong><small>At indexed block {history.indexedBlock}</small>{history.events.map((event,i)=><div key={event.transactionHash+":"+i}><span>{event.source} · +{event.xp} XP</span><small>Campaign {event.campaignId.slice(0,8)} · block {event.block}</small><code title={event.transactionHash}>{event.transactionHash.slice(0,12)}…</code></div>)}{!history.events.length&&<p className="growth-note">No verified claim XP yet.</p>}</div>}
     {profile&&<p className="growth-note">Referral code: {profile.referralCode} · <a href="/community">Community links <ExternalLink size={12}/></a></p>}
    </section>
    <section className="growth-panel growth-form"><h2><CheckCircle2 size={18}/> Import verified claim</h2>
     <p>XP is never awarded for swapping volume, inviting wallets or viewing a page. Submit the transaction hash of an actual completed test quest.</p>
     <label>Quest campaign UUID<input value={campaign} spellCheck={false} onChange={e=>setCampaign(e.target.value)} placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"/></label>
     <label>Confirmed escrow claim hash<input value={claimHash} spellCheck={false} onChange={e=>setClaimHash(e.target.value)} placeholder="0x…"/></label>
     <button className="growth-primary" disabled={busy||!campaign||!claimHash} onClick={()=>void submitXP()}>Verify transaction and credit XP</button>
    </section>
    {info&&<div className="growth-success" role="status">{info}</div>}
    {error&&<div className="growth-error" role="alert">{error}</div>}
   </div>
  </div>
 </div>;
}
