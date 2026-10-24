import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { probeNetwork } from "@/lib/infra/probe";
import { acceptableEndpoint } from "@/lib/infra/config";
import { parseIndexedMarkets } from "@/lib/infra/markets";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const unavailable = (status: string, reason: string, http = 503) =>
  NextResponse.json({ status, reason, pools: [], swapEvents: null, usdVolume: null, usdTvl: null }, { status: http, headers });

export async function GET() {
  const probe = await probeNetwork();
  if (probe.info.status !== "verified" || !probe.config || !probe.client)
    return unavailable("network-not-ready", "The isolated network has not passed identity and code verification.");
  const endpoint = process.env.LIDDE_DEX_MARKETS_API_URL?.trim() ?? "";
  if (!acceptableEndpoint(endpoint, process.env.NODE_ENV !== "production"))
    return unavailable("indexer-not-configured", "The canonical Lidde DEX markets API is not configured.");
  try {
    const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(7000), headers: { Accept: "application/json" } });
    if (!response.ok) return unavailable("indexer-unavailable", "The market indexer has no available canonical snapshot.");
    const raw = await response.json() as unknown;
    const snapshot = parseIndexedMarkets(raw, { chainId: probe.config.chainId, factory: probe.config.factory });
    if (!snapshot || !isAddress(snapshot.factory)) return unavailable("invalid-indexer", "Market indexer response failed validation.");
    const indexedHeight = BigInt(snapshot.indexedBlock);
    const chainHead = BigInt(probe.info.block!);
    if (indexedHeight > chainHead || chainHead - indexedHeight > 500n)
      return unavailable("stale-indexer", "The indexer is too far from the verified chain head.");
    const canonicalBlock = await probe.client.getBlock({ blockNumber: indexedHeight });
    if (!canonicalBlock.hash || canonicalBlock.hash.toLowerCase() !== snapshot.blockHash.toLowerCase())
      return unavailable("reorg-or-mismatch", "Indexed block hash does not match canonical RPC history.");
    return NextResponse.json({
      status: "indexed", source: "canonical Lidde DEX sandbox events", ...snapshot,
      usdVolume: null, usdTvl: null, prices: null
    }, { headers });
  } catch {
    return unavailable("indexer-unavailable", "A trusted and reproducible market snapshot could not be fetched.");
  }
}
