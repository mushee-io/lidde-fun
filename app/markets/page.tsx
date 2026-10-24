import type { Metadata } from "next";
import { LiveMarkets } from "@/components/live-markets";
export const metadata: Metadata = {
  title: "Verified Sandbox Markets | Lidde Fun",
  description: "Chain-verified, canonical indexed Lidde DEX sandbox markets. No fictional trading statistics."
};
export default function Page() { return <LiveMarkets />; }
