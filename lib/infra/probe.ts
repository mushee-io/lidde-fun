import { createPublicClient, http, keccak256, type PublicClient } from "viem";
import { networkFromEnv, type NetworkConfig } from "@/lib/infra/config";

export type NetworkStatus = {
  status: "not-configured" | "unavailable" | "mismatch" | "verified";
  chainId: number | null;
  block: string | null;
  explorerUrl: string | null;
  factory: string | null;
  router: string | null;
  verifiedAt: string;
  message: string;
};
export const createClient = (config: NetworkConfig) => createPublicClient({
  transport: http(config.rpcUrl, { timeout: 6500, retryCount: 0, batch: false })
});
export async function probeNetwork(): Promise<{ info: NetworkStatus; config: NetworkConfig | null; client: PublicClient | null }> {
  const now = new Date().toISOString();
  const { config } = networkFromEnv();
  const failure = (status: NetworkStatus["status"], message: string) => ({
    info: { status, chainId: null, block: null, explorerUrl: null,
      factory: null, router: null, verifiedAt: now, message }, config: null, client: null
  });
  if (!config) return failure("not-configured", "Pinned isolated testnet network and code hashes have not been configured.");
  try {
    const client = createClient(config);
    const [chainId, genesis, factoryCode, routerCode, block] = await Promise.all([
      client.getChainId(),
      client.getBlock({ blockNumber: 0n }),
      client.getBytecode({ address: config.factory }),
      client.getBytecode({ address: config.router }),
      client.getBlockNumber()
    ]);
    if (chainId !== config.chainId || !genesis.hash ||
      genesis.hash.toLowerCase() !== config.genesisHash.toLowerCase() ||
      !factoryCode || factoryCode === "0x" ||
      !routerCode || routerCode === "0x" ||
      keccak256(factoryCode).toLowerCase() !== config.factoryCodeHash.toLowerCase() ||
      keccak256(routerCode).toLowerCase() !== config.routerCodeHash.toLowerCase())
      return failure("mismatch", "RPC chain identity or pinned contract bytecode verification failed.");
    return {
      info: { status: "verified", chainId, block: block.toString(), explorerUrl: config.explorerUrl,
        factory: config.factory, router: config.router, verifiedAt: now,
        message: "RPC identity and pinned contract code hashes match the configured isolated chain." },
      config, client
    };
  } catch {
    return failure("unavailable", "Configured testnet RPC could not be verified.");
  }
}
