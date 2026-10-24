import { Phase2Nav } from "@/components/phase2/nav";
import { QuestDirectory } from "@/components/quests/quest-directory";
export const metadata={title:"Verified quests — Lidde Fun",description:"Create quests and inspect on-chain funded sandbox campaigns."};
export default function Page(){return <main className="phase2-page"><Phase2Nav/><QuestDirectory/></main>;}
