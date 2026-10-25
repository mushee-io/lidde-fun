import {test} from "node:test";
import assert from "node:assert/strict";
import {quotaValid} from "../lib/ops/abuse";
import {writesEnabled,assessRelease,type ReleaseInput} from "../lib/ops/release";
test("rate limits must be integers, bounded, and never disabled by zero",()=>{
 assert.equal(quotaValid(5,60),true);
 for(const n of [-1,0,0.5,10001,Infinity])assert.equal(quotaValid(n,60),false);
 assert.equal(quotaValid(5,1),false);
});
test("the default mutation policy is disabled; emergency stop overrides opt-in",()=>{
 assert.equal(writesEnabled(undefined,undefined),false);
 assert.equal(writesEnabled("false",undefined),false);
 assert.equal(writesEnabled("true","true"),false);
 assert.equal(writesEnabled("true",undefined),true);
});
test("a public beta never passes without independent audit and wallets",()=>{
 const baseline:ReleaseInput={build:true,rpc:true,explorer:true,factory:true,router:true,
  faucet:true,indexer:true,vault:true,database:true,attestor:true,
  independentWalletProof:false,securityReview:false,vercel:true};
 const result=assessRelease(baseline);
 assert.equal(result.publicBeta,false);
 assert.ok(result.blockers.includes("independentWalletProof"));
});
