import "server-only";
import { questSql } from "@/lib/quests/db";
import { isUuid, type QuestRule } from "@/lib/quests/rules";
export type QuestRecord={
 id:string;creator_address:string;chain_id:number;title:string;description:string;
 task_rules:QuestRule[];token_address:string;reward_each_raw:string;max_claims:number;
 starts_at:string;ends_at:string;lifecycle:string;vault_address:string|null;onchain_campaign_id:string|null;
};
export async function questRecord(id:string):Promise<QuestRecord>{
 if(!isUuid(id))throw new Error("Invalid quest identifier.");
 const rows=await questSql().query("SELECT * FROM quest_campaigns WHERE id=$1 LIMIT 1",[id]);
 if(rows.length!==1)throw new Error("Quest does not exist.");
 return rows[0] as QuestRecord;
}
