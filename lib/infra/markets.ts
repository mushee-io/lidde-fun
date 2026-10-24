import { isAddress, type Address, type Hex } from "viem";
export type Pool = {
  pair: Address; token0: Address; token1: Address;
  swaps: number; reserve0: string | null; reserve1: string | null;
  createdBlock: string;
};
export type MarketSnapshot = {
  chainId: number; indexedBlock: string; blockHash: Hex; factory: Address;
  indexedAt: string | null; pools: Pool[];
  swapEvents: number | null; includesTestBots: true;
};
const isNonnegativeIntegerString = (value: unknown): value is string =>
  typeof value === "string" && /^\d+$/.test(value) && value.length < 80;
const normalAddress = (value: unknown): value is Address => typeof value === "string" && isAddress(value);
const boundedInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function parseIndexedMarkets(payload: unknown, expected: { chainId: number; factory: Address }): MarketSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (data.status !== "indexed" || data.chainId !== expected.chainId ||
      typeof data.factory !== "string" || data.factory.toLowerCase() !== expected.factory.toLowerCase() ||
      !isNonnegativeIntegerString(data.canonicalBlock) ||
      !/^0x[0-9a-fA-F]{64}$/.test(String(data.canonicalBlockHash)) ||
      !Array.isArray(data.markets) || data.markets.length > 50) return null;
  const pools: Pool[] = [];
  const ids = new Set<string>();
  for (const value of data.markets) {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (!normalAddress(row.pair_address) || !normalAddress(row.token0) || !normalAddress(row.token1) ||
        !isNonnegativeIntegerString(row.created_block) || !boundedInteger(row.swap_count) ||
        !(row.reserve0 === null || isNonnegativeIntegerString(row.reserve0)) ||
        !(row.reserve1 === null || isNonnegativeIntegerString(row.reserve1))) return null;
    const key = row.pair_address.toLowerCase();
    if (ids.has(key)) return null;
    ids.add(key);
    pools.push({
      pair: row.pair_address, token0: row.token0, token1: row.token1,
      createdBlock: row.created_block, swaps: row.swap_count,
      reserve0: row.reserve0, reserve1: row.reserve1
    });
  }
  const counters = data.counters && typeof data.counters === "object" ? data.counters as Record<string, unknown> : null;
  const swapEvents = counters && boundedInteger(counters.swap_events) ? counters.swap_events : null;
  return {
    chainId: expected.chainId, indexedBlock: data.canonicalBlock, blockHash: data.canonicalBlockHash as Hex,
    factory: expected.factory, indexedAt: typeof data.indexedAt === "string" ? data.indexedAt : null,
    pools, swapEvents, includesTestBots: true
  };
}
