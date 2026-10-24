"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
type Health = { status: string; chainId: number | null; block: string | null; explorerUrl: string | null;
  factory: string | null; router: string | null; verifiedAt: string; message: string };
export function NetworkDiagnostics() {
  const [result, setResult] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  async function read(signal?: AbortSignal) {
    setBusy(true);
    try {
      const response = await fetch("/api/network/status", { cache: "no-store", signal });
      const body = await response.json() as Health;
      if (!signal?.aborted) setResult(body);
    } catch {
      if (!signal?.aborted) setResult({ status: "unavailable", chainId: null, block: null, explorerUrl: null,
        factory: null, router: null, verifiedAt: "", message: "Could not read network diagnostics." });
    } finally { if (!signal?.aborted) setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); void read(controller.signal); return () => controller.abort(); }, []);
  const verified = result?.status === "verified";
  return <div className="health-view"><div className="health-title"><div><small>OBSERVED NETWORK PROVENANCE</small><h1>{verified ? <ShieldCheck/> : <ShieldAlert/>} Testnet readiness</h1>
    <p>Wallet actions and market listings stay locked until the environment matches a pinned sandbox chain and reviewed contracts.</p></div>
    <button onClick={() => void read()} disabled={busy}><RefreshCw size={15}/>{busy ? "Checking…" : "Check again"}</button></div>
    <div className={"health-status " + (verified ? "verified" : "")}><strong>{verified ? "Pinned RPC and contracts verified" : "Testnet not confirmed"}</strong><p>{result?.message ?? "Checking the network…"}</p></div>
    <dl className="health-grid">
      <div><dt>Network status</dt><dd>{result?.status ?? "checking"}</dd></div>
      <div><dt>Chain ID</dt><dd>{result?.chainId ?? "—"}</dd></div>
      <div><dt>Observed block</dt><dd>{result?.block ?? "—"}</dd></div>
      <div><dt>Last checked</dt><dd>{result?.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : "—"}</dd></div>
      <div><dt>Factory</dt><dd>{result?.factory ?? "unverified"}</dd></div>
      <div><dt>Router</dt><dd>{result?.router ?? "unverified"}</dd></div>
    </dl>
    {verified && result?.explorerUrl && <a className="health-explorer" href={result.explorerUrl} target="_blank" rel="noreferrer">Open configured sandbox explorer ↗</a>}
    <p className="health-disclaimer">Chain identity checks alone do not establish independent security audits, sufficient faucet funds, or operational public trading readiness.</p>
  </div>;
}
