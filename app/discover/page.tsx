import { Phase2Nav, Phase2Header } from "@/components/phase2/nav";
import { DiscoveryBoard } from "@/components/phase2/discovery-board";
export const metadata = { title: "Token discovery — Lidde Fun", description: "Canonical isolated-sandbox pool discovery from verifiable blocks." };
export default function Page() { return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M05–M06" title="Discover tokens." subtitle="No invented prices or market caps. Discover verified pair contracts and on-chain ERC-20 metadata."/><DiscoveryBoard/></main>; }
