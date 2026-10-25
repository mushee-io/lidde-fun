import {NextResponse,type NextRequest} from "next/server";
import {writesEnabled} from "./lib/ops/release";
/**
 * All signed API mutations are opt-in and emergency-stoppable.
 * GET challenge is also blocked during emergency incidents.
 * Wallet writes are separately guarded by the verified manifest.
 */
export function middleware(request:NextRequest){
 const {pathname}=request.nextUrl;
 const isMutation=request.method==="POST"&&(pathname.startsWith("/api/quests/")||pathname.startsWith("/api/growth/"));
 const isChallenge=pathname==="/api/quests/challenge";
 const blocked=(isMutation||isChallenge)&&!writesEnabled(
   process.env.LIDDE_FUN_WRITES_ENABLED,process.env.LIDDE_FUN_EMERGENCY_STOP
 );
 if(blocked)return NextResponse.json({status:"disabled",reason:"Sandbox write operations are not enabled by the operator."},
  {status:503,headers:{"Cache-Control":"no-store"}});
 const contentLength=Number(request.headers.get("content-length")??"0");
 if(isMutation&&(contentLength>32_768||!Number.isFinite(contentLength)))
  return NextResponse.json({status:"rejected",reason:"Request is too large."},{status:413,headers:{"Cache-Control":"no-store"}});
 return NextResponse.next();
}
export const config={matcher:["/api/:path*"]};
