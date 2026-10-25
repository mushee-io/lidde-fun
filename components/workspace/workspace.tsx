"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
 Activity,ArrowDownUp,ArrowRight,ArrowUpRight,Bell,ChartCandlestick,ChartNoAxesCombined,
 Check,ChevronDown,Coins,Copy,ExternalLink,Gift,Globe2,Info,Layers3,LayoutGrid,
 LockKeyhole,Menu,Plus,Search,ShieldAlert,ShieldCheck,Star,Trophy,Users,Wallet,X,Zap
} from "lucide-react";
import {WalletConnect} from "@/components/wallet-connect";
import {QuestBoard} from "@/components/workspace/quest-board";
import {PerpTerminal} from "@/components/workspace/perp-terminal";
import {Leaderboard} from "@/components/growth/leaderboard";
import {TokenDetail} from "@/components/workspace/token-detail";
import {TraderProfile} from "@/components/workspace/trader-profile";
import type {PublicQuest} from "@/lib/quests/browser";
import type {ListedPool,ListedToken} from "@/lib/phase2/discovery";

type WorkspaceView="quest"|"perp"|"tokens"|"leaderboard"|"token"|"trader";
type SidebarTab="Alerts"|"Tokens"|"Perp"|"Leaderboard"|"Quest";
type TokenCategory="Crypto"|"Trending"|"New"|"Active"|"Graduated";
type PerpCategory="All"|"Crypto"|"Meme"|"Stock";
type WindowKey="week"|"month"|"season"|"all";
type Split="none"|"bottom"|"right";
type Discovery={status:string;reason?:string;tokens:ListedToken[];pools:ListedPool[];indexedBlock?:string;chainId?:number};
type QuestData={status:string;reason?:string;campaigns:PublicQuest[]};
type Board={status:string;reason?:string;rankings: {rank:number;wallet:string;nickname:string|null;xp:number;claims:number}[];indexedBlock?:string};
type Activity={status:string;reason?:string;events:{txHash:string;wallet:string;pair:string;side:"buy"|"sell"|"swap";token:string;rawAmount:string;block:string}[];indexedBlock?:string};
const sidebarTabs:SidebarTab[]=["Alerts","Tokens","Perp","Leaderboard","Quest"];
const tokenCategories:TokenCategory[]=["Crypto","Trending","New","Active","Graduated"];
const shrink=(address:string)=>address.slice(0,6)+"…"+address.slice(-4);
const addressPattern=/^0x[0-9a-fA-F]{40}$/;
const money=(n:string)=>{try{const x=BigInt(n);return x.toLocaleString("en-GB");}catch{return n;}};
const initialTab:Record<WorkspaceView,SidebarTab>={quest:"Quest",perp:"Perp",tokens:"Tokens",leaderboard:"Leaderboard",token:"Tokens",trader:"Leaderboard"};

