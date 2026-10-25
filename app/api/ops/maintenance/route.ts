import {NextRequest,NextResponse} from "next/server";
import {questSql} from "@/lib/quests/db";
import {allowedCronAuthorization} from "@/lib/ops/cron-auth";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!allowedCronAuthorization(request.headers.get("authorization"),process.env.CRON_SECRET))
  return NextResponse.json({status:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 try{
  const sql=questSql();
  const [challenge,limits]=await Promise.all([
   sql.query("DELETE FROM quest_auth_challenges WHERE expires_at < NOW()-INTERVAL '1 day' RETURNING id"),
   sql.query("DELETE FROM ops_rate_buckets WHERE window_id < FLOOR(EXTRACT(EPOCH FROM NOW())/60)-4320 RETURNING category")
  ]);
  return NextResponse.json({status:"cleaned",expiredChallenges:challenge.length,expiredRateBuckets:limits.length,
    note:"Only expired auth challenges and quota buckets are deleted; confirmed XP evidence and campaigns remain intact."},
    {headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({status:"unavailable",reason:"Dedicated maintenance database is not configured."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
