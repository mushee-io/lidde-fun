import { erc20Abi, type Address } from "viem";
import { factoryAbi, pairAbi } from "@/lib/phase2/abis";
import { eq, getVerifiedContext, type VerifiedContext } from "@/lib/phase2/indexed";

export type ListedToken = {
  address: Address; symbol: string; name: string; decimals: number;
  verified: false; source: "onchain-erc20";
};
export type ListedPool = {
  pair: Address; token0: Address; token1: Address;
  token0Symbol: string; token1Symbol: string;
  swaps: number; createdBlock: string;
  reserve0: string; reserve1: string;
  price0In1: string | null; token0Decimals: number; token1Decimals: number;
};
export type Discovery = {
  status: "indexed"; chainId: number; indexedBlock: string; blockHash: string;
  includesTestBots: true; tokens: ListedToken[]; pools: ListedPool[];
  source: string; referenceUsd: null; volumeUsd: null;
};
function quoteRatio(r0: string, r1: string, d0: number, d1: number): string | null {
  const x = BigInt(r0), y = BigInt(r1);
  if (!x || !y) return null;
  const fixed = y * (10n ** BigInt(d0)) * 1_000_000n / (x * (10n ** BigInt(d1)));
  return (Number(fixed) / 1_000_000).toString();
}
async function metadata(ctx: VerifiedContext, address: Address): Promise<ListedToken | null> {
  try {
    const code = await ctx.client.getBytecode({ address, blockNumber: ctx.block });
    if (!code || code === "0x") return null;
    const [symbol, name, decimals] = await Promise.all([
      ctx.client.readContract({ address, abi: erc20Abi, functionName: "symbol", blockNumber: ctx.block }),
      ctx.client.readContract({ address, abi: erc20Abi, functionName: "name", blockNumber: ctx.block }),
      ctx.client.readContract({ address, abi: erc20Abi, functionName: "decimals", blockNumber: ctx.block })
    ]);
    if (![6, 8, 18].includes(decimals) || !symbol || symbol.length > 24 || !name || name.length > 80)
      return null;
    return { address, symbol, name, decimals, verified: false, source: "onchain-erc20" };
  } catch { return null; }
}
export async function buildDiscovery(ctx: VerifiedContext): Promise<Discovery> {
  const pools = ctx.indexed.pools.slice(0, 24);
  // Do not trust a third-party index for pair provenance; validate against the factory.
  const verified = await Promise.all(pools.map(async p => {
    try {
      const [pair, t0, t1, code] = await Promise.all([
        ctx.client.readContract({ address: ctx.config.factory, abi: factoryAbi, functionName: "getPair",
          args: [p.token0, p.token1], blockNumber: ctx.block }),
        ctx.client.readContract({ address: p.pair, abi: pairAbi, functionName: "token0", blockNumber: ctx.block }),
        ctx.client.readContract({ address: p.pair, abi: pairAbi, functionName: "token1", blockNumber: ctx.block }),
        ctx.client.getBytecode({ address: p.pair, blockNumber: ctx.block })
      ]);
      return eq(pair, p.pair) && eq(t0, p.token0) && eq(t1, p.token1) && !!code && code !== "0x" &&
        p.reserve0 !== null && p.reserve1 !== null ? p : null;
    } catch { return null; }
  }));
  const safe = verified.filter((p): p is (typeof pools)[number] => p !== null);
  const all = Array.from(new Set(safe.flatMap(p => [p.token0.toLowerCase(), p.token1.toLowerCase()]))) as Address[];
  const assets = (await Promise.all(all.map(a => metadata(ctx, a)))).filter((a): a is ListedToken => !!a);
  const tokens = new Map(assets.map(a => [a.address.toLowerCase(), a]));
  const listedPools: ListedPool[] = safe.flatMap(p => {
    const a = tokens.get(p.token0.toLowerCase()), b = tokens.get(p.token1.toLowerCase());
    if (!a || !b || p.reserve0 === null || p.reserve1 === null) return [];
    return [{ pair: p.pair, token0: p.token0, token1: p.token1,
      token0Symbol: a.symbol, token1Symbol: b.symbol, swaps: p.swaps, createdBlock: p.createdBlock,
      reserve0: p.reserve0, reserve1: p.reserve1,
      price0In1: quoteRatio(p.reserve0, p.reserve1, a.decimals, b.decimals),
      token0Decimals: a.decimals, token1Decimals: b.decimals }];
  });
  return { status: "indexed", chainId: ctx.config.chainId, indexedBlock: ctx.indexed.indexedBlock,
    blockHash: ctx.indexed.blockHash, includesTestBots: true,
    tokens: assets, pools: listedPools, source: "verified Lidde sandbox blocks",
    referenceUsd: null, volumeUsd: null };
}
