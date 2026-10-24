import { Phase2Header, Phase2Nav } from "@/components/phase2/nav";
import { FirstPool } from "@/components/phase2/first-pool";
export const metadata={title:"First testnet pool launch — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M07–M09" title="Launch liquidity." subtitle="Create an actual sandbox Factory pair with a deliberate initial price and exact ERC-20 allowances."/><FirstPool/></main>;}
