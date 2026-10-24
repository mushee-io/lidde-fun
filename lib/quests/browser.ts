"use client";
import { isAddress, keccak256, getAddress, type Address, type Hex } from "viem";
import { browserProvider, loadManifest, verifiedWallet } from "@/lib/phase2/wallet";
export type QuestConfig={status:"verified";chainId:number;vault:Address;vaultCodeHash:Hex;attestor:Address;realValueAllowed:false};
export type PublicQuest={
 id:string;title:string;description:string;tasks:{kind:"hold"|"swap"|"lp";token?:Address;pair?:Address;minRaw:string}[];
 token:Address;rewardEachRaw:string;chainId:number;vault:Address;onchainId:string;
 start:number;end:number;claims:number;maxClaims:number;funded:boolean;paused:boolean;finalized:boolean;
 state:"awaiting-funding"|"scheduled"|"active"|"ended"|"paused"|"finalized";
};
export async function parseApi<T>(path:string,options?:RequestInit):Promise<T>{
 const result=await fetch(path,{cache:"no-store",...options});
 const json=await result.json() as T&{reason?:string;status?:string};
 if(!result.ok)throw new Error(json.reason??"The quest service is not available.");
 return json;
}
export function rawWallet():string{
 return "Connect an injected browser wallet; never supply a seed phrase or private key.";
}
export async function connectedAddress():Promise<Address>{
 const provider=browserProvider();
 const accounts=await provider.request({method:"eth_requestAccounts"});
 const first=Array.isArray(accounts)?accounts[0]:null;
 if(typeof first!=="string"||!isAddress(first))throw new Error("Wallet has not returned an EVM account.");
 return getAddress(first);
}
export async function signedQuestChallenge(wallet:Address,action:"create-draft"|"register-campaign"|"verify-quest"|"growth-claim"|"growth-account"|"growth-referral"|"growth-watch"){
 const challenge=await parseApi<{id:string;message:string}>(
  "/api/quests/challenge?wallet="+wallet+"&action="+action);
 const signed=await browserProvider().request({
  method:"personal_sign",params:[challenge.message,wallet]
 });
 if(typeof signed!=="string"||!/^0x[0-9a-fA-F]{130}$/.test(signed))throw new Error("Wallet signature was rejected.");
 return {challengeId:challenge.id,signature:signed};
}
export async function questVaultWallet(){
 const [manifest,config]=await Promise.all([
  loadManifest(),parseApi<QuestConfig>("/api/quests/config")
 ]);
 if(config.status!=="verified"||config.realValueAllowed!==false||
   config.chainId!==manifest.chainId||!isAddress(config.vault)||
   !/^0x[0-9a-fA-F]{64}$/.test(config.vaultCodeHash))
   throw new Error("Pinned sandbox vault is unavailable or on the wrong chain.");
 const connection=await verifiedWallet(manifest);
 const code=await connection.client.getBytecode({address:config.vault});
 if(!code||code==="0x"||keccak256(code).toLowerCase()!==config.vaultCodeHash.toLowerCase())
  throw new Error("Quest vault code hash changed. Wallet signing is disabled.");
 return {...connection,config,manifest};
}
