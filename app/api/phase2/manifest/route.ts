import { NextResponse } from "next/server";
import { erc20Abi, getAddress, isAddress, keccak256, parseAbi } from "viem";
import { probeNetwork } from "@/lib/infra/probe";
import {writesEnabled} from "@/lib/ops/release";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const routerRead = parseAbi(["function factory() view returns(address)", "function WETH() view returns(address)"]);
const validAddress = (v: string) => isAddress(v) && v.toLowerCase() !== "0x0000000000000000000000000000000000000000";
const hash = (v: string) => /^0x[0-9a-fA-F]{64}$/.test(v);

export async function GET() {
  const probe = await probeNetwork();
  if (probe.info.status !== "verified" || !probe.config || !probe.client)
    return NextResponse.json({ status: "unavailable", reason: "Pinned sandbox network is not verified." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const routerFactory = await probe.client.readContract({
      address: probe.config.router, abi: routerRead, functionName: "factory"
    });
    const wrappedNative = await probe.client.readContract({
      address: probe.config.router, abi: routerRead, functionName: "WETH"
    });
    if (routerFactory.toLowerCase() !== probe.config.factory.toLowerCase() || !validAddress(wrappedNative))
      throw new Error("The verified Router points to an unexpected Factory or wrapped token.");
    const wrappedCode = await probe.client.getBytecode({ address: wrappedNative });
    if (!wrappedCode || wrappedCode === "0x") throw new Error("Wrapped token bytecode is missing.");
    const creatorAddress = process.env.LIDDE_FUN_TOKEN_CREATOR_ADDRESS?.trim() ?? "";
    const creatorHash = process.env.LIDDE_FUN_TOKEN_CREATOR_CODE_HASH?.trim() ?? "";
    let creator: string | null = null;
    // Creator is opt-in and requires an exact pinned runtime hash.
    if (validAddress(creatorAddress) && hash(creatorHash)) {
      const code = await probe.client.getBytecode({ address: getAddress(creatorAddress) });
      if (code && code !== "0x" && keccak256(code).toLowerCase() === creatorHash.toLowerCase())
        creator = getAddress(creatorAddress);
    }
    return NextResponse.json({
      status: "verified", chainId: probe.config.chainId, rpcUrl: probe.config.rpcUrl,
      explorerUrl: probe.config.explorerUrl, genesisHash: probe.config.genesisHash,
      factory: probe.config.factory, factoryCodeHash: probe.config.factoryCodeHash,
      router: probe.config.router, routerCodeHash: probe.config.routerCodeHash,
      wrappedNative, tokenCreator: creator, tokenCreatorCodeHash: creator ? creatorHash : null,
      feeBps: 30, liveFundsAllowed: false,
      writeEnabled:writesEnabled(process.env.LIDDE_FUN_WRITES_ENABLED,process.env.LIDDE_FUN_EMERGENCY_STOP),
      // Metadata such as balance precision must be read and checked directly on-chain.
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable", reason: "Verified router bindings could not be checked." },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
