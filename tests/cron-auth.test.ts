import {test} from "node:test";
import assert from "node:assert/strict";
import {allowedCronAuthorization} from "../lib/ops/cron-auth";
const key="local-test-credential-do-not-publish-0001";
test("cron auth requires a provisioned long secret and constant-time match",()=>{
 assert.equal(allowedCronAuthorization("Bearer "+key,key),true);
 assert.equal(allowedCronAuthorization("Bearer "+key,key+"extra"),false);
 assert.equal(allowedCronAuthorization("Bearer "+key,undefined),false);
 assert.equal(allowedCronAuthorization("Bearer "+key,"short"),false);
 assert.equal(allowedCronAuthorization(null,key),false);
 assert.equal(allowedCronAuthorization("Basic "+key,key),false);
});
