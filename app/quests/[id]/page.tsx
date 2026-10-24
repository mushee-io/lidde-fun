import { Phase2Nav } from "@/components/phase2/nav";
import { QuestDetail } from "@/components/quests/quest-detail";
export const metadata={title:"On-chain quest | Lidde Fun"};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 return <main className="phase2-page"><Phase2Nav/><QuestDetail id={id}/></main>;
}
