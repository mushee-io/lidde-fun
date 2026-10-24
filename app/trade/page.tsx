import { Phase2Header, Phase2Nav } from "@/components/phase2/nav";
import { SpotTerminal } from "@/components/phase2/spot-terminal";
export const metadata = { title: "Sandbox spot trading — Lidde Fun" };
export default function Page(){return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M08" title="Spot trading." subtitle="Direct on-chain test-token swaps with simulation, bounded slippage and separate wallet approvals."/><SpotTerminal/></main>;}
