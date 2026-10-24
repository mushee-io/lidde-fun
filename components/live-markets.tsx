"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, RefreshCw, ShieldAlert, Waves } from "lucide-react";
import Link from "next/link";

type Pool = { pair: string; token0: string; token1: string; swaps: number; reserve0: string | null; reserve1: string | null; createdBlock: string };
type Snapshot = {
  status: string; reason?: string; source?: string; chainId?: number; indexedBlock?: string;
  blockHash?: string; indexedAt?: string | null; pools?: Pool[]; swapEvents?: number | null;
};
const short = (x: string) => x.length >= 12 ? x.slice(0, 7) + "…" + x.slice(-5) : x;
const formatRaw = (x: string | null) => {
  if (x === null || x === undefined) return "—";
  return x.length > 18 ? x.slice(0, 5) + "…" + x.slice(-5) + " raw" : x + " raw";
};
export function LiveMarkets() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/markets", { cache: "no-store", signal });
      const body = await res.json() as Snapshot;
      if (!signal?.aborted) setSnapshot(body);
    } catch {
      if (!signal?.aborted) setSnapshot({ status: "unavailable", reason: "Market service could not be reached." });
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    return () => ctrl.abort();
  }, [refresh]);
  const live = snapshot?.status === "indexed";
  return <div className="market-route">
    <div className="market-route-top"><Link href="/" className="back-link"><ArrowLeft size={17}/> Lidde Fun</Link><span className={"route-state " + (live ? "ok" : "")}>{live ? <CheckCircle2 size={15}/> : <ShieldAlert size={15}/>}
      {live ? "INDEXED SANDBOX DATA" : "NOT LIVE"}</span></div>
    <div className="market-route-heading"><div><div className="eyebrow">MARKET INTELLIGENCE · VERIFIED EVENTS ONLY</div>
      <h1><Waves size={30}/> Lidde markets</h1>
      <p>Canonical on-chain test market data from Lidde DEX. No fabricated token prices, USD volume or profits.</p></div>
      <button onClick={() => void refresh()} disabled={loading}><RefreshCw size={15}/> {loading ? "Checking…" : "Refresh"}</button>
    </div>
    {!live ? <div className="market-empty" role="status"><ShieldAlert size={32}/><h2>No verified testnet markets yet</h2>
        <p>{snapshot?.reason ?? "Checking the canonical indexer and isolated test network."}</p>
        <p>The app will only show a market after a real independent sandbox network and codehash-verified contracts exist, and the recorded block hash matches the RPC.</p>
        <a href="https://github.com/mushee-io/lidde-dex" target="_blank" rel="noreferrer">Review Lidde DEX infrastructure ↗</a>
      </div> :
      <>
        <div className="market-metrics"><div><small>Chain ID</small><strong>{snapshot.chainId}</strong></div>
          <div><small>Confirmed indexed block</small><strong>{snapshot.indexedBlock}</strong></div>
          <div><small>Indexed pairs</small><strong>{snapshot.pools?.length ?? 0}</strong></div>
          <div><small>Recorded swap events</small><strong>{snapshot.swapEvents ?? "—"}</strong></div></div>
        <p className="market-freshness">Source: {snapshot.source} · Updated: {snapshot.indexedAt ?? "unknown"} · Swap events may include bots and multihop transaction legs. Reserves are raw, unpriced token units.</p>
        <div className="market-table-wrap"><table><thead><tr><th>Pair address</th><th>Token 0 / Token 1</th><th>Swap events</th><th>Raw reserve 0</th><th>Raw reserve 1</th></tr></thead>
        <tbody>{snapshot.pools?.map(pool => <tr key={pool.pair}><td title={pool.pair}>{short(pool.pair)}</td>
            <td title={pool.token0 + " / " + pool.token1}>{short(pool.token0)} / {short(pool.token1)}</td>
            <td>{pool.swaps}</td><td>{formatRaw(pool.reserve0)}</td><td>{formatRaw(pool.reserve1)}</td></tr>)}</tbody></table>
        {snapshot.pools?.length === 0 && <div className="empty-state">No pools have been indexed yet.</div>}</div>
      </>}
    <div className="market-foot"><Activity size={17}/> Trading remains gated. Indexing and displaying verified events does not enable swap execution.</div>
  </div>;
}
