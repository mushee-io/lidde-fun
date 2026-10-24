import "server-only";
import { acceptableEndpoint } from "@/lib/infra/config";
import { parseIndexedMarkets, type MarketSnapshot } from "@/lib/infra/markets";
import { probeNetwork } from "@/lib/infra/probe";
import { type PublicClient, type Address } from "viem";
import type { NetworkConfig } from "@/lib/infra/config";

export type VerifiedContext = {
  config: NetworkConfig;
  client: PublicClient;
  indexed: MarketSnapshot;
  block: bigint;
};
export class MarketsUnavailable extends Error {
  constructor(public reason: string) { super(reason); }
}

export async function getVerifiedContext(): Promise<VerifiedContext> {
  const probe = await probeNetwork();
  if (!probe.config || !probe.client || probe.info.status !== "verified")
    throw new MarketsUnavailable("The isolated testnet and its contracts are not verified.");
  const url = process.env.LIDDE_DEX_MARKETS_API_URL?.trim() ?? "";
  if (!acceptableEndpoint(url, process.env.NODE_ENV !== "production"))
    throw new MarketsUnavailable("The canonical Lidde DEX indexer URL is not configured.");
  let payload: unknown;
  try {
    const result = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6500) });
    if (!result.ok) throw new Error("not indexed");
    payload = await result.json();
  } catch {
    throw new MarketsUnavailable("The independent Lidde DEX indexer is not available.");
  }
  const indexed = parseIndexedMarkets(payload, {
    chainId: probe.config.chainId,
    factory: probe.config.factory
  });
  if (!indexed) throw new MarketsUnavailable("Indexer payload failed schema, chain or factory validation.");
  const block = BigInt(indexed.indexedBlock);
  const head = BigInt(probe.info.block ?? "0");
  if (block > head || head - block > 500n)
    throw new MarketsUnavailable("Indexer is stale relative to the verified RPC.");
  try {
    const canonical = await probe.client.getBlock({ blockNumber: block });
    if (!canonical.hash || canonical.hash.toLowerCase() !== indexed.blockHash.toLowerCase())
      throw new Error("hash mismatch");
  } catch {
    throw new MarketsUnavailable("Indexed block is not canonical on the verified testnet.");
  }
  return { config: probe.config, client: probe.client, indexed, block };
}

export const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export const pairKey = (a: Address, b: Address) => [a.toLowerCase(), b.toLowerCase()].sort().join(":");
