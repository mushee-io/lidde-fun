/** Deterministic decision for a DB-backed, fixed-window API quota. */
export function quotaValid(max:number,windowSeconds:number):boolean {
 return Number.isSafeInteger(max)&&max>=1&&max<=10000&&Number.isSafeInteger(windowSeconds)&&windowSeconds>=10&&windowSeconds<=3600;
}
export const CHALLENGE_WALLET_MAX_PER_MINUTE=5;
export const CHALLENGE_GLOBAL_MAX_PER_MINUTE=500;
