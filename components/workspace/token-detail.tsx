"use client";
import Link from "next/link";
import {Activity,ArrowRight,ArrowUpRight,Coins,ExternalLink,LockKeyhole,ShieldAlert,ShieldCheck,Wallet} from "lucide-react";
import {PairHistory} from "@/components/phase2/pair-history";
import type {ListedPool,ListedToken} from "@/lib/phase2/discovery";
const short=(v:string)=>v.slice(0,8)+"…"+v.slice(-6);
export function TokenDetail({address,tokens,pools,reason}:{address:string;tokens:ListedToken[];pools:ListedPool[];reason?:string}){
 const token=tokens.find(t=>t.address.toLowerCase()===address.toLowerCase());
 const linked=pools.filter(p=>p.token0.toLowerCase()===address.toLowerCase()||p.token1.toLowerCase()===address.toLowerCase());
 return <div className="lf-detail-page">
  {!token?<section className="lf-empty-feature"><ShieldAlert size={24}/><h2>Token not verified in Lidde discovery</h2>
   <p>{reason||"An address is not proof of token quality or listing eligibility. This page requires a canonical Factory pool and on-chain ERC-20 metadata."}</p>
   <Link href="/discover">Browse verified tokens <ArrowRight size={15}/></Link></section>:
  <>
   <div className="lf-page-heading"><div><h1><span className="lf-token-avatar">{token.symbol.charAt(0)}</span> {token.symbol}</h1><p>{token.name} · {token.decimals} decimals · valueless sandbox</p></div><Link className="lf-primary-action" href="/trade"><Activity size={17}/> Spot terminal</Link></div>
   <div className="lf-identity-strip"><span><ShieldCheck size={16}/> ERC-20 metadata read from verified chain · token is not externally audited</span><code title={token.address}>{token.address}</code><button title="Copy token address" onClick={()=>void navigator.clipboard?.writeText(token.address)}><Wallet size={15}/> Copy</button></div>
   <div className="lf-token-summary">{[["DEX pools",String(linked.length)],["Confirmed swaps",String(linked.reduce((n,p)=>n+p.swaps,0))],["USD price","Unavailable"],["Market cap","Unavailable"]].map(([a,b])=><div key={a}><small>{a}</small><strong>{b}</strong></div>)}</div>
   <section className="lf-detail-section"><h2>Verified liquidity pairs</h2>{linked.map(pool=>{
    const other=pool.token0.toLowerCase()===token.address.toLowerCase()?pool.token1:pool.token0;
    const peer=tokens.find(t=>t.address.toLowerCase()===other.toLowerCase());
    return <div key={pool.pair} className="lf-pair-section"><div className="lf-pair-title"><span><Coins size={17}/> {token.symbol} / {peer?.symbol??short(other)}</span><Link href={"/pairs/"+pool.pair}>Full pair details <ArrowUpRight size={14}/></Link></div>
      <div className="lf-token-summary"><div><small>Reserve token0 (raw)</small><strong>{pool.reserve0}</strong></div><div><small>Reserve token1 (raw)</small><strong>{pool.reserve1}</strong></div><div><small>Verified reserve ratio</small><strong>{pool.price0In1??"—"}</strong></div><div><small>Indexed swaps</small><strong>{pool.swaps}</strong></div></div>
      <PairHistory address={pool.pair}/></div>;
   })}
   {!linked.length&&<p className="lf-muted-help">This asset currently has no canonical liquidity pools.</p>}</section>
   <div className="lf-integrity-foot"><LockKeyhole size={16}/> No financial advice, verified USD price, token quality rating, graduation status or audited-creator claim is implied by this listing. Wallet writes remain gated by the existing verified spot terminal.</div>
  </>}
 </div>;
}
