import {test} from "node:test";
import assert from "node:assert/strict";
import {SCALE,evaluateRisk,scenarioRisk,asFixed8,formatFixed8,RiskRejected} from "../lib/perps/risk";
const base={
 direction:"long" as const,collateral:100n*SCALE,leverage:5n,
 entryPrice:100n*SCALE,markPrice:100n*SCALE,
 maintenanceBps:500n,openFeeBps:10n,oracleTimestamp:1000n,now:1010n
};
test("fixed-point parser rejects fractional overflow and negative values",()=>{
 assert.equal(asFixed8("1.125"),112500000n);
 assert.equal(formatFixed8(-112500000n),"-1.125");
 assert.throws(()=>asFixed8("1.000000001"),RiskRejected);
 assert.throws(()=>asFixed8("-3"),RiskRejected);
});
test("leverage, collateral and liquidity assumptions are capped",()=>{
 for(const leverage of [0n,11n])assert.throws(()=>evaluateRisk({...base,leverage}),RiskRejected);
 assert.throws(()=>evaluateRisk({...base,collateral:0n}),RiskRejected);
 assert.throws(()=>evaluateRisk({...base,maintenanceBps:0n}),RiskRejected);
});
test("stale oracle and future dated oracle do not calculate",()=>{
 assert.throws(()=>evaluateRisk({...base,now:1100n}),/stale/);
 assert.throws(()=>evaluateRisk({...base,oracleTimestamp:2000n}),/stale/);
});
test("long liquidation stress and short upside liquidation are sign-correct",()=>{
 const decline=evaluateRisk({...base,markPrice:80n*SCALE});
 assert.equal(decline.notional,500n*SCALE);
 assert.ok(decline.unrealizedPnl<0n);
 assert.equal(decline.liquidatable,true);
 const short=evaluateRisk({...base,direction:"short",markPrice:120n*SCALE});
 assert.equal(short.liquidatable,true);
 const shortProfit=evaluateRisk({...base,direction:"short",markPrice:80n*SCALE});
 assert.ok(shortProfit.equity>100n*SCALE);
});
test("returns five deterministic nonsettling stress scenarios",()=>{
 const {markPrice,...rest}=base;void markPrice;
 const outcomes=scenarioRisk(rest);
 assert.equal(outcomes.length,5);
 assert.equal(outcomes[2].changeBps,0n);
 assert.ok(outcomes[0].equity<outcomes[4].equity);
});
