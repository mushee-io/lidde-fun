"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,BarChart3,ExternalLink,ShieldAlert,ShieldCheck,UserRound,Users,Wallet} from "lucide-react";
import type {PortfolioResponse} from "@/lib/phase2/browser-data";
const addressPattern=/^0x[0-9a-fA-F]{40}$/;
const short=(v:string)=>v.slice(0,7)+"…"+v.slice(-5);
type Score={wallet:string;rank:number;nickname:string|null;xp:number;claims:number};
export function TraderProfile({address,rankings,onFollow,followed}:{address:string;rankings:Score[];onFollow:(wallet:string)=>void;followed:boolean}){
 const [data,setData]=useState<PortfolioResponse|null>(null),[reason,setReason]=useState("Checking canonical wallet data...");
 const rank=rankings.find(x=>x.wallet.toLowerCase()===address.toLowerCase());
 useEffect(()=>{
  if(!addressPattern.test(address)){setReason("This is not a valid EVM wallet address.");return;}
  const controller=new AbortController();
  fetch("/api/portfolio?address="+encodeURIComponent(address),{cache:"no-store",signal:controller.signal})
   .then(async r=>{const json=await r.json() as PortfolioResponse&{reason?:string};if(!r.ok)throw Error(json.reason??"Wallet indexer not ready.");return json;})
   .then(x=>{setData(x);setReason("");}).catch(e=>{if(!controller.signal.aborted)setReason(e instanceof Error?e.message:"Wallet data unavailable.");});
  return()=>controller.abort();
 },[address]);
 return <div className="lf-detail-page"><div className="lf-page-heading"><div><h1><UserRound size={26}/> Trader profile</h1><p>Public blockchain data and explicitly opted-in reputation only.</p></div>
  {addressPattern.test(address)&&<button className="lf-primary-action" onClick={()=>onFollow(address)}><Users size={17}/>{followed?"Unfollow":"Follow"}</button>}</div>
  <div className="lf-trader-hero"><span className="lf-token-avatar"><Wallet size={24}/></span><div><h2>{rank?.nickname??short(address)}</h2><code>{address}</code><p>.very name not verified · follows saved only in this browser</p></div></div>
  <div className="lf-token-summary"><div><small>Verified XP rank</small><strong>{rank?"#"+rank.rank:"—"}</strong></div><div><small>Verified claim XP</small><strong>{rank?.xp??"—"}</strong></div><div><small>Canonical claims</small><strong>{rank?.claims??"—"}</strong></div><div><small>Realised PnL</small><strong>Unavailable</strong></div></div>
  {data?.status==="indexed"?<div className="lf-detail-section"><h2>Public testnet portfolio</h2>
   <div className="lf-token-summary"><div><small>Native test gas (raw)</small><strong>{data.native?.balance??"—"}</strong></div><div><small>Tokens</small><strong>{data.assets?.length??0}</strong></div><div><small>Liquidity positions</small><strong>{data.liquidity?.length??0}</strong></div><div><small>USD value</small><strong>—</strong></div></div>
   {data.assets?.map(x=><div key={x.address} className="lf-portfolio-asset"><strong>{x.symbol}</strong><span>{x.balance} raw units</span><Link href={"/token/"+x.address}><ArrowRight size={16}/></Link></div>)}
  </div>:<div className="lf-detail-notice"><ShieldAlert size={17}/>{reason||"No verified token balances indexed."}</div>}
  <div className="lf-integrity-foot"><ShieldCheck size={16}/> No trader PnL, returns, wallet identity assertions or investor performance claims are generated without reconciled on-chain accounting. Wallet-address follows are a browser preference, not Sybil-resistant social identities.</div>
 </div>;
}
