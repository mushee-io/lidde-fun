import "server-only";
import { neon } from "@neondatabase/serverless";
export class QuestDbUnavailable extends Error {
 constructor(){super("Lidde Fun's separate quest database is not configured.");}
}
export function questSql(){
 const url=process.env.QUEST_DATABASE_URL;
 if(!url)throw new QuestDbUnavailable();
 return neon(url);
}
