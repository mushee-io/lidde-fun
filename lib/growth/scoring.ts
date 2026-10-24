import { isAddress } from "viem";
export const XP_ALGORITHM="lidde-quest-v1";
export const CLAIM_XP=100;
export type ScoreWindow="week"|"month"|"season"|"all";
export type ScoreEvent={
  wallet:string;eventId:string;at:number;xp:number;type:"quest_claim";
};
export type ScoreProfile={wallet:string;nickname:string|null;public:boolean};
export type Ranked={rank:number;wallet:string;nickname:string|null;xp:number;claims:number};
export function periodStart(period:ScoreWindow,now:number):number {
 const today=new Date(now);
 const y=today.getUTCFullYear(),m=today.getUTCMonth();
 if(period==="all")return 0;
 if(period==="month")return Date.UTC(y,m,1);
 if(period==="season")return Date.UTC(y,Math.floor(m/3)*3,1);
 // ISO Monday 00:00 UTC; deliberately not a rolling seven-day window.
 const day=(today.getUTCDay()+6)%7;
 return Date.UTC(y,m,today.getUTCDate()-day);
}
export function periodLabel(period:ScoreWindow,now:number):string{
 const d=new Date(now),y=d.getUTCFullYear(),m=d.getUTCMonth();
 if(period==="all")return "All-time";
 if(period==="month")return d.toLocaleDateString("en-GB",{timeZone:"UTC",month:"long",year:"numeric"});
 if(period==="season")return y+" Q"+(Math.floor(m/3)+1);
 return "Week of "+new Date(periodStart("week",now)).toISOString().slice(0,10);
}
export function rankEvidence(events:ScoreEvent[],profiles:ScoreProfile[],period:ScoreWindow,now:number):Ranked[]{
 const start=periodStart(period,now);
 const publicProfiles=new Map(profiles.filter(p=>p.public&&isAddress(p.wallet)).map(p=>[p.wallet.toLowerCase(),p]));
 const seen=new Set<string>();
 const byWallet=new Map<string,{xp:number;claims:number}>();
 for(const e of events){
  if(e.at<start||e.at>now||e.type!=="quest_claim"||e.xp!==CLAIM_XP||!isAddress(e.wallet)||
    !/^[a-zA-Z0-9:._-]{1,180}$/.test(e.eventId))continue;
  if(seen.has(e.eventId))continue;
  seen.add(e.eventId);
  const wallet=e.wallet.toLowerCase();
  if(!publicProfiles.has(wallet))continue;
  const prev=byWallet.get(wallet)??{xp:0,claims:0};
  byWallet.set(wallet,{xp:prev.xp+CLAIM_XP,claims:prev.claims+1});
 }
 return [...byWallet].sort((a,b)=>b[1].xp-a[1].xp||b[1].claims-a[1].claims||a[0].localeCompare(b[0],"en")).map(([wallet,score],index)=>({
  rank:index+1,wallet,nickname:publicProfiles.get(wallet)?.nickname??null,...score
 }));
}
