"use client";
import { createPublicClient, createWalletClient, custom, defineChain, http, keccak256, type Address, type Hex } from "viem";

export type SandboxManifest = {
  status: "verified"; chainId: number; rpcUrl: string; explorerUrl: string;
  genesisHash: Hex; factory: Address; factoryCodeHash: Hex;
  router: Address; routerCodeHash: Hex; wrappedNative: Address;
  tokenCreator: Address | null; tokenCreatorCodeHash: Hex | null;
  feeBps: number; liveFundsAllowed: false; writeEnabled:boolean;
};
const validHash = (value: string) => /^0x[0-9a-fA-F]{64}$/.test(value);
export function isManifest(raw: unknown): raw is SandboxManifest {
  if (!raw || typeof raw !== "object") return false;
  const x = raw as Record<string, unknown>;
  return x.status === "verified" && typeof x.chainId === "number" &&
    x.chainId > 1000 && x.chainId !== 4613 &&
    x.liveFundsAllowed === false && x.feeBps === 30 && typeof x.writeEnabled === "boolean" &&
    ["rpcUrl", "explorerUrl", "factory", "router", "wrappedNative"].every(k => typeof x[k] === "string") &&
    ["genesisHash", "factoryCodeHash", "routerCodeHash"].every(k => typeof x[k] === "string" && validHash(x[k] as string));
}
export async function loadManifest(): Promise<SandboxManifest> {
  const response = await fetch("/api/phase2/manifest", { cache: "no-store" });
  const data: unknown = await response.json();
  if (!response.ok || !isManifest(data)) throw new Error("A verified, isolated Lidde testnet is not ready. Wallet writes are disabled.");
  return data;
}
export function sandboxChain(manifest: SandboxManifest) {
  return defineChain({
    id: manifest.chainId, name: "Lidde isolated sandbox", testnet: true,
    nativeCurrency: { name: "Test VERY (valueless)", symbol: "tVERY", decimals: 18 },
    rpcUrls: { default: { http: [manifest.rpcUrl] } },
    blockExplorers: { default: { name: "Lidde Test Explorer", url: manifest.explorerUrl } }
  });
}
export function readSandbox(manifest: SandboxManifest) {
  return createPublicClient({ chain: sandboxChain(manifest), transport: http(manifest.rpcUrl, { timeout: 8500, retryCount: 0 }) });
}
type Ethereum = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
export function browserProvider(): Ethereum {
  if (typeof window === "undefined") throw new Error("Use a browser to connect a wallet.");
  const provider = (window as Window & { ethereum?: Ethereum }).ethereum;
  if (!provider) throw new Error("Install an EVM wallet and connect your account first.");
  return provider;
}
export async function verifiedWallet(manifest: SandboxManifest) {
  if(!manifest.writeEnabled)throw new Error("Operator has disabled wallet transactions.");
  const current=await loadManifest();
  if(!current.writeEnabled||current.chainId!==manifest.chainId||current.genesisHash.toLowerCase()!==manifest.genesisHash.toLowerCase())
   throw new Error("Network or write policy changed; signing cancelled.");
  const provider = browserProvider();
  const accountResult = await provider.request({ method: "eth_requestAccounts" });
  const accountValue = Array.isArray(accountResult) ? accountResult[0] : null;
  if (typeof accountValue !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(accountValue))
    throw new Error("Connected wallet did not return a valid EVM address.");
  const account = accountValue as Address;
  const network = await provider.request({ method: "eth_chainId" });
  if (typeof network !== "string" || Number.parseInt(network, 16) !== manifest.chainId)
    throw new Error("Wrong wallet chain. Select the verified valueless Lidde sandbox in your wallet.");
  const client = readSandbox(manifest);
  const [remoteChain, genesis, factoryCode, routerCode] = await Promise.all([
    client.getChainId(), client.getBlock({ blockNumber: 0n }),
    client.getBytecode({ address: manifest.factory }), client.getBytecode({ address: manifest.router })
  ]);
  if (remoteChain !== manifest.chainId || !genesis.hash ||
    genesis.hash.toLowerCase() !== manifest.genesisHash.toLowerCase() ||
    !factoryCode || !routerCode || factoryCode === "0x" || routerCode === "0x" ||
    keccak256(factoryCode).toLowerCase() !== manifest.factoryCodeHash.toLowerCase() ||
    keccak256(routerCode).toLowerCase() !== manifest.routerCodeHash.toLowerCase())
    throw new Error("Sandbox RPC contract or chain fingerprints changed. Signing blocked.");
  const wallet = createWalletClient({
    account, chain: sandboxChain(manifest),
    transport: custom(provider as Parameters<typeof custom>[0])
  });
  return { account, client, wallet };
}
export async function verifyCreator(manifest: SandboxManifest, client: ReturnType<typeof readSandbox>) {
  if (!manifest.tokenCreator || !manifest.tokenCreatorCodeHash)
    throw new Error("Lidde sandbox token creator is not pinned and verified.");
  const code = await client.getBytecode({ address: manifest.tokenCreator });
  if (!code || code === "0x" || keccak256(code).toLowerCase() !== manifest.tokenCreatorCodeHash.toLowerCase())
    throw new Error("Demo token creator bytecode does not match the approved deployment.");
  return manifest.tokenCreator;
}
export function numericSlippage(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0.1 || n > 5) throw new Error("Slippage must be between 0.1% and 5%.");
  return Math.round(n * 100);
}
export function minAfterSlippage(value: bigint, bps: number): bigint {
  if (value <= 0n || bps < 10 || bps > 500) throw new Error("Invalid slippage protection.");
  const result = value * BigInt(10000 - bps) / 10000n;
  if (result <= 0n) throw new Error("Minimum output would be zero.");
  return result;
}
