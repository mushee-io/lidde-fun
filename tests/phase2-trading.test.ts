import { test } from "node:test";
import assert from "node:assert/strict";
import { optimalLiquidity, withdrawEstimate } from "../lib/phase2/liquidity";
import { minAfterSlippage, numericSlippage, isManifest } from "../lib/phase2/wallet";

test("first-pool liquidity maintains proposed starting amounts", () => {
  assert.deepEqual(optimalLiquidity(20_000n, 50_000n, 0n, 0n), { usedA:20_000n, usedB:50_000n, firstLiquidity:true });
});
test("existing pool deposit aligns with pair reserve ratio", () => {
  assert.deepEqual(optimalLiquidity(100n, 120n, 1000n, 2000n), { usedA:60n, usedB:120n, firstLiquidity:false });
  assert.deepEqual(optimalLiquidity(100n, 500n, 1000n, 2000n), { usedA:100n, usedB:200n, firstLiquidity:false });
  assert.throws(() => optimalLiquidity(100n, 500n, 0n, 200n));
});
test("LP redemption pro-rates actual reserve assets", () => {
  assert.deepEqual(withdrawEstimate(100n, 1000n, 8000n, 20000n), { amount0:800n, amount1:2000n });
  assert.throws(() => withdrawEstimate(0n, 1000n, 8000n, 20000n));
  assert.throws(() => withdrawEstimate(100n, 0n, 8000n, 20000n));
});
test("slippage is bounded and min output cannot round to zero", () => {
  assert.equal(numericSlippage("0.5"), 50);
  assert.equal(numericSlippage("5"), 500);
  assert.throws(() => numericSlippage("0"));
  assert.throws(() => numericSlippage("10"));
  assert.equal(minAfterSlippage(10_000n, 50), 9950n);
  assert.throws(() => minAfterSlippage(1n, 500));
});
test("client signing is unavailable without a complete certified sandbox manifest", () => {
  assert.equal(isManifest({}), false);
  assert.equal(isManifest({ status:"verified",chainId:4613,liveFundsAllowed:false }),false);
});
