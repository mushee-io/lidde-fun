import { NextResponse } from "next/server";
import { claimSigner, verifiedVault } from "@/lib/quests/vault";
import {writesEnabled} from "@/lib/ops/release";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{
  const {vault,config}=await verifiedVault();
  return NextResponse.json({
   status:"verified",chainId:config.chainId,vault,
   attestor:claimSigner().address,vaultCodeHash:process.env.LIDDE_FUN_QUEST_VAULT_CODE_HASH,realValueAllowed:false,writeEnabled:writesEnabled(process.env.LIDDE_FUN_WRITES_ENABLED,process.env.LIDDE_FUN_EMERGENCY_STOP)
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({status:"unavailable",reason:e instanceof Error?e.message:"Quest vault unavailable."},
    {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
