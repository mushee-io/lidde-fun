import { Phase2Header, Phase2Nav } from "@/components/phase2/nav";
import { PairHistory } from "@/components/phase2/pair-history";
import { isAddress } from "viem";
import Link from "next/link";
export const metadata={title:"Verified pool history — Lidde Fun"};
export default async function Page({params}:{params:Promise<{address:string}>}){
  const {address}=await params;
  return <main className="phase2-page"><Phase2Nav/><Phase2Header eyebrow="PHASE 2 · M06" title="Pool price history." subtitle="Relative sandbox reserve prices sourced from recorded Lidde Pair Sync events."/>
    {isAddress(address)?<><PairHistory address={address}/><p className="phase2-muted"><Link href={"/trade?pair="+address}>Open verified spot quote for this pool →</Link></p></>:
      <section className="phase2-panel">Invalid EVM pool address.</section>}
  </main>;
}
