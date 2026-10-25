import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
const config=readFileSync("next.config.mjs","utf8");
for(const header of ["X-Frame-Options","X-Content-Type-Options","Permissions-Policy","Referrer-Policy","Content-Security-Policy"]){
 assert.ok(config.includes(header),"Missing mandatory app header "+header);
}
const middleware=readFileSync("middleware.ts","utf8");
assert.ok(middleware.includes("LIDDE_FUN_EMERGENCY_STOP"),"Emergency write brake absent");
assert.ok(middleware.includes("503"),"Write brake must fail closed");
const manifest=readFileSync("app/api/phase2/manifest/route.ts","utf8");
assert.ok(manifest.includes("writeEnabled"),"Wallet manifest missing safety gate");
console.log("PASS: static release security invariants; no external browser claims made.");
