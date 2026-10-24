import Link from "next/link";
import { NetworkDiagnostics } from "@/components/network-diagnostics";
export const metadata = { title: "Network Readiness | Lidde Fun" };
export default function Page() {
  return <main className="market-route">
    <div className="market-route-top"><Link href="/" className="back-link">← Lidde Fun</Link><span className="route-state">CHAIN SAFETY</span></div>
    <NetworkDiagnostics/>
  </main>;
}
