import { getAddress, isAddress, zeroAddress, type Address, type Hex } from "viem";

export type NetworkConfig = {
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  genesisHash: Hex;
  factory: Address;
  factoryCodeHash: Hex;
  router: Address;
  routerCodeHash: Hex;
};
const MAINNET_CHAIN_IDS = new Set([1, 10, 56, 137, 42161, 43114, 8453, 4613]);
const isHash = (v: string): v is Hex => /^0x[0-9a-fA-F]{64}$/.test(v);
const isLocalhost = (name: string) => ["localhost", "127.0.0.1", "[::1]"].includes(name);
export function acceptableEndpoint(value: string, allowLoopback = false): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    return url.protocol === "https:" ||
      (allowLoopback && url.protocol === "http:" && isLocalhost(url.hostname));
  } catch { return false; }
}

export function parseNetworkConfig(env: Record<string, string | undefined>): {
  config: NetworkConfig | null; errors: string[];
} {
  const errors: string[] = [];
  const chainId = Number(env.LIDDE_FUN_TESTNET_CHAIN_ID);
  if (!Number.isSafeInteger(chainId) || chainId <= 1000 || MAINNET_CHAIN_IDS.has(chainId))
    errors.push("A unique isolated non-mainnet chain ID is required.");
  const rpcUrl = env.LIDDE_FUN_RPC_URL?.trim() ?? "";
  const explorerUrl = env.LIDDE_FUN_EXPLORER_URL?.trim() ?? "";
  if (!acceptableEndpoint(rpcUrl, true)) errors.push("A valid HTTPS RPC URL is required (loopback HTTP permitted for local development).");
  if (!acceptableEndpoint(explorerUrl, true)) errors.push("A valid testnet explorer URL is required.");
  const genesisHash = env.LIDDE_FUN_GENESIS_HASH?.trim() ?? "";
  const factoryCodeHash = env.LIDDE_FUN_FACTORY_CODE_HASH?.trim() ?? "";
  const routerCodeHash = env.LIDDE_FUN_ROUTER_CODE_HASH?.trim() ?? "";
  if (![genesisHash, factoryCodeHash, routerCodeHash].every(isHash))
    errors.push("Pinned genesis, factory bytecode and router bytecode hashes are required.");
  const factory = env.LIDDE_FUN_FACTORY_ADDRESS?.trim() ?? "";
  const router = env.LIDDE_FUN_ROUTER_ADDRESS?.trim() ?? "";
  if (![factory, router].every(a => isAddress(a) && a.toLowerCase() !== zeroAddress.toLowerCase()) ||
    (factory && router && factory.toLowerCase() === router.toLowerCase()))
    errors.push("Unique nonzero EVM Factory and Router addresses are required.");
  if (errors.length) return { config: null, errors };
  return { config: {
    chainId, rpcUrl, explorerUrl, genesisHash: genesisHash as Hex,
    factory: getAddress(factory), factoryCodeHash: factoryCodeHash as Hex,
    router: getAddress(router), routerCodeHash: routerCodeHash as Hex
  }, errors };
}

export const networkFromEnv = () => parseNetworkConfig(process.env);
