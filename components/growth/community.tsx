"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, ShieldAlert, Gift, Wallet, Users, ExternalLink } from "lucide-react";
import { connectedAddress, parseApi, signedQuestChallenge, type PublicQuest } from "@/lib/quests/browser";
import type { Address } from "viem";
type Summary={status:string;code:string|null;attributedTo:string|null;truncated:boolean;
 invitees:{wallet:string;acceptedAt:string;verifiedClaim:boolean}[]};
const short=(s:string)=>s.slice(0,7)+"…"+s.slice(-5);
export function Community(){
 const [wallet,setWallet]=useState<Address|null>(null),[summary,setSummary]=useState<Summary|null>(null);
 const [quests,setQuests]=useState<PublicQuest[]>([]);
 const [code,setCode]=useState(""),[consent,setConsent]=useState(false);
 const [url,setUrl]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[note,setNote]=useState("");
 useEffect(()=>{
   setUrl(window.location.origin);
   setCode(new URLSearchParams(window.location.search).get("ref")??"");
   void parseApi<{campaigns:PublicQuest[]}>("/api/quests").then(x=>setQuests(x.campaigns)).catch(()=>setQuests([]));
 },[]);
 const link=summary?.code&&url?url+"/community?ref="+encodeURIComponent(summary.code):"";
 async function fetchSummary(){
  setBusy(true);setError("");setNote("");
  try{
   const address=await connectedAddress();setWallet(address);
   const signed=await signedQuestChallenge(address,"growth-referral");
   const result=await parseApi<Summary>("/api/growth/referrals",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({op:"summary",wallet:address,...signed})});
   setSummary(result);setNote("Attributions checked from your wallet-private data.");
  }catch(e){setError(e instanceof Error?e.message:"Cannot read signed referral settings.");}
  finally{setBusy(false);}
 }
 async function join(){
  setBusy(true);setError("");setNote("");
  try{
   if(!consent)throw new Error("Explicitly acknowledge referral attribution before signing.");
   const address=await connectedAddress();setWallet(address);
   const signed=await signedQuestChallenge(address,"growth-referral");
   await parseApi<{status:string}>("/api/growth/referrals",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({op:"join",wallet:address,code,...signed})});
   setNote("Invite attribution saved. No XP or reward is issued for this action.");setConsent(false);
  }catch(e){setError(e instanceof Error?e.message:"Referral attribution failed.");}
  finally{setBusy(false);}
 }
 async function copy(value:string){
  setError("");
  try{await navigator.clipboard.writeText(value);setNote("Link copied to clipboard.");}
  catch{setError("Clipboard permission was denied. Select and copy the URL manually.");}
 }
 return <div className="growth-workspace">
  <div className="growth-heading"><span><Share2 size={16}/> M15 · COMMUNITY DISTRIBUTION</span><h1>Share verified quests.</h1>
   <p>Invite people into the valueless Lidde sandbox. Referral counts represent wallet events, not unique people, and there are no automatic referral payouts.</p></div>
  <div className="growth-grid">
   <div className="growth-side">
    <section className="growth-panel growth-form">
     <h2><Users size={18}/> Your referral link</h2>
     <p>Opt in to a public pseudonymous profile on the leaderboard to activate a share code. Signing only verifies account control.</p>
     <button className="growth-primary" onClick={()=>void fetchSummary()} disabled={busy}><Wallet size={15}/>{wallet?"Refresh "+short(wallet):"Connect and check invite code"}</button>
     {link?<div className="growth-share">
       <div className="growth-qr"><QRCodeSVG value={link} size={158} marginSize={2} bgColor="#ffffff" fgColor="#161124" title="Lidde Fun invitation QR code"/></div>
       <label>Onboarding URL<input readOnly value={link} onFocus={e=>e.target.select()}/></label>
       <button onClick={()=>void copy(link)}><Copy size={14}/> Copy your invite link</button>
      </div>:<p className="growth-note">No active invite link. <Link href="/leaderboard">Enable public profile opt-in <ExternalLink size={13}/></Link></p>}
     {summary&&<div className="growth-metrics"><div><small>Attributed wallets</small><strong>{summary.invitees.length}{summary.truncated?"+":""}</strong></div>
       <div><small>Wallets with an imported verified claim</small><strong>{summary.invitees.filter(i=>i.verifiedClaim).length}</strong></div></div>}
     {summary?.attributedTo&&<p className="growth-note">This wallet was attributed to {short(summary.attributedTo)}.</p>}
    </section>
    <section className="growth-panel growth-form">
     <h2><Gift size={18}/> Accept an invite</h2>
     <label>Invite code<input value={code} onChange={e=>setCode(e.target.value.trim())} spellCheck={false} placeholder="18-character code" maxLength={18}/></label>
     <label className="growth-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      I consent to recording wallet-level invite attribution. This is not proof of identity or a promise of reward.</label>
     <button className="growth-primary" disabled={busy||!consent||!/^[0-9a-f]{18}$/.test(code)} onClick={()=>void join()}>Sign & accept attribution</button>
    </section>
    {note&&<div className="growth-success" role="status">{note}</div>}
    {error&&<div className="growth-error" role="alert">{error}</div>}
   </div>
   <section className="growth-panel"><h2><Gift size={18}/> Share genuinely funded campaigns</h2>
    <p className="growth-note">These campaigns are returned only after chain-side escrow verification. No sponsored ranking, artificial reach or paid placement is shown.</p>
    <div className="growth-community-quests">
     {quests.map(q=><article key={q.id}><div><span className="growth-campaign-state">{q.state}</span><h3>{q.title}</h3>
       <p>{q.tasks.length} verified on-chain steps · {q.claims}/{q.maxClaims} claims</p></div>
       <div className="growth-actions"><Link href={"/quests/"+q.id}>View quest <ExternalLink size={13}/></Link>
        <button onClick={()=>void copy(url+"/quests/"+q.id)}><Copy size={14}/> Copy</button></div></article>)}
     {!quests.length&&<div className="growth-unavailable"><ShieldAlert size={21}/><div><strong>No verified funded quests available</strong><p>Campaigns will appear only after the network, indexer and escrow deployment are independently confirmed.</p></div></div>}
    </div>
   </section>
  </div>
 </div>;
}
