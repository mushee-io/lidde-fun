import {Phase2Nav,Phase2Header} from "@/components/phase2/nav";
import {BetaChecks} from "@/components/ops/beta-checks";
export const metadata={title:"Beta readiness checks — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/>
 <Phase2Header eyebrow="M19–M20 · RELEASE EVIDENCE" title="Beta readiness." subtitle="Read-only, independently verifiable launch blockers and operator checks. No simulated traffic or fake testnet deployments."/>
 <BetaChecks/></main>;}
