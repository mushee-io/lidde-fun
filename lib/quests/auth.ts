import "server-only";
import { verifyMessage } from "viem";
import { questSql } from "@/lib/quests/db";
import { normalizedWallet, isUuid } from "@/lib/quests/rules";
export function publicQuestOrigin():string{
 const raw=process.env.QUEST_PUBLIC_ORIGIN;
 if(!raw)throw new Error("QUEST_PUBLIC_ORIGIN is not configured.");
 const value=new URL(raw);
 if(value.username||value.password||value.pathname!=="/"||value.search||value.hash||
  !(value.protocol==="https:" ||(process.env.NODE_ENV!=="production"&&value.protocol==="http:"&&value.hostname==="localhost")))
  throw new Error("A trusted HTTPS application origin is required.");
 return value.origin;
}
export function checkOrigin(request:Request){
 if(request.headers.get("origin")!==publicQuestOrigin())throw new Error("Untrusted quest mutation origin.");
}
export async function authorizedQuest(creator:unknown, challenge:unknown, signature:unknown, action:"create-draft"|"register-campaign"|"verify-quest"|"growth-claim"|"growth-account"|"growth-referral"|"growth-watch"){
 const wallet=normalizedWallet(creator);
 const id=String(challenge??"");
 if(!isUuid(id)||typeof signature!=="string"||!/^0x[0-9a-fA-F]{130}$/.test(signature))
  throw new Error("Valid challenge and wallet signature required.");
 const sql=questSql();
 const rows=await sql.query("SELECT wallet_address,message,expires_at,used_at FROM quest_auth_challenges WHERE id=$1 LIMIT 1",[id]);
 const row=rows[0];
 if(!row||row.used_at||new Date(String(row.expires_at)).getTime()<=Date.now()||
  String(row.wallet_address).toLowerCase()!==wallet.toLowerCase()||
  !String(row.message).includes("Action: "+action))
  throw new Error("Wallet challenge is missing, expired or already used.");
 const valid=await verifyMessage({address:wallet,message:String(row.message),signature:signature as `0x${string}`});
 if(!valid)throw new Error("Wallet signature is not valid for this one-time challenge.");
 const used=await sql.query("UPDATE quest_auth_challenges SET used_at=NOW() WHERE id=$1 AND used_at IS NULL AND expires_at>NOW() AND LOWER(wallet_address)=$2 RETURNING id",[id,wallet.toLowerCase()]);
 if(used.length!==1)throw new Error("Challenge was already consumed.");
 return wallet;
}

export const authorizedDraft=(creator:unknown,challenge:unknown,signature:unknown)=>
 authorizedQuest(creator,challenge,signature,"create-draft");
