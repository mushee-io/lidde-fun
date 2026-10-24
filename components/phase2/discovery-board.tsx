"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Database, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { discovery, type DiscoveryResponse } from "@/lib/phase2/browser-data";
import { formatUnits } from "viem";
type Sort = "swaps" | "newest" | "liquidity";
const short = (x: string) => x.slice(0, 7) + "…" + x.slice(-5);
export function DiscoveryBoard() {
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("swaps");
  async function read() {
    setLoading(true); setError("");
    try { setData(await discovery()); } catch (e) {
      setData(null); setError(e instanceof Error ? e.message : "Could not load verified markets.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void read(); }, []);
  const tokens = useMemo(() => new Map((data?.tokens ?? []).map(t => [t.address.toLowerCase(), t])), [data]);
  const pools = useMemo(() => (data?.pools ?? []).filter(p => {
    const text = [p.token0Symbol, p.token1Symbol, p.pair, p.token0, p.token1].join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }).sort((a,b) => sort === "swaps" ? b.swaps-a.swaps
    : sort === "newest" ? Number(BigInt(b.createdBlock)-BigInt(a.createdBlock) > 0n) - Number(BigInt(b.createdBlock)-BigInt(a.createdBlock) < 0n)
    : Number(BigInt(b.reserve0)+BigInt(b.reserve1) > BigInt(a.reserve0)+BigInt(a.reserve1)) -
      Number(BigInt(b.reserve0)+BigInt(b.reserve1) < BigInt(a.reserve0)+BigInt(a.reserve1))), [data,query,sort]);
  return <section className="phase2-panel">
    <div className="phase2-panel-head"><div><h2><Database size={20}/> Canonical indexed pools</h2><p>Token metadata is read directly from the sandbox contracts at the indexed block.</p></div>
      <button onClick={() => void read()} disabled={loading}><RefreshCw size={15}/>{loading ? "Checking…" : "Refresh"}</button></div>
    <div className="phase2-controls"><label className="phase2-search"><Search size={17}/><input placeholder="Search symbols and contract addresses" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <select aria-label="Sort markets" value={sort} onChange={e=>setSort(e.target.value as Sort)}>
        <option value="swaps">Most indexed swaps</option><option value="newest">Newest pools</option><option value="liquidity">Raw reserve units (not comparable value)</option></select></div>
    {error && <div className="phase2-blocked" role="status"><ShieldAlert/><strong>No indexed sandbox markets</strong><p>{error}</p><Link href="/network">Check network readiness <ArrowRight size={16}/></Link></div>}
    {data && <><div className="phase2-stats"><div><small>Indexed block</small><strong>{data.indexedBlock}</strong></div><div><small>Verified token contracts</small><strong>{data.tokens.length}</strong></div><div><small>Eligible canonical pools</small><strong>{data.pools.length}</strong></div><div><small>USD TVL and volume</small><strong>Not available</strong></div></div>
      <p className="phase2-muted">Unverified tokens; no listing endorsement. Swap counts can include bots. Price below expresses token 0 in token 1, not US dollars. Raw reserves have different decimals and are not comparable liquidity values.</p>
      <div className="phase2-table-scroll"><table className="phase2-table"><thead><tr><th>Pair</th><th>Token 0 / Token 1</th><th>Token 0 price</th><th>Raw indexed reserves</th><th>Swaps</th><th></th></tr></thead>
        <tbody>{pools.map(p => <tr key={p.pair}>
          <td><strong>{p.token0Symbol} / {p.token1Symbol}</strong><small>{short(p.pair)}</small><Link className="phase2-mini-link" href={"/pairs/"+p.pair}>Observed price history →</Link></td>
          <td><span title={p.token0}>{tokens.get(p.token0.toLowerCase())?.name ?? short(p.token0)}</span> / <span title={p.token1}>{tokens.get(p.token1.toLowerCase())?.name ?? short(p.token1)}</span></td>
          <td>{p.price0In1 === null ? "—" : p.price0In1 + " " + p.token1Symbol}</td>
          <td><small>{formatUnits(BigInt(p.reserve0),p.token0Decimals)} / {formatUnits(BigInt(p.reserve1),p.token1Decimals)}</small></td>
          <td>{p.swaps}</td><td><Link href={"/trade?pair="+encodeURIComponent(p.pair)}>Trade <ArrowRight size={14}/></Link></td></tr>)}</tbody></table>
        {!pools.length && <p className="phase2-muted">No matching indexed pools.</p>}
      </div></>}
  </section>;
}
