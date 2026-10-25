#!/usr/bin/env node
/**
 * No-go-by-default local release inventory. Reports presence of config, not
 * evidence of success; external RPC and independent wallet receipts are separate.
 * This script never prints secrets or signs transactions.
 */
import {existsSync,readFileSync} from "node:fs";
const required=[
 "LIDDE_FUN_TESTNET_CHAIN_ID","LIDDE_FUN_RPC_URL","LIDDE_FUN_EXPLORER_URL",
 "LIDDE_FUN_GENESIS_HASH","LIDDE_FUN_FACTORY_ADDRESS","LIDDE_FUN_FACTORY_CODE_HASH",
 "LIDDE_FUN_ROUTER_ADDRESS","LIDDE_FUN_ROUTER_CODE_HASH",
 "LIDDE_DEX_MARKETS_API_URL","LIDDE_FUN_QUEST_VAULT_ADDRESS",
 "LIDDE_FUN_QUEST_VAULT_CODE_HASH","QUEST_DATABASE_URL","QUEST_PUBLIC_ORIGIN",
 "LIDDE_FUN_QUEST_ATTESTOR_PRIVATE_KEY"
];
const present=required.map(key=>({key,configured:!!process.env[key]?.trim()}));
const missing=present.filter(x=>!x.configured).map(x=>x.key);
const safety={
 writeSwitch:process.env.LIDDE_FUN_WRITES_ENABLED==="true",
 emergencyStop:process.env.LIDDE_FUN_EMERGENCY_STOP==="true",
 persistentChainIndependentlyConfirmed:false,
 walletReceiptsIndependentlyConfirmed:false,
 externalAuditIndependentlyConfirmed:false,
 vercelDeploymentIndependentlyConfirmed:false
};
const noGo=missing.length>0||!safety.persistentChainIndependentlyConfirmed||
 !safety.walletReceiptsIndependentlyConfirmed||!safety.externalAuditIndependentlyConfirmed||
 !safety.vercelDeploymentIndependentlyConfirmed;
const report={
 status:noGo?"NO_GO":"GO",generatedAt:new Date().toISOString(),environmentConfiguration:present,
 safety,important:"Environment presence is not verified blockchain provenance. Independent on-chain proofs and audit must be reviewed before any public beta."
};
const json=JSON.stringify(report,null,2);
if(process.argv.includes("--json"))console.log(json);
else{
 console.log("Lidde Fun launch release: "+report.status);
 console.log("Environment entries configured: "+present.filter(x=>x.configured).length+"/"+present.length);
 console.log("Missing keys: "+(missing.join(", ")||"none"));
 console.log("External wallet, audit and deployment evidence require independent sign-off; no auto-approval.");
}
if(process.argv.includes("--strict")&&noGo)process.exitCode=1;
