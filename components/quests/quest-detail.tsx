"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Gift, ShieldAlert, Wallet } from "lucide-react";
import { isAddress, type Address, type Hash, type Hex } from "viem";
import { vaultAbi } from "@/lib/quests/vault-abi";
import { connectedAddress, parseApi, questVaultWallet, signedQuestChallenge, type PublicQuest } from "@/lib/quests/browser";
type Listing={status:string;campaigns:PublicQuest[]};
type ClaimProof={
 status:string;wallet:Address;chainId:number;vault:Address;onchainId:string;
 evidenceHash:Hex;nonce:string;deadline:string;signature:Hex;
 proofs:{task:number;kind:string;block:string}[];
};
export function QuestDetail({id}:{id:string}){
 const [quest,setQuest]=useState<PublicQuest|null>(null);
 const [error,setError]=useState(""),[message,setMessage]=useState("Checking on-chain quest funding…");
 const [wallet,setWallet]=useState<Address|null>(null),[txHashes,setTxHashes]=useState<Record<number,string>>({});
 const [authorization,setAuthorization]=useState<ClaimProof|null>(null);
 const [busy,setBusy]=useState(false),[transaction,setTransaction]=useState<Hash|null>(null),[explorer,setExplorer]=useState("");
 async function refresh(){
  setBusy(true);setError("");
  try{
   const data=await parseApi<Listing>("/api/quests");
   const found=data.campaigns.find(x=>x.id===id);
   if(!found)throw new Error("This quest is not verified in the public on-chain registry. Unfunded drafts are not claimable.");
   setQuest(found);setMessage("");
  }catch(e){setQuest(null);setMessage(e instanceof Error?e.message:"Quest unavailable.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void refresh();},[id]);
 async function connect(){
  setBusy(true);setError("");
  try{const address=await connectedAddress();setWallet(address);}
  catch(e){setError(e instanceof Error?e.message:"Could not connect wallet.");}
  finally{setBusy(false);}
 }
 async function verify(){
  setBusy(true);setError("");setAuthorization(null);
  try{
   if(!quest)throw new Error("Quest is not publicly verified.");
   if(quest.state!=="active")throw new Error("Only active funded campaigns issue claim authorizations.");
   const address=await connectedAddress();setWallet(address);
   const proofInputs=quest.tasks.map((t,i)=>({
    txHash:t.kind==="swap"?txHashes[i]:undefined
   }));
   const auth=await signedQuestChallenge(address,"verify-quest");
   const result=await parseApi<ClaimProof>("/api/quests/attest",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:quest.id,wallet:address,proofs:proofInputs,...auth})
   });
   if(result.status!=="eligible"||result.wallet.toLowerCase()!==address.toLowerCase()||
     result.vault.toLowerCase()!==quest.vault.toLowerCase()||
     result.chainId!==quest.chainId||result.onchainId!==quest.onchainId)
     throw new Error("Attestation does not match the connected wallet and chain campaign.");
   setAuthorization(result);setMessage("All on-chain task proofs passed. Claim authorization expires in a short window.");
  }catch(e){setError(e instanceof Error?e.message:"Task eligibility could not be verified.");}
  finally{setBusy(false);}
 }
 async function claim(){
  setBusy(true);setError("");setTransaction(null);
  try{
   if(!authorization||!quest)throw new Error("Verify every quest task first.");
   if(BigInt(authorization.deadline)<=BigInt(Math.floor(Date.now()/1000)))
    throw new Error("Authorization expired. Request a new signed proof.");
   const {account,client,wallet:signer,config,manifest}=await questVaultWallet();
   if(account.toLowerCase()!==authorization.wallet.toLowerCase()||
     config.chainId!==authorization.chainId||
     config.vault.toLowerCase()!==authorization.vault.toLowerCase())
     throw new Error("Wrong signing wallet or escrow deployment.");
   const campaignId=BigInt(authorization.onchainId);
   const claimable=await client.readContract({address:config.vault,abi:vaultAbi,functionName:"isClaimable",
    args:[campaignId,account]});
   if(!claimable)throw new Error("Escrow no longer accepts this campaign claim.");
   const sim=await client.simulateContract({account,address:config.vault,abi:vaultAbi,functionName:"claim",
    args:[campaignId,authorization.evidenceHash,BigInt(authorization.nonce),
     BigInt(authorization.deadline),authorization.signature]});
   const hash=await signer.writeContract(sim.request);
   setTransaction(hash);setExplorer(manifest.explorerUrl);
   setMessage("Claim sent to QuestEscrow. Waiting for on-chain confirmation.");
   const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
   if(receipt.status!=="success")throw new Error("Reward claim reverted.");
   setAuthorization(null);
   setMessage("Sandbox reward claim confirmed on-chain in block "+receipt.blockNumber.toString()+".");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Claim transaction failed.");}
  finally{setBusy(false);}
 }
 return <div className="quest-detail-wrap"><Link href="/quests" className="quest-create-link"><ArrowLeft size={15}/> Quest directory</Link>
  {message&&<div className="quest-live-alert" role="status"><Gift size={22}/><p>{message}</p></div>}
  {quest&&<div className="quest-create-grid">
   <section className="quest-create-panel">
    <div className="quest-detail-top"><span>{quest.state.replace("-"," ").toUpperCase()}</span><Gift size={23}/></div>
    <h1>{quest.title}</h1><p>{quest.description}</p>
    <div className="quest-detail-data"><div><small>Test-token reward · raw units</small><strong>{quest.rewardEachRaw}</strong></div>
      <div><small>Verified claims</small><strong>{quest.claims} / {quest.maxClaims}</strong></div>
      <div><small>Token address</small><code>{quest.token}</code></div>
      <div><small>Campaign ID</small><strong>#{quest.onchainId}</strong></div></div>
    <h2>Eligibility requirements</h2>
    {quest.tasks.map((t,i)=><div className="quest-detail-task" key={i}>
      <span>{i+1}</span><div><strong>{t.kind==="hold"?"Hold ERC-20":t.kind==="swap"?"Confirm a swap":"Hold LP tokens"}</strong>
       <p>Minimum: {t.minRaw} raw units</p>
       {t.token&&<small>Token: {t.token}</small>}
       {t.pair&&<small>Pool: {t.pair}</small>}
       {t.kind==="swap"&&<label>Confirmed swap transaction hash
        <input spellCheck={false} placeholder="0x…" value={txHashes[i]??""}
         onChange={e=>setTxHashes(old=>({...old,[i]:e.target.value}))}/></label>}</div>
     </div>)}
   </section>
   <section className="quest-create-panel quest-claim-panel">
    <h2><Wallet size={20}/> Verify & claim</h2>
    <p>This campaign is linked to the pinned testnet vault. Claim eligibility is computed from canonical chain records, not client-side completion badges.</p>
    <div className="quest-create-warn"><ShieldAlert size={16}/> Balance-hold tasks verify an indexed snapshot, not continuous historical ownership. No social tasks can claim without a trusted data provider.</div>
    <button onClick={()=>void connect()} disabled={busy} className="quest-live-main-action"><Wallet size={16}/>{wallet?wallet.slice(0,7)+"…"+wallet.slice(-5):"Connect testnet wallet"}</button>
    <button className="quest-live-main-action" disabled={!wallet||busy||quest.state!=="active"} onClick={()=>void verify()}>
      <CheckCircle2 size={16}/>{busy?"Verifying…":"Verify all on-chain tasks"}</button>
    {authorization&&<div className="quest-claim-auth"><strong><CheckCircle2 size={17}/> Eligible to claim</strong><p>Attestation covers {authorization.proofs.length} verified task(s). Claim the fixed reward before expiry.</p>
      <button className="quest-live-main-action" disabled={busy} onClick={()=>void claim()}><Gift size={16}/> Claim from escrow</button></div>}
    {error&&<p className="quest-launch-error" role="alert">{error}</p>}
    {transaction&&explorer&&<a className="quest-create-link" href={explorer.replace(/\/$/,"")+"/tx/"+transaction}
      target="_blank" rel="noreferrer">View blockchain receipt <ExternalLink size={15}/></a>}
    <p className="quest-live-fine">Escrow: {quest.vault}</p>
    <p className="quest-live-fine">Only valueless sandbox assets are supported. Each wallet can claim once. EIP-712 signatures bind the wallet, chain, contract, campaign, nonce, evidence and expiry.</p>
   </section>
  </div>}
 </div>;
}