export function TradingWorkspace({view="quest",market="BTC",address=""}:{view?:WorkspaceView;market?:string;address?:string}){
 const router=useRouter();
 const [tab,setTab]=useState<SidebarTab>(initialTab[view]);
 const [category,setCategory]=useState<TokenCategory>("Trending");
 const [perpCategory,setPerpCategory]=useState<PerpCategory>("All");
 const [followersMode,setFollowersMode]=useState<"Global"|"Friends">("Global");
 const [period,setPeriod]=useState<WindowKey>("all");
 const [rankingMode,setRankingMode]=useState<"Traders"|"Coins">("Traders");
 const [selectedQuest,setSelectedQuest]=useState("");
 const [split,setSplit]=useState<Split>("none");
 const [search,setSearch]=useState(""),[searchOpen,setSearchOpen]=useState(false);
 const [sidebarOpen,setSidebarOpen]=useState(false),[notice,setNotice]=useState("");
 const [watchWallets,setWatchWallets]=useState<string[]>([]);
 const [networkOK,setNetworkOK]=useState(false);
 const [discovery,setDiscovery]=useState<Discovery>({status:"loading",tokens:[],pools:[]});
 const [questData,setQuestData]=useState<QuestData>({status:"loading",campaigns:[]});
 const [board,setBoard]=useState<Board>({status:"loading",rankings:[]});
 const [activity,setActivity]=useState<Activity>({status:"loading",events:[]});
 const inputRef=useRef<HTMLInputElement>(null);
 const sequence=useRef(0);

 useEffect(()=>{
  try{
   const mode=localStorage.getItem("lf-terminal-split");
   if(mode==="right"||mode==="bottom")setSplit(mode);
   const follows=JSON.parse(localStorage.getItem("lf-trader-follows")||"[]");
   if(Array.isArray(follows))setWatchWallets(follows.filter((x):x is string=>typeof x==="string"&&addressPattern.test(x)).slice(0,100));
  }catch{/* browser storage optional */}
 },[]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const target=e.target as HTMLElement;
   const editing=target?.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(target?.tagName);
   if(e.key==="/"&&!editing){e.preventDefault();inputRef.current?.focus();}
   if(e.key==="Escape"){setSearchOpen(false);inputRef.current?.blur();}
  };
  window.addEventListener("keydown",key);
  return()=>window.removeEventListener("keydown",key);
 },[]);
 const updateSplit=(value:Split)=>{setSplit(value);try{localStorage.setItem("lf-terminal-split",value);}catch{}};

 const refresh=useCallback(async(signal?:AbortSignal)=>{
  const current=++sequence.current;
  const request=async<T,>(path:string):Promise<T>=>{
   const response=await fetch(path,{cache:"no-store",signal});
   const json=await response.json() as T;
   if(!response.ok)throw Error((json as {reason?:string}).reason||"Service not yet available.");
   return json;
  };
  const tasks=await Promise.allSettled([
   request<Discovery>("/api/discovery"),
   request<QuestData>("/api/quests"),
   request<Board>("/api/growth/leaderboard?window="+period),
   request<Activity>("/api/workspace/activity"),
   request<{status:string}>("/api/network/status")
  ]);
  if(signal?.aborted||sequence.current!==current)return;
  const error=(i:number)=>tasks[i].status==="rejected"?(tasks[i] as PromiseRejectedResult).reason?.message||"Unavailable":"Unavailable";
  setDiscovery(tasks[0].status==="fulfilled"?tasks[0].value:{status:"unavailable",reason:error(0),tokens:[],pools:[]});
  setQuestData(tasks[1].status==="fulfilled"?tasks[1].value:{status:"unavailable",reason:error(1),campaigns:[]});
  setBoard(tasks[2].status==="fulfilled"?tasks[2].value:{status:"unavailable",reason:error(2),rankings:[]});
  setActivity(tasks[3].status==="fulfilled"?tasks[3].value:{status:"unavailable",reason:error(3),events:[]});
  setNetworkOK(tasks[4].status==="fulfilled"&&tasks[4].value.status==="verified");
 },[period]);
 useEffect(()=>{
  const controller=new AbortController();
  void refresh(controller.signal);
  const id=window.setInterval(()=>void refresh(controller.signal),30000);
  return()=>{controller.abort();window.clearInterval(id);};
 },[refresh]);

 const tokens=discovery.tokens;
 const pools=discovery.pools;
 const poolForToken=(a:string)=>pools.find(p=>p.token0.toLowerCase()===a.toLowerCase()||p.token1.toLowerCase()===a.toLowerCase());
 const orderedTokens=useMemo(()=>{
  const safe=[...tokens];
  if(category==="Graduated")return [];
  if(category==="Active")return safe.filter(t=>pools.some(p=>(p.token0.toLowerCase()===t.address.toLowerCase()||p.token1.toLowerCase()===t.address.toLowerCase())&&p.swaps>0));
  if(category==="New")return safe.sort((a,b)=>{const p=pools.find(x=>x.token0.toLowerCase()===a.address.toLowerCase()||x.token1.toLowerCase()===a.address.toLowerCase());
   const q=pools.find(x=>x.token0.toLowerCase()===b.address.toLowerCase()||x.token1.toLowerCase()===b.address.toLowerCase());return Number(BigInt(q?.createdBlock??"0")-BigInt(p?.createdBlock??"0"));});
  if(category==="Trending")return safe.sort((a,b)=>{
   const p=pools.find(x=>x.token0.toLowerCase()===a.address.toLowerCase()||x.token1.toLowerCase()===a.address.toLowerCase());
   const q=pools.find(x=>x.token0.toLowerCase()===b.address.toLowerCase()||x.token1.toLowerCase()===b.address.toLowerCase());return (q?.swaps??0)-(p?.swaps??0);
  });return safe;
 },[tokens,pools,category]);
 const find=search.trim().toLowerCase();
 const resultTokens=orderedTokens.filter(t=>(t.symbol+" "+t.name+" "+t.address).toLowerCase().includes(find));
 const resultQuests=questData.campaigns.filter(q=>(q.title+" "+q.description+" "+q.id).toLowerCase().includes(find));
 const resultRanks=board.rankings.filter(r=>(r.wallet+" "+(r.nickname??"")).toLowerCase().includes(find));
 const globalEvents=activity.events.filter(e=>followersMode==="Global"||watchWallets.some(a=>a.toLowerCase()===e.wallet.toLowerCase()));
 const marketPoolCount=pools.length;
 const handleSearchKey=(e:React.KeyboardEvent<HTMLInputElement>)=>{
  if(e.key!=="Enter")return;
  e.preventDefault();setSearchOpen(false);
  const match=tokens.find(t=>(t.symbol+" "+t.name+" "+t.address).toLowerCase().includes(find));
  if(match){router.push("/token/"+match.address);return;}
  const quest=questData.campaigns.find(q=>q.title.toLowerCase().includes(find));
  if(quest){router.push("/quests/"+quest.id);return;}
  if(addressPattern.test(search.trim())){router.push("/trader/"+search.trim());return;}
  if(find){setTab("Tokens");router.push("/discover");}
 };
 const pinTrader=(wallet:string)=>{
  const next=watchWallets.some(a=>a.toLowerCase()===wallet.toLowerCase())?watchWallets.filter(x=>x.toLowerCase()!==wallet.toLowerCase()):[...watchWallets,wallet].slice(-100);
  setWatchWallets(next);try{localStorage.setItem("lf-trader-follows",JSON.stringify(next));}catch{}
  setNotice("Follow preferences are saved in this browser only, not on-chain or to a public social profile.");
 };
 const sidebarContent=()=>{
  if(tab==="Tokens")return <>
   <div className="lf-subtabs lf-scroll-tabs">{tokenCategories.map(x=><button key={x} className={category===x?"active":""} onClick={()=>setCategory(x)}>{x}</button>)}</div>
   <div className="lf-sidebar-overflow">{resultTokens.map((t,i)=>{
    const pair=poolForToken(t.address);
    return <Link key={t.address} href={"/token/"+t.address} className="lf-asset-row">
     <span className="lf-token-avatar">{t.symbol.slice(0,1)}</span><span className="lf-asset-name"><strong>{t.symbol}</strong><small>{t.name}</small></span>
     <span className="lf-asset-nums"><strong>{pair?.price0In1?" "+pair.price0In1:"—"}</strong><small>{pair?.price0In1?"token1/token0":"No reserve quote"}</small></span>
    </Link>;
   })}
    {!resultTokens.length&&<div className="lf-sidebar-empty"><Coins size={24}/><b>{category==="Graduated"?"No verified graduations":"No indexed tokens"}</b><p>{discovery.reason||"Discovery requires a canonical indexer and verified contract provenance. No artificial prices are shown."}</p></div>}
   </div></>;
  if(tab==="Alerts")return <>
   <div className="lf-subtabs">{(["Global","Friends"] as const).map(x=><button key={x} className={followersMode===x?"active":""} onClick={()=>setFollowersMode(x)}>{x}</button>)}</div>
   <div className="lf-sidebar-overflow">
    {globalEvents.map(e=><div className="lf-activity-row" key={e.txHash+e.pair}><span className="lf-token-avatar small"><Activity size={17}/></span><div><Link href={"/trader/"+e.wallet}><strong>{shrink(e.wallet)}</strong></Link><small><span className="lf-positive">{e.side==="swap"?"swapped":e.side}</span> {shrink(e.token)}</small></div><a title="View transaction" href={networkOK?"/markets":"#"} onClick={event=>{if(!networkOK)event.preventDefault();}}>{e.rawAmount} raw <ArrowUpRight size={13}/></a></div>)}
    {!globalEvents.length&&<div className="lf-sidebar-empty"><Bell size={25}/><b>{followersMode==="Friends"?"No followed-trader activity":"No verified trade events"}</b><p>{followersMode==="Friends"?"Follow a wallet from a trader profile; follows are private to this browser.":activity.reason||"The feed appears only when the canonical chain indexer is operational."}</p></div>}
   </div></>;
  if(tab==="Perp")return <>
   <div className="lf-sidebar-label">PERP MARKETS · verified data only</div><div className="lf-subtabs">{(["All","Crypto","Meme","Stock"] as const).map(x=><button key={x} className={perpCategory===x?"active":""} onClick={()=>setPerpCategory(x)}>{x}</button>)}</div>
   <div className="lf-sidebar-overflow">{perpCategory!=="Stock"?<Link href="/perp/BTC" className="lf-asset-row lf-current-market"><span className="lf-token-avatar orange">₿</span><span className="lf-asset-name"><strong>BTC <small>PREVIEW</small></strong><small>Research only · no market</small></span><span className="lf-asset-nums"><strong>—</strong><small>OI unavailable</small></span></Link>:null}
    <div className="lf-sidebar-empty"><LockKeyhole size={21}/><b>{perpCategory==="Stock"?"Stock products unavailable":"No deployed perps"}</b><p>Margin trading is blocked pending reviewed oracle, funding, custody and liquidation infrastructure.</p><Link href="/perps">Open risk lab <ArrowRight size={13}/></Link></div>
   </div></>;
  if(tab==="Leaderboard")return <>
   <div className="lf-fund-card"><div><ChartNoAxesCombined size={19}/><span><strong>Community baskets</strong><small>No verified index fund deployed</small></span></div><Link href="/leaderboard">Explore <ArrowRight size={14}/></Link></div>
   <div className="lf-subtabs">{(["Traders","Coins"] as const).map(x=><button key={x} className={rankingMode===x?"active":""} onClick={()=>setRankingMode(x)}>{x}</button>)}</div>
   <div className="lf-subtabs">{(["week","month","season","all"] as const).map(x=><button key={x} className={period===x?"active":""} onClick={()=>setPeriod(x)}>{x==="week"?"7D":x==="month"?"30D":x==="season"?"SEASON":"ALL"}</button>)}</div>
   <div className="lf-sidebar-overflow">
    {rankingMode==="Traders"?board.rankings.filter(x=>(x.wallet+" "+x.nickname).toLowerCase().includes(find)).map(x=><Link href={"/trader/"+x.wallet} key={x.wallet} className="lf-rank-row"><span>#{x.rank}</span><span className="lf-token-avatar small"><Users size={15}/></span><div><strong>{x.nickname??shrink(x.wallet)}</strong><small>{x.claims} verified claims</small></div><b>+{x.xp} XP</b></Link>):
    orderedTokens.filter(x=>(x.symbol+" "+x.address).toLowerCase().includes(find)).map((t,i)=><Link href={"/token/"+t.address} key={t.address} className="lf-rank-row"><span>#{i+1}</span><span className="lf-token-avatar small">{t.symbol.charAt(0)}</span><div><strong>{t.symbol}</strong><small>Verified ERC-20</small></div><b>{poolForToken(t.address)?.swaps??0} swaps</b></Link>)}
    {(rankingMode==="Traders"?!board.rankings.length:!orderedTokens.length)&&<div className="lf-sidebar-empty"><Trophy size={22}/><b>No verified rankings</b><p>{rankingMode==="Traders"?board.reason||"Public XP only includes opt-in wallets with confirmed escrow claims.":discovery.reason||"Token ranking requires live indexed markets."}</p></div>}
   </div></>;
  return <>
   <div className="lf-quest-side-title"><span><Trophy size={15}/>{questData.campaigns.filter(q=>q.state==="active"&&q.funded).length} live quests</span><Link href="/quests/create"><Plus size={14}/> Create</Link></div>
   <div className="lf-sidebar-overflow">{resultQuests.map(q=><button className={"lf-side-quest "+(selectedQuest===q.id?"active":"")} key={q.id} onClick={()=>setSelectedQuest(q.id)}>
    <div><span className="lf-token-avatar"><Gift size={19}/></span><span><strong>{q.title}</strong><small>{money(q.rewardEachRaw)} raw units · {q.tasks.length} tasks</small></span><i>{q.state.toUpperCase()}</i></div><div className="lf-progress"><span style={{width:(q.maxClaims?Math.min(100,q.claims/q.maxClaims*100):0)+"%"}}/></div>
   </button>)}
   {!resultQuests.length&&<div className="lf-sidebar-empty"><Trophy size={25}/><b>No funded quests</b><p>{questData.reason||"Campaigns will appear when their on-chain escrow is confirmed and funded."}</p><Link href="/quests/create">Create quest draft <ArrowRight size={13}/></Link></div>}</div>
  </>;
 };
 return <div className="lf-app">
  <header className="lf-header">
   <div className="lf-brand-area"><button className="lf-mobile-toggle" aria-label="Toggle workspace menu" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu size={20}/></button>
    <Link href="/" className="lf-brand"><span className="lf-logo-mark">✦</span><span>Lidde<span>Fun</span></span></Link></div>
   <div className="lf-global-search"><Search size={18}/><input ref={inputRef} value={search} onFocus={()=>setSearchOpen(true)} onChange={e=>setSearch(e.target.value)}
     onKeyDown={handleSearchKey} placeholder="Search for tokens or traders..." aria-label="Search verified assets traders and quests" autoComplete="off"/>
    {search?<button title="Clear search" onClick={()=>setSearch("")}><X size={16}/></button>:<kbd>/</kbd>}
    {searchOpen&&search.trim().length>0&&<div className="lf-search-results" role="listbox">
     {tokens.filter(t=>(t.symbol+" "+t.name+" "+t.address).toLowerCase().includes(find)).slice(0,4).map(t=><Link key={t.address} onClick={()=>setSearchOpen(false)} href={"/token/"+t.address}><Coins size={15}/><span>{t.symbol} <small>{t.name}</small></span></Link>)}
     {questData.campaigns.filter(q=>q.title.toLowerCase().includes(find)).slice(0,3).map(q=><Link key={q.id} onClick={()=>setSearchOpen(false)} href={"/quests/"+q.id}><Trophy size={15}/><span>{q.title}</span></Link>)}
     {addressPattern.test(search.trim())&&<Link onClick={()=>setSearchOpen(false)} href={"/trader/"+search.trim()}><Wallet size={15}/> Open wallet profile {shrink(search.trim())}</Link>}
     {!tokens.some(t=>t.symbol.toLowerCase().includes(find))&&!questData.campaigns.some(q=>q.title.toLowerCase().includes(find))&&!addressPattern.test(search.trim())&&<p>No matching indexed records.</p>}
    </div>}
   </div>
   <div className="lf-account-actions"><Link className="lf-balance-link" href="/portfolio"><small>— cash</small><span>Deposit more</span></Link><Link href="/portfolio" className="lf-portfolio-link"><small>—</small><span>Portfolio</span></Link><WalletConnect notify={setNotice}/></div>
  </header>
  <div className={"lf-layout "+(split==="right"?"lf-split-right":"")}>
   <aside className={"lf-sidebar "+(sidebarOpen?"open":"")}>
    <nav className="lf-sidebar-tabs" aria-label="Workspace panels">{sidebarTabs.map(x=><button className={tab===x?"active":""} onClick={()=>{setTab(x);setSidebarOpen(false);}} key={x}>{x}</button>)}</nav>
    {sidebarContent()}
    <div className="lf-split-tools">
     <button className={split==="bottom"?"active":""} onClick={()=>updateSplit(split==="bottom"?"none":"bottom")}><LayoutGrid size={15}/> Split bottom</button>
     <button className={split==="right"?"active":""} onClick={()=>updateSplit(split==="right"?"none":"right")}><Layers3 size={15}/> Split right</button>
    </div>
   </aside>
   {split!=="none"&&<aside className={"lf-secondary-panel "+(split==="bottom"?"bottom":"right")}><div className="lf-secondary-head"><span><Activity size={15}/> Indexed activity</span><button aria-label="Close split panel" onClick={()=>updateSplit("none")}><X size={16}/></button></div>
    <div className="lf-sidebar-overflow">{activity.events.length?activity.events.slice(0,12).map(x=><div className="lf-secondary-event" key={x.txHash}>{shrink(x.wallet)} · {x.side} · {x.rawAmount} raw</div>):<div className="lf-sidebar-empty"><Bell size={20}/><p>{activity.reason||"No canonical activity events available."}</p></div>}</div></aside>}
   <main className="lf-main">
    {view==="token"?<TokenDetail address={address} tokens={tokens} pools={pools} reason={discovery.reason}/>:view==="trader"?<TraderProfile address={address} rankings={board.rankings} onFollow={pinTrader} followed={watchWallets.some(x=>x.toLowerCase()===address.toLowerCase())}/>:view==="quest"?<QuestBoard quests={questData.campaigns} loading={questData.status==="loading"} error={questData.reason??""} selected={selectedQuest} onSelect={setSelectedQuest}/>:
     view==="perp"?<PerpTerminal market={market}/>:
     view==="leaderboard"?<div className="lf-leaderboard-view"><div className="lf-page-heading"><div><h1><Trophy size={27}/> Leaderboard</h1><p>On-chain verified quest XP. Trading profit and unverified return calculations are not displayed.</p></div><Link className="lf-primary-action" href="/community"><Users size={17}/> Community</Link></div><Leaderboard/></div>:
     <div className="lf-token-view"><div className="lf-page-heading"><div><h1><Coins size={27}/> Token discovery</h1><p>Canonical tokens and reserve ratios on the isolated Lidde sandbox. No invented market caps or fiat values.</p></div><Link className="lf-primary-action" href="/launch"><Plus size={18}/> Create token</Link></div>
      {discovery.status==="indexed"?<div className="lf-token-table"><div className="lf-token-table-header"><span>Asset</span><span>Pairs</span><span>Confirmed swaps</span><span>Verified reserve quote</span></div>
       {orderedTokens.map(t=>{const p=poolForToken(t.address);return <Link className="lf-token-table-row" href={"/token/"+t.address} key={t.address}><span><i className="lf-token-avatar">{t.symbol.charAt(0)}</i><b>{t.symbol}</b><small>{t.name}</small></span><span>{p?"1+":"0"}</span><span>{p?.swaps??0}</span><span>{p?.price0In1??"—"} <ArrowRight size={14}/></span></Link>;})}
       {!orderedTokens.length&&<p className="lf-table-empty">No on-chain tokens with verified pool provenance yet.</p>}
      </div>:<div className="lf-empty-feature"><ShieldAlert size={27}/><h2>Indexer connection required</h2><p>{discovery.reason||"No verified on-chain markets are currently reachable."}</p><Link href="/network">Network status <ArrowRight size={15}/></Link></div>}
      <div className="lf-route-actions"><Link href="/trade">Spot terminal <ArrowRight size={15}/></Link><Link href="/pools/create">Create pool <ArrowRight size={15}/></Link></div>
     </div>}
    {notice&&<div className="lf-toast" role="status"><Info size={16}/>{notice}<button aria-label="Dismiss" onClick={()=>setNotice("")}><X size={16}/></button></div>}
   </main>
  </div>
  <footer className="lf-bottom-ticker"><div className="lf-ticker-assets">
   {discovery.status==="indexed"&&pools.length?pools.slice(0,9).map(p=><Link href={"/pairs/"+p.pair} key={p.pair}><strong>{tokens.find(t=>t.address.toLowerCase()===p.token0.toLowerCase())?.symbol??"TOKEN"} / {tokens.find(t=>t.address.toLowerCase()===p.token1.toLowerCase())?.symbol??"TOKEN"}</strong><span>{p.price0In1??"—"}</span></Link>):
    <span className="lf-ticker-no-data"><ShieldAlert size={14}/> No verified market prices · not connected</span>}
   </div><div className="lf-ticker-right"><span className={networkOK?"online":"offline"}>● {networkOK?"Sandbox verified":"Disconnected"}</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/help">Help</Link></div></footer>
  <nav className="lf-mobile-bar" aria-label="Mobile navigation"><Link href="/discover"><Search size={20}/>Discover</Link><Link href="/trade"><ArrowDownUp size={20}/>Trade</Link><Link href="/launch"><Plus size={20}/>Launch</Link><Link href="/quests"><Trophy size={20}/>Quests</Link><Link href="/portfolio"><Wallet size={20}/>Portfolio</Link></nav>
 </div>;
}
