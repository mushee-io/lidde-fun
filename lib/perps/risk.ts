/**
 * M18: isolated, read-only leveraged market R&D. NO trade signing, oracle feeds,
 * position storage, funding collection, keeper, settlement or deployment.
 * All money/price values are integer 1e8 fixed point.
 */
export const SCALE=100_000_000n;
export const MAX_LEVERAGE=10n;
export const MAX_ORACLE_AGE_SECONDS=30n;
export type Direction="long"|"short";
export type RiskInput={
  direction:Direction;
  collateral:bigint; // collateral 1e8 units
  leverage:bigint;
  entryPrice:bigint; // quote per unit, 1e8
  markPrice:bigint;
  maintenanceBps:bigint;
  openFeeBps:bigint;
  oracleTimestamp:bigint;
  now:bigint;
};
export type RiskState={
 notional:bigint; initialMargin:bigint; unrealizedPnl:bigint;
 equity:bigint; requiredMaintenance:bigint; estimatedOpenFee:bigint;
 liquidatable:boolean; marginRatioBps:bigint | null; oracleAgeSeconds:bigint;
};
export class RiskRejected extends Error {}
export function evaluateRisk(x:RiskInput):RiskState {
 if(x.direction!=="long"&&x.direction!=="short")throw new RiskRejected("Unsupported direction");
 if(x.collateral<=0n||x.collateral>10n**22n||
    x.entryPrice<=0n||x.entryPrice>10n**20n||x.markPrice<=0n||x.markPrice>10n**20n)
   throw new RiskRejected("Prices and collateral must be positive and bounded");
 if(x.leverage<1n||x.leverage>MAX_LEVERAGE)
   throw new RiskRejected("Research leverage must be between 1x and 10x");
 if(x.maintenanceBps<100n||x.maintenanceBps>1000n||x.openFeeBps<0n||x.openFeeBps>100n)
   throw new RiskRejected("Unsafe maintenance or fee assumptions");
 if(x.oracleTimestamp>x.now||x.now-x.oracleTimestamp>MAX_ORACLE_AGE_SECONDS)
   throw new RiskRejected("Reference mark is missing or stale; calculation must fail closed");
 const notional=x.collateral*x.leverage;
 const signedChange=(x.markPrice-x.entryPrice)*(x.direction==="long"?1n:-1n);
 const unrealizedPnl=notional*signedChange/x.entryPrice;
 const estimatedOpenFee=notional*x.openFeeBps/10_000n;
 const equity=x.collateral+unrealizedPnl-estimatedOpenFee;
 const requiredMaintenance=notional*x.maintenanceBps/10_000n;
 return {
   notional,initialMargin:x.collateral,unrealizedPnl,equity,estimatedOpenFee,
   requiredMaintenance,liquidatable:equity<=requiredMaintenance,
   marginRatioBps:equity>0n?equity*10_000n/notional:0n,
   oracleAgeSeconds:x.now-x.oracleTimestamp
 };
}
export function scenarioRisk(x:Omit<RiskInput,"markPrice">,stepBps=500n){
 if(stepBps<=0n||stepBps>2000n)throw new RiskRejected("Invalid stress interval");
 return [-2n,-1n,0n,1n,2n].map(multiplier=>{
   const bps=10_000n+multiplier*stepBps;
   if(bps<=0n)throw new RiskRejected("Invalid stress price");
   const simulatedPrice=x.entryPrice*bps/10_000n;
   return {changeBps:multiplier*stepBps,markPrice:simulatedPrice,...evaluateRisk({...x,markPrice:simulatedPrice})};
 });
}
export function asFixed8(value:string):bigint{
 if(!/^(0|[1-9]\d{0,12})(?:\.\d{1,8})?$/.test(value))throw new RiskRejected("Enter at most eight decimal places");
 const [a,b=""]=value.split(".");
 return BigInt(a)*SCALE+BigInt(b.padEnd(8,"0")||"0");
}
export function formatFixed8(x:bigint):string{
 const sign=x<0n?"-":"",u=x<0n?-x:x;
 const fraction=(u%SCALE).toString().padStart(8,"0").replace(/0+$/,"");
 return sign+(u/SCALE).toString()+(fraction?"."+fraction:"");
}
