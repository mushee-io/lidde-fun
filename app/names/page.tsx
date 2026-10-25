import Link from "next/link";
import {Phase2Nav,Phase2Header} from "@/components/phase2/nav";
import {ShieldAlert,ArrowRight} from "lucide-react";
export const metadata={title:".very name registry — Lidde Fun"};
export default function Page(){return <main className="phase2-page"><Phase2Nav/>
 <Phase2Header title=".very identity" eyebrow="VERIFIED REGISTRY INTEGRATION" subtitle="Identity ownership, availability and primary-name resolution require a deployed, validated registry and resolver."/>
 <div className="phase2-panel phase2-form"><h2><ShieldAlert size={19}/> Registry not connected</h2>
 <p>No contract address, registrar ABI, resolver or verified lease/expiry rules are configured. Registration, pricing and claims are disabled to avoid inventing .very name ownership.</p>
 <Link href="/community">Community profiles <ArrowRight size={15}/></Link></div></main>;}
