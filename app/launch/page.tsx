import { Phase2Nav, Phase2Header } from "@/components/phase2/nav";
import { TokenCreator } from "@/components/phase2/token-creator";
export const metadata = { title: "Sandbox token creator — Lidde Fun" };
export default function Page(){return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M07" title="Create a token." subtitle="Deploy capped, explicitly valueless sandbox ERC-20 contracts after chain and creator verification."/><TokenCreator/></main>;}
