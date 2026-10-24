import { Phase2Nav, Phase2Header } from "@/components/phase2/nav";
import { QuestCreator } from "@/components/quests/quest-creator";
export const metadata={title:"Create verified quest — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 3 · M10–M11" title="Create a quest." subtitle="Design tasks, authorize a wallet-signed draft, register an on-chain campaign and escrow real valueless test rewards."/><QuestCreator/></main>;}
