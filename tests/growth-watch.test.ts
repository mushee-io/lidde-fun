import { test } from "node:test";
import assert from "node:assert/strict";
import { validateWatch } from "../lib/growth/watch";
import { rankEvidence } from "../lib/growth/scoring";
import { simulateSpot, checkAlert, fixedSix } from "../lib/growth/simulation";
const PAIR="0x3333333333333333333333333333333333333333",WALLET="0x1111111111111111111111111111111111111111";
test("watch rules reject unknown pairs, price zeros and invalid signal types",()=>{
 assert.throws(()=>validateWatch({type:"price_above",pair:"0x123",threshold:"1"}));
 assert.throws(()=>validateWatch({type:"price_above",pair:PAIR,threshold:"0"}));
 assert.throws(()=>validateWatch({type:"delete-wallet",pair:PAIR,threshold:"2"}));
 assert.throws(()=>validateWatch({type:"new_pair",pair:PAIR}));
});
test("new-pair rule is factory-wide; pricing is precise",()=>{
 const x=validateWatch({type:"new_pair"});
 assert.equal(x.type,"new_pair");assert.equal(x.thresholdSix,null);
 const y=validateWatch({type:"price_above",pair:PAIR,threshold:"1.001"});
 assert.equal(y.thresholdSix,1001000n);
 assert.equal(checkAlert("price_above",fixedSix("1.001"),fixedSix("1.001"),1n,0n),false);
 assert.equal(checkAlert("price_above",fixedSix("1.002"),fixedSix("1.001"),1n,0n),true);
});
test("unverified scores and wallets without opt-in do not rank",()=>{
 const now=Date.UTC(2026,9,24);
 const entries=[
  {wallet:WALLET,eventId:"valid",at:now,xp:100,type:"quest_claim" as const},
  {wallet:WALLET,eventId:"invalid",at:now,xp:1000000,type:"quest_claim" as const},
 ];
 assert.equal(rankEvidence(entries,[{wallet:WALLET,nickname:null,public:false}],"all",now+1).length,0);
 assert.equal(rankEvidence(entries,[{wallet:WALLET,nickname:null,public:true}],"all",now+1)[0].xp,100);
});
test("research cannot underflow reserve or accept arbitrary oversized slippage",()=>{
 assert.throws(()=>simulateSpot(10n,10n,10n,30,600));
 assert.throws(()=>simulateSpot(10n,10n,2n**255n,30,50));
});
