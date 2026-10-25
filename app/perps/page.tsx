import {Phase2Nav,Phase2Header} from "@/components/phase2/nav";
import {PerpsLab} from "@/components/perps/perps-lab";
export const metadata={title:"Perpetual risk simulator — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/>
 <Phase2Header eyebrow="M18 · DISABLED TRADING RESEARCH" title="Perpetual risk lab." subtitle="A strictly offline, valueless margin and liquidation stress simulator. No leverage transactions or oracle claims."/>
 <PerpsLab/></main>;}
