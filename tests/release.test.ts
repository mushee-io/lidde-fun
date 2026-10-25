import {test} from "node:test";
import assert from "node:assert/strict";
import {assessRelease,writesEnabled,type ReleaseInput} from "../lib/ops/release";
const none:ReleaseInput={build:false,rpc:false,explorer:false,factory:false,router:false,
 faucet:false,indexer:false,vault:false,database:false,attestor:false,
 independentWalletProof:false,securityReview:false,vercel:false};
test("zero infrastructure always preview-only",()=>{
 const result=assessRelease(none);assert.equal(result.gate,"preview-only");
 assert.equal(result.publicBeta,false);assert.ok(result.blockers.includes("rpc"));
});
test("testnet path does not imply public beta",()=>{
 const infra={...none,rpc:true,explorer:true,factory:true,router:true,indexer:true};
 assert.equal(assessRelease(infra).gate,"sandbox-infrastructure");
 const withTrading={...infra,faucet:true,independentWalletProof:true};
 assert.equal(assessRelease(withTrading).gate,"sandbox-trading");
 assert.equal(assessRelease({...withTrading,vault:true,database:true,attestor:true}).gate,"sandbox-quests");
 assert.equal(assessRelease({...withTrading,vault:true,database:true,attestor:true,securityReview:true,vercel:true,build:true}).publicBeta,true);
});
test("emergency stop overrides opted-in testnet signing",()=>{
 assert.equal(writesEnabled(undefined,undefined),false);
 assert.equal(writesEnabled("true","true"),false);
 assert.equal(writesEnabled("true",undefined),true);
});
