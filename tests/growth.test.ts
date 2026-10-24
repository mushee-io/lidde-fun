import {test} from "node:test";
import assert from "node:assert/strict";
import {periodStart,periodLabel,rankEvidence,CLAIM_XP} from "../lib/growth/scoring";
import {checkAlert,fixedSix,simulateSpot,formatFixedSix} from "../lib/growth/simulation";
const A="0x1111111111111111111111111111111111111111",B="0x2222222222222222222222222222222222222222";
test("same confirmed quest event counted once even when replayed",()=>{
 const at=Date.UTC(2026,9,24),e={wallet:A,eventId:"4614:0xabc:0",at,xp:CLAIM_XP,type:"quest_claim" as const};
 const p=[{wallet:A,nickname:"Alpha",public:true},{wallet:B,nickname:null,public:false}];
 const result=rankEvidence([e,e,{...e,wallet:B,eventId:"2"}],p,"all",at+100);
 assert.deepEqual(result,[{rank:1,wallet:A.toLowerCase(),nickname:"Alpha",xp:100,claims:1}]);
});
test("ties are deterministic by canonical lowercase wallet, never volume",()=>{
 const now=Date.UTC(2026,9,24);
 const profiles=[A,B].map(wallet=>({wallet,nickname:null,public:true}));
 const events=[{wallet:B,eventId:"b",at:now,xp:100,type:"quest_claim" as const},{wallet:A,eventId:"a",at:now,xp:100,type:"quest_claim" as const}];
 const first=rankEvidence(events,profiles,"week",now+100);
 assert.deepEqual(first.map(r=>r.wallet),[A.toLowerCase(),B.toLowerCase()]);
 assert.deepEqual(rankEvidence(events.reverse(),profiles,"week",now+100),first);
});
test("UTC ISO week Monday, calendar month and quarter seasons",()=>{
 const now=Date.UTC(2026,9,24);
 assert.equal(new Date(periodStart("week",now)).toISOString(),"2026-10-19T00:00:00.000Z");
 assert.equal(new Date(periodStart("month",now)).toISOString(),"2026-10-01T00:00:00.000Z");
 assert.equal(new Date(periodStart("season",now)).toISOString(),"2026-10-01T00:00:00.000Z");
 assert.equal(periodLabel("season",now),"2026 Q4");
});
test("constant product calculations never return reserve draining or fake zero",()=>{
 const q=simulateSpot(1_000_000n,2_000_000n,10_000n);
 assert.ok(q.amountOut>0n&&q.amountOut<20_000n);
 assert.ok(q.minimumOut<q.amountOut);
 assert.ok(q.priceImpactBps>=30);
 assert.throws(()=>simulateSpot(0n,1000n,10n));
 assert.throws(()=>simulateSpot(1n,1n,1n));
 assert.throws(()=>simulateSpot(100n,100n,1n,30,1000));
});
test("fixed decimal ratios and alert crosses enforce exact safety",()=>{
 assert.equal(fixedSix("1.234567"),1234567n);
 assert.equal(formatFixedSix(1234567n),"1.234567");
 assert.throws(()=>fixedSix("NaN"));assert.throws(()=>fixedSix("0"));assert.throws(()=>fixedSix("1.2345678"));
 assert.equal(checkAlert("price_below",fixedSix("0.5"),fixedSix("1"),1n,2n),true);
 assert.equal(checkAlert("new_pair",null,null,9n,10n),false);
 assert.equal(checkAlert("new_pair",null,null,11n,10n),true);
});
