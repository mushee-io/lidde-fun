import "server-only";
import {probeNetwork} from "@/lib/infra/probe";
import {questSql} from "@/lib/quests/db";
import {verifiedVault,claimSigner} from "@/lib/quests/vault";
import {getVerifiedContext} from "@/lib/phase2/indexed";
import {assessRelease,writesEnabled, type ReleaseInput} from "@/lib/ops/release";
export type OperatorCheck={status:"verified"|"unavailable"|"not-verified";note:string};
export type OperatorReadiness={
 generatedAt:string;gate:string;publicBeta:boolean;writeEnabled:boolean;
 checks:Record<string,OperatorCheck>;blockers:string[];
 disclaimer:string;
};
export async function readReadiness():Promise<OperatorReadiness>{
 const withTimeout=async (run:()=>Promise<unknown>):Promise<boolean>=>{
  try{return !!await Promise.race([run(),new Promise((_,reject)=>setTimeout(()=>reject(Error("timeout")),8500))]);}
  catch{return false;}
 };
 const network=await probeNetwork();
 const rpc=network.info.status==="verified";
 const [indexer,vault,database]=await Promise.all([
  rpc?withTimeout(()=>getVerifiedContext()):Promise.resolve(false),
  rpc?withTimeout(()=>verifiedVault()):Promise.resolve(false),
  withTimeout(async()=>{const rows=await questSql().query("SELECT 1 AS ok");return rows.length===1;})
 ]);
 const attestor=(()=>{try{return !!claimSigner().address;}catch{return false;}})();
 const input:ReleaseInput={
  build:true,rpc,explorer:rpc&&!!network.info.explorerUrl,
  factory:rpc,router:rpc,indexer,vault,database,attestor,
  faucet:false,independentWalletProof:false,securityReview:false,
  vercel:!!process.env.VERCEL_ENV
 };
 const result=assessRelease(input);
 const checks:Record<string,OperatorCheck>={};
 for(const [name,yes] of Object.entries(input)){
  checks[name]={status:yes?"verified":"not-verified",
   note:yes?"Runtime check passed, or build platform detected":"No independent runtime evidence or operator sign-off"};
 }
 // Cosmetic server-build presence and hostname never constitute proof of a production release.
 checks.build.note="Compiled code is present; separate CI passing required for a release.";
 checks.vercel.note=input.vercel?"A Vercel runtime was detected, not a released product":"No Vercel runtime detected.";
 checks.independentWalletProof.note="Requires independently witnessed explorer receipts from separate wallets; not auto-approved.";
 checks.securityReview.note="External financial-security audit and operator sign-off required.";
 checks.faucet.note="Faucet has not been externally verified.";
 return {generatedAt:new Date().toISOString(),gate:result.gate,publicBeta:result.publicBeta,
  writeEnabled:writesEnabled(process.env.LIDDE_FUN_WRITES_ENABLED,process.env.LIDDE_FUN_EMERGENCY_STOP),
  checks,blockers:result.blockers,
  disclaimer:"Read-only inspection; checks do not authorize tokens, leverage or a public launch. Public-beta controls remain unapproved without independent audit and receipt evidence."};
}
