import type { ListedPool, ListedToken } from "@/lib/phase2/discovery";
export type DiscoveryResponse = {
  status: string; reason?: string; indexedBlock?: string; blockHash?: string;
  chainId?: number; tokens: ListedToken[]; pools: ListedPool[];
  referenceUsd?: null; volumeUsd?: null; includesTestBots?: boolean;
};
export type PortfolioResponse = {
  status: string; reason?: string; indexedBlock?: string; chainId?: number;
  account?: string; native?: { balance: string; symbol: string; decimals: number };
  assets?: { address: string; symbol: string; decimals: number; balance: string }[];
  liquidity?: { pair: string; token0: string; token1: string; symbol0: string; symbol1: string;
    lpBalance: string; lpSupply: string; underlying0: string; underlying1: string; decimals0: number; decimals1: number }[];
  usdValue?: null; pnl?: null;
};
export async function discovery(): Promise<DiscoveryResponse> {
  const r = await fetch("/api/discovery", { cache: "no-store" });
  const data = await r.json() as DiscoveryResponse;
  if (!r.ok || data.status !== "indexed") throw new Error(data.reason || "Canonical indexed token discovery is not live.");
  return data;
}
export async function portfolio(address: string): Promise<PortfolioResponse> {
  const r = await fetch("/api/portfolio?address=" + encodeURIComponent(address), { cache: "no-store" });
  const data = await r.json() as PortfolioResponse;
  if (!r.ok || data.status !== "indexed") throw new Error(data.reason || "Wallet balances are unavailable on the unverified sandbox.");
  return data;
}
