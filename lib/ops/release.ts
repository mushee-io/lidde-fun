/** Pure, fail-closed release assessment. The checker never turns features on. */
export type ReleaseInput={
 build:boolean;rpc:boolean;explorer:boolean;factory:boolean;router:boolean;
 faucet:boolean;indexer:boolean;vault:boolean;database:boolean;attestor:boolean;
 independentWalletProof:boolean;securityReview:boolean;vercel:boolean;
};
export type ReleaseGate="preview-only"|"sandbox-infrastructure"|"sandbox-trading"|"sandbox-quests"|"controlled-beta";
export const launchChecks=[
 "build","rpc","explorer","factory","router","faucet","indexer","vault","database","attestor",
 "independentWalletProof","securityReview","vercel"
] as const;
export function assessRelease(x:ReleaseInput):{gate:ReleaseGate;blockers:string[];publicBeta:boolean}{
 const missing=launchChecks.filter(key=>!x[key]);
 const infra=x.rpc&&x.explorer&&x.factory&&x.router&&x.indexer;
 const trading=infra&&x.faucet&&x.independentWalletProof;
 const quests=trading&&x.vault&&x.database&&x.attestor;
 const beta=quests&&x.vercel&&x.securityReview&&x.build;
 const gate:ReleaseGate=beta?"controlled-beta":quests?"sandbox-quests":trading?"sandbox-trading":infra?"sandbox-infrastructure":"preview-only";
 return {gate,blockers:missing,publicBeta:beta};
}
export function writesEnabled(value:string|undefined,emergency:string|undefined){
 return value==="true"&&emergency!=="true";
}
