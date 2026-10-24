import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptableEndpoint, parseNetworkConfig } from "../lib/infra/config";
import { parseIndexedMarkets } from "../lib/infra/markets";
const hash = (n: string) => "0x" + n.repeat(64);
const addr = (n: string) => ("0x" + n.repeat(40)) as `0x${string}`;
const environment = {
  LIDDE_FUN_TESTNET_CHAIN_ID: "9876543",
  LIDDE_FUN_RPC_URL: "https://sandbox.example.test/rpc",
  LIDDE_FUN_EXPLORER_URL: "https://sandbox.example.test/explorer",
  LIDDE_FUN_GENESIS_HASH: hash("a"),
  LIDDE_FUN_FACTORY_ADDRESS: addr("1"),
  LIDDE_FUN_FACTORY_CODE_HASH: hash("b"),
  LIDDE_FUN_ROUTER_ADDRESS: addr("2"),
  LIDDE_FUN_ROUTER_CODE_HASH: hash("c")
};
test("isolated chain manifest must be explicitly complete", () => {
  const missing = parseNetworkConfig({});
  assert.equal(missing.config, null);
  assert.ok(missing.errors.length > 0);
});
test("well-formed pinned chain is accepted for subsequent RPC verification", () => {
  const good = parseNetworkConfig(environment);
  assert.equal(good.errors.length, 0);
  assert.equal(good.config?.chainId, 9876543);
});
test("mainnet chain 4613 is never a valid testnet configuration", () => {
  const result = parseNetworkConfig({ ...environment, LIDDE_FUN_TESTNET_CHAIN_ID: "4613" });
  assert.equal(result.config, null);
});
test("wrong codehash and duplicate contracts fail closed", () => {
  const invalid = parseNetworkConfig({
    ...environment, LIDDE_FUN_FACTORY_CODE_HASH: "bad",
    LIDDE_FUN_ROUTER_ADDRESS: addr("1")
  });
  assert.equal(invalid.config, null);
});
test("configured URLs reject credentials, fragments and non-HTTPS", () => {
  assert.equal(acceptableEndpoint("http://example.com/rpc", false), false);
  assert.equal(acceptableEndpoint("https://user:pass@example.com"), false);
  assert.equal(acceptableEndpoint("https://example.com/#fragment"), false);
  assert.equal(acceptableEndpoint("https://example.com/rpc"), true);
  assert.equal(acceptableEndpoint("http://localhost:8545", true), true);
});
const indexed = {
  status: "indexed", chainId: 9876543, factory: addr("1"), canonicalBlock: "32",
  canonicalBlockHash: hash("a"), indexedAt: "2026-10-24T20:00:00Z",
  counters: { swap_events: 8 },
  markets: [{
    pair_address: addr("3"), token0: addr("4"), token1: addr("5"),
    created_block: "10", swap_count: 8, reserve0: "10000000", reserve1: "5000000"
  }]
};
const expected = { chainId: 9876543, factory: addr("1") };
test("canonical market snapshot schema accepts valid indexed source", () => {
  const parsed = parseIndexedMarkets(indexed, expected);
  assert.equal(parsed?.pools.length, 1);
  assert.equal(parsed?.swapEvents, 8);
  assert.equal(parsed?.includesTestBots, true);
});
test("unindexed, wrong chain and wrong factory snapshots are rejected", () => {
  assert.equal(parseIndexedMarkets({ ...indexed, status: "not-configured" }, expected), null);
  assert.equal(parseIndexedMarkets({ ...indexed, chainId: 4613 }, expected), null);
  assert.equal(parseIndexedMarkets({ ...indexed, factory: addr("6") }, expected), null);
});
test("malformed, duplicate and negative pool records are rejected", () => {
  assert.equal(parseIndexedMarkets({ ...indexed, markets: [{ ...indexed.markets[0], swap_count: -1 }] }, expected), null);
  assert.equal(parseIndexedMarkets({ ...indexed, markets: [indexed.markets[0], indexed.markets[0]] }, expected), null);
  assert.equal(parseIndexedMarkets({ ...indexed, markets: [{ ...indexed.markets[0], reserve0: "bad" }] }, expected), null);
  assert.equal(parseIndexedMarkets({ ...indexed, canonicalBlockHash: "0xbad" }, expected), null);
});
