import { NextResponse } from "next/server";
import { claimSigner, verifiedVault } from "@/lib/quests/vault";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{
  const {vault,config}=await verifiedVault();
  return NextResponse.json({
   status:"verified",chainId:config.chainId,vault,
   attestor:claimSigner().address,realValueAllowed:false
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({status:"unavailable",reason:e instanceof Error?e.message:"Quest vault unavailable."},
    {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
