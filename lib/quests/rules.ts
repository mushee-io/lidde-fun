import { getAddress, isAddress, zeroAddress, type Address } from "viem";

export type RuleKind="hold"|"swap"|"lp";
export type QuestRule={kind:RuleKind;token?:Address;pair?:Address;minRaw:string};
export type Draft={
 title:string;description:string;creator:Address;token:Address;
 rewardEachRaw:string;maxClaims:number;startsAt:string;endsAt:string;tasks:QuestRule[];
};
const positive=(x:unknown):x is string=>typeof x==="string"&&/^[1-9][0-9]{0,76}$/.test(x);
const address=(x:unknown):x is Address=>typeof x==="string"&&isAddress(x)&&x.toLowerCase()!==zeroAddress;
const plain=(x:unknown,max:number):x is string=>typeof x==="string"&&x.trim().length>0&&x.trim().length<=max&&
 !/[\u0000-\u0008\u000B\u000E-\u001F]/.test(x);

export function normalizedWallet(raw:unknown):Address{
 if(!address(raw))throw new Error("A valid nonzero EVM wallet is required.");
 return getAddress(raw);
}
export function isUuid(value:string){
 return /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value);
}
export function validateDraft(raw:unknown):Draft{
 if(!raw||typeof raw!=="object")throw new Error("Campaign data must be an object.");
 const x=raw as Record<string,unknown>;
 if(!plain(x.title,100)||x.title.trim().length<5||!plain(x.description,600)||
  !address(x.creator)||!address(x.token)||!positive(x.rewardEachRaw)||
  !Number.isInteger(x.maxClaims)||Number(x.maxClaims)<1||Number(x.maxClaims)>10000||
  !Array.isArray(x.tasks)||x.tasks.length<1||x.tasks.length>5)
  throw new Error("Invalid quest name, budget, issuer, reward asset or tasks.");
 if(!plain(x.startsAt,35)||!plain(x.endsAt,35))throw new Error("Schedule is required.");
 const start=Date.parse(x.startsAt),end=Date.parse(x.endsAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<Date.now()-5*60000||
   end<=start||end-start>365*86400000)throw new Error("Quest dates are invalid or exceed one year.");
 const tasks:QuestRule[]=x.tasks.map((value:unknown)=>{
   if(!value||typeof value!=="object")throw new Error("Invalid quest task.");
   const t=value as Record<string,unknown>;
   if(!["hold","swap","lp"].includes(String(t.kind))||!positive(t.minRaw))
    throw new Error("Task must have a valid type and minimum raw on-chain amount.");
   if(t.kind==="hold"&&!address(t.token))throw new Error("Hold tasks require valid ERC-20 contracts.");
   if((t.kind==="swap"||t.kind==="lp")&&!address(t.pair))
    throw new Error("Trading and LP tasks require verified pair contracts.");
   return {kind:t.kind as RuleKind,minRaw:t.minRaw,...(t.kind==="hold"?{token:getAddress(t.token as Address)}:{pair:getAddress(t.pair as Address)})};
 });
 if(BigInt(x.rewardEachRaw as string)*BigInt(x.maxClaims as number)>2n**192n-1n)
  throw new Error("Sandbox budget exceeds safety bounds.");
 return {title:x.title.trim(),description:x.description.trim(),creator:getAddress(x.creator),
  token:getAddress(x.token),rewardEachRaw:x.rewardEachRaw,maxClaims:Number(x.maxClaims),
  startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),tasks};
}
