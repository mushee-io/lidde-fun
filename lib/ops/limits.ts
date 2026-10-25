import "server-only";
import {createHash} from "node:crypto";
import {questSql} from "@/lib/quests/db";
import {quotaValid} from "@/lib/ops/abuse";
export class RateLimited extends Error{constructor(){super("Too many requests. Retry after the rate-limit window.");}}
/** Atomic shared-DB quota; false if the scoped bucket is over its limit. */
export async function enforceQuota(category:string,principal:string,max:number,seconds=60):Promise<void>{
 if(!/^[a-z0-9-]{1,50}$/.test(category)||!quotaValid(max,seconds))throw new Error("Invalid rate limit settings");
 const key=createHash("sha256").update(category+":"+principal.trim().toLowerCase()).digest("hex");
 const now=Math.floor(Date.now()/1000);
 const bucket=Math.floor(now/seconds);
 const sql=questSql();
 const rows=await sql.query(
  "INSERT INTO ops_rate_buckets(category,principal_digest,window_id,requests) VALUES($1,$2,$3,1) ON CONFLICT(category,principal_digest,window_id) DO UPDATE SET requests=ops_rate_buckets.requests+1 WHERE ops_rate_buckets.requests<$4 RETURNING requests",
  [category,key,bucket,max]);
 if(!rows.length)throw new RateLimited();
}
