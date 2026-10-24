import { Phase2Nav, Phase2Header } from "@/components/phase2/nav";
import { PortfolioManager } from "@/components/phase2/portfolio-manager";
export const metadata={title:"Portfolio and LP — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M09" title="Wallet & liquidity." subtitle="Read indexed asset balances, provide sandbox liquidity and withdraw redeemable LP positions."/><PortfolioManager/></main>;}
