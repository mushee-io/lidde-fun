import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDraft, normalizedWallet, isUuid } from "../lib/quests/rules";
const wallet="0x1111111111111111111111111111111111111111";
const token="0x2222222222222222222222222222222222222222";
const pair="0x3333333333333333333333333333333333333333";
const good=()=>{
 const now=Date.now();
 return {
  title:"Hold test tokens and participate",
  description:"A zero-value sandbox campaign requiring verified on-chain activity.",
  creator:wallet,token,rewardEachRaw:"1000000000000000000",maxClaims:25,
  startsAt:new Date(now+120000).toISOString(),endsAt:new Date(now+86400000).toISOString(),
  tasks:[{kind:"hold",token,minRaw:"100000000000000000"}]
 };
};
test("normalizes EVM creator addresses",()=>{
 assert.equal(normalizedWallet(wallet),wallet);
 assert.throws(()=>normalizedWallet("not-wallet"));
});
test("validates a capped hold quest",()=>{
 const d=validateDraft(good());
 assert.equal(d.tasks.length,1);
 assert.equal(d.maxClaims,25);
 assert.equal(d.rewardEachRaw,"1000000000000000000");
});
test("supports token-specific swap and canonical LP task declarations",()=>{
 const x=good();
 x.tasks=[
  {kind:"hold",token,minRaw:"1"},
  {kind:"swap",token,pair,minRaw:"100"},
  {kind:"lp",pair,minRaw:"500"}
 ] as typeof x.tasks;
 assert.deepEqual(validateDraft(x).tasks.map(t=>t.kind),["hold","swap","lp"]);
});
test("rejects unlimited claim budgets and incorrect reward quantity",()=>{
 assert.throws(()=>validateDraft({...good(),maxClaims:100000000}));
 assert.throws(()=>validateDraft({...good(),rewardEachRaw:"0"}));
 assert.throws(()=>validateDraft({...good(),rewardEachRaw:"1.5"}));
});
test("rejects unsupported social and screenshot reward evidence",()=>{
 const x=good();
 x.tasks=[{kind:"follow",token,minRaw:"1"}] as typeof x.tasks;
 assert.throws(()=>validateDraft(x));
});
test("rejects swap proofs with no actual output token or pair",()=>{
 const x=good();
 x.tasks=[{kind:"swap",minRaw:"1"}] as typeof x.tasks;
 assert.throws(()=>validateDraft(x));
});
test("requires future bounded schedule and no more than five steps",()=>{
 const d=good();d.endsAt=d.startsAt;
 assert.throws(()=>validateDraft(d));
 const many=good();many.tasks=Array(6).fill({kind:"hold",token,minRaw:"1"});
 assert.throws(()=>validateDraft(many));
});
test("accepts PostgreSQL UUID identifiers but rejects arbitrary keys",()=>{
 assert.ok(isUuid("c1748a84-f62e-48a2-a711-7f2bf8adcfd4"));
 assert.equal(isUuid("select * from quests"),false);
});
