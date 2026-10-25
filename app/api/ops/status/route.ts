import {NextResponse} from "next/server";
import {readReadiness} from "@/lib/ops/readiness";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 const report=await readReadiness();
 return NextResponse.json(report,{status:200,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
}
