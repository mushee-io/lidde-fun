import { NextRequest, NextResponse } from "next/server";
import { erc20Abi, isAddress, getAddress, zeroAddress } from "viem";
import { pairAbi } from "@/lib/phase2/abis";
import { buildDiscovery } from "@/lib/phase2/discovery";
import { getVerifiedContext, MarketsUnavailable } from "@/lib/phase2/indexed";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("address") ?? "";
  if (!isAddress(value) || value.toLowerCase() === zeroAddress.toLowerCase()) {
    return NextResponse.json({ status: "invalid-address" }, { status: 400 });
  }
  try {
    const account = getAddress(value);
    const ctx = await getVerifiedContext();
    const discovery = await buildDiscovery(ctx);
    const [native, assets, liquidity] = await Promise.all([
      ctx.client.getBalance({ address: account, blockNumber: ctx.block }),
      Promise.all(discovery.tokens.map(async t => ({
        address: t.address, symbol: t.symbol, decimals: t.decimals,
        balance: (await ctx.client.readContract({ address: t.address, abi: erc20Abi, functionName: "balanceOf",
          args: [account], blockNumber: ctx.block })).toString()
      }))),
      Promise.all(discovery.pools.map(async p => {
        const [balance, supply] = await Promise.all([
          ctx.client.readContract({ address: p.pair, abi: pairAbi, functionName: "balanceOf",
            args: [account], blockNumber: ctx.block }),
          ctx.client.readContract({ address: p.pair, abi: pairAbi, functionName: "totalSupply",
            blockNumber: ctx.block })
        ]);
        return { pair: p.pair, token0: p.token0, token1: p.token1, symbol0: p.token0Symbol, symbol1: p.token1Symbol,
          lpBalance: balance.toString(), lpSupply: supply.toString(),
          underlying0: supply > 0n ? (balance * BigInt(p.reserve0) / supply).toString() : "0",
          underlying1: supply > 0n ? (balance * BigInt(p.reserve1) / supply).toString() : "0",
          decimals0: p.token0Decimals, decimals1: p.token1Decimals };
      }))
    ]);
    return NextResponse.json({
      status: "indexed", chainId: ctx.config.chainId, indexedBlock: ctx.indexed.indexedBlock,
      account, native: { balance: native.toString(), symbol: "tVERY", decimals: 18 },
      assets, liquidity, usdValue: null, pnl: null,
      note: "Read-only balances at the canonical indexed block. No synthetic USD valuation."
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ status: "unavailable",
      reason: error instanceof MarketsUnavailable ? error.reason : "Portfolio data could not be verified."
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
