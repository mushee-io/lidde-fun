export function optimalLiquidity(aDesired: bigint, bDesired: bigint, reserveA: bigint, reserveB: bigint) {
  if(aDesired<=0n||bDesired<=0n) throw new Error("Both test-token amounts must be positive.");
  if(reserveA===0n && reserveB===0n) return {usedA:aDesired,usedB:bDesired,firstLiquidity:true};
  if(reserveA<=0n || reserveB<=0n) throw new Error("Pair reserves are inconsistent.");
  const bOptimal=aDesired*reserveB/reserveA;
  if(bOptimal>0n && bOptimal<=bDesired)return {usedA:aDesired,usedB:bOptimal,firstLiquidity:false};
  const aOptimal=bDesired*reserveA/reserveB;
  if(aOptimal<=0n||aOptimal>aDesired)throw new Error("Desired amounts are too small.");
  return {usedA:aOptimal,usedB:bDesired,firstLiquidity:false};
}
export function withdrawEstimate(lpBalance: bigint, supply: bigint, reserve0: bigint, reserve1: bigint) {
  if(lpBalance<=0n || supply<=0n || lpBalance>supply)throw new Error("Wallet has no redeemable LP tokens.");
  const amount0=lpBalance*reserve0/supply,amount1=lpBalance*reserve1/supply;
  if(amount0<=0n||amount1<=0n)throw new Error("LP position is too small to redeem.");
  return {amount0,amount1};
}
