"use client";
import { useState, type FormEvent } from "react";
import { erc20Abi, getAddress, isAddress, parseEventLogs, type Address, type Hash } from "viem";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, ExternalLink, Gift, Plus, ShieldAlert, Wallet, X } from "lucide-react";
import { vaultAbi } from "@/lib/quests/vault-abi";
import { connectedAddress, parseApi, questVaultWallet, signedQuestChallenge } from "@/lib/quests/browser";
import type { QuestRule } from "@/lib/quests/rules";

const futureDate=(days:number)=>new Date(Date.now()+days*86400000).toISOString().slice(0,16);
type DraftUi={title:string;description:string;creator:Address;token:Address;rewardEachRaw:string;maxClaims:number;startsAt:string;endsAt:string;tasks:QuestRule[]};
type Created={status:string;id:string};
type Registered={status:string;fullyFunded:boolean};
type Stage="draft"|"created"|"registered"|"funded";
const short=(v:string)=>v.slice(0,8)+"…"+v.slice(-5);
export function QuestCreator(){
 const [name,setName]=useState("Explore the Lidde testnet");
 const [description,setDescription]=useState("Hold valueless test tokens, trade or provide test liquidity to verify on-chain activity.");
 const [token,setToken]=useState("");
 const [reward,setReward]=useState("1000000000000000000");
 const [limit,setLimit]=useState(100);
 const [start,setStart]=useState(futureDate(1/48)),[end,setEnd]=useState(futureDate(1));
 const [tasks,setTasks]=useState<QuestRule[]>([{kind:"hold",token:undefined,minRaw:"1000000000000000000"}]);
 const [stage,setStage]=useState<Stage>("draft");
 const [created,setCreated]=useState<DraftUi|null>(null);
 const [draftId,setDraftId]=useState("");
 const [onchainId,setOnchainId]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const [tx,setTx]=useState<Hash|null>(null),[explorer,setExplorer]=useState("");

 function changeTask(i:number,key:string,value:string){
  setTasks(items=>items.map((t,index)=>index===i?{
   ...t,[key]:value
  } as QuestRule:t));
 }
 function prepare():DraftUi{
  if(!isAddress(token))throw new Error("Choose the address of your sandbox reward token.");
  if(!tasks.length||tasks.length>5)throw new Error("Choose one to five verifiable on-chain tasks.");
  const result=tasks.map(t=>{
   if((t.kind==="hold"||t.kind==="swap")&&!isAddress(t.token??""))
    throw new Error("Each hold or swap task must name an ERC-20 token.");
   if((t.kind==="swap"||t.kind==="lp")&&!isAddress(t.pair??""))
    throw new Error("Each swap or LP task must name a canonical pool.");
   if(!/^[1-9][0-9]{0,76}$/.test(t.minRaw))throw new Error("Task raw-unit minimum must be positive.");
   return {...t,token:t.token&&isAddress(t.token)?getAddress(t.token):undefined,
    pair:t.pair&&isAddress(t.pair)?getAddress(t.pair):undefined};
  });
  return {title:name.trim(),description:description.trim(),creator:"0x0000000000000000000000000000000000000000" as Address,
   token:getAddress(token),rewardEachRaw:reward,maxClaims:limit,
   startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),tasks:result};
 }
 async function saveDraft(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const creator=await connectedAddress();
   const form={...prepare(),creator};
   const auth=await signedQuestChallenge(creator,"create-draft");
   const result=await parseApi<Created>("/api/quests/drafts",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({draft:form,...auth})});
   setDraftId(result.id);setCreated(form);setStage("created");
   setNotice("Signed quest draft saved in the separate database. No funds have moved.");
  }catch(e){setError(e instanceof Error?e.message:"Could not save quest draft.");}
  finally{setBusy(false);}
 }
 async function deployCampaign(){
  setBusy(true);setError("");setNotice("");setTx(null);
  try{
   if(!created||!draftId)throw new Error("Save your signed draft first.");
   const {config,account,client,wallet,manifest}=await questVaultWallet();
   if(account.toLowerCase()!==created.creator.toLowerCase())throw new Error("Use the wallet that signed the draft.");
   const starts=BigInt(Math.floor(new Date(created.startsAt).getTime()/1000));
   const ends=BigInt(Math.floor(new Date(created.endsAt).getTime()/1000));
   if(starts<=BigInt(Math.floor(Date.now()/1000)))throw new Error("Choose a future start time and save a new draft.");
   const sim=await client.simulateContract({account,address:config.vault,abi:vaultAbi,functionName:"createCampaign",
    args:[created.token,config.attestor,BigInt(created.rewardEachRaw),created.maxClaims,starts,ends]});
   const hash=await wallet.writeContract(sim.request);
   setTx(hash);setExplorer(manifest.explorerUrl);
   const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
   if(receipt.status!=="success")throw new Error("QuestEscrow rejected campaign creation.");
   const events=parseEventLogs({abi:vaultAbi,eventName:"CampaignCreated",logs:receipt.logs,strict:true});
   const event=events.find(x=>x.address.toLowerCase()===config.vault.toLowerCase()&&
    x.args.creator.toLowerCase()===account.toLowerCase());
   if(!event)throw new Error("Confirmed transaction contained no matching campaign creation event.");
   const id=event.args.campaignId.toString();setOnchainId(id);
   setNotice("Campaign #"+id+" created on the sandbox. It is not funded or active yet.");
  }catch(e){setError(e instanceof Error?e.message:"Quest vault transaction failed.");}
  finally{setBusy(false);}
 }
 async function register(){
  setBusy(true);setError("");setNotice("");
  try{
   if(!created||!onchainId||!draftId)throw new Error("A deployed on-chain campaign and saved draft are required.");
   const auth=await signedQuestChallenge(created.creator,"register-campaign");
   const result=await parseApi<Registered>("/api/quests/register",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:draftId,onchainId,creator:created.creator,...auth})});
   if(result.status!=="registered")throw new Error("Campaign registration did not complete.");
   setStage("registered");
   setNotice("Quest identity linked to the actual campaign. Fund the full test-token budget before claims can open.");
  }catch(e){setError(e instanceof Error?e.message:"Campaign registration rejected.");}
  finally{setBusy(false);}
 }
 async function fund(){
  setBusy(true);setError("");setNotice("");setTx(null);
  try{
   if(!created||!onchainId||stage==="draft"||stage==="created")throw new Error("Register the on-chain campaign first.");
   const {account,client,wallet,config,manifest}=await questVaultWallet();
   if(account.toLowerCase()!==created.creator.toLowerCase())throw new Error("Connect the original campaign creator wallet.");
   const amount=BigInt(created.rewardEachRaw)*BigInt(created.maxClaims);
   const [balance,allowance]=await Promise.all([
    client.readContract({address:created.token,abi:erc20Abi,functionName:"balanceOf",args:[account]}),
    client.readContract({address:created.token,abi:erc20Abi,functionName:"allowance",args:[account,config.vault]})
   ]);
   if(balance<amount)throw new Error("Creator does not have enough valueless test tokens to fund the campaign.");
   if(allowance<amount){
    const next=allowance>0n?0n:amount;
    const sim=await client.simulateContract({account,address:created.token,abi:erc20Abi,
      functionName:"approve",args:[config.vault,next]});
    const hash=await wallet.writeContract(sim.request);
    setTx(hash);setExplorer(manifest.explorerUrl);
    const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
    if(receipt.status!=="success")throw new Error("Sandbox token approval reverted.");
    setNotice(next===0n?"Old allowance revoked. Click Fund again to approve exactly the campaign budget.":"Exact budget allowance approved. Click Fund again for a separate escrow transaction.");
    return;
   }
   const sim=await client.simulateContract({account,address:config.vault,abi:vaultAbi,functionName:"fund",
    args:[BigInt(onchainId),amount]});
   const hash=await wallet.writeContract(sim.request);
   setTx(hash);setExplorer(manifest.explorerUrl);
   const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
   if(receipt.status!=="success")throw new Error("Campaign funding reverted.");
   setStage("funded");setNotice("Full valueless reward budget escrowed on-chain. See the live quest directory for the verified funding state.");
  }catch(e){setError(e instanceof Error?e.message:"Quest funding failed.");}
  finally{setBusy(false);}
 }

 return <div className="quest-create-grid">
  <form className="quest-create-panel" onSubmit={e=>void saveDraft(e)}>
   <div className="quest-create-title"><Gift size={22}/><div><small>CAMPAIGN DESIGNER</small><h2>Build your quest</h2></div></div>
   <p>Configure verifiable token-hold, pool-swap and LP tasks. Off-chain follows and screenshots cannot generate claim proofs.</p>
   <label>Quest name<input required minLength={5} maxLength={100} value={name} disabled={stage!=="draft"} onChange={e=>setName(e.target.value)}/></label>
   <label>Description<textarea required maxLength={600} rows={3} value={description} disabled={stage!=="draft"} onChange={e=>setDescription(e.target.value)}/></label>
   <label>Sandbox ERC-20 reward contract<input required value={token} disabled={stage!=="draft"} onChange={e=>setToken(e.target.value)} placeholder="0x…" spellCheck={false}/></label>
   <div className="quest-create-two"><label>Raw token units per wallet<input value={reward} inputMode="numeric" disabled={stage!=="draft"} onChange={e=>setReward(e.target.value)}/></label>
    <label>Maximum funded claims<input type="number" min={1} max={10000} value={limit} disabled={stage!=="draft"} onChange={e=>setLimit(Number(e.target.value))}/></label></div>
   <div className="quest-create-two"><label>Starts (local)<input type="datetime-local" value={start} disabled={stage!=="draft"} onChange={e=>setStart(e.target.value)}/></label>
    <label>Ends (local)<input type="datetime-local" value={end} disabled={stage!=="draft"} onChange={e=>setEnd(e.target.value)}/></label></div>
   <div className="quest-create-task-head"><strong>Eligibility tasks ({tasks.length}/5)</strong>
    <button type="button" disabled={stage!=="draft"||tasks.length>=5} onClick={()=>setTasks([...tasks,{kind:"hold",minRaw:"1"}])}><Plus size={14}/> Add task</button></div>
   {tasks.map((t,i)=><div className="quest-task-config" key={i}>
    <div><small>STEP {i+1}</small><button type="button" disabled={stage!=="draft"||tasks.length===1} onClick={()=>setTasks(tasks.filter((_,x)=>x!==i))}><X size={15}/></button></div>
    <label>On-chain condition<select value={t.kind} disabled={stage!=="draft"} onChange={e=>{const kind=e.target.value as QuestRule["kind"];setTasks(prev=>prev.map((r,x)=>x===i?{kind,minRaw:r.minRaw}:r));}}>
      <option value="hold">Hold ERC-20 tokens</option><option value="swap">Receive tokens in a confirmed swap</option><option value="lp">Hold pair LP tokens</option></select></label>
    {(t.kind==="hold"||t.kind==="swap")&&<label>ERC-20 {t.kind==="swap"?"output":"holding"} token address<input value={t.token??""} disabled={stage!=="draft"} onChange={e=>changeTask(i,"token",e.target.value)} placeholder="0x…"/></label>}
    {(t.kind==="swap"||t.kind==="lp")&&<label>Factory pair address<input value={t.pair??""} disabled={stage!=="draft"} onChange={e=>changeTask(i,"pair",e.target.value)} placeholder="0x…"/></label>}
    <label>Minimum raw units<input value={t.minRaw} disabled={stage!=="draft"} onChange={e=>changeTask(i,"minRaw",e.target.value)} inputMode="numeric"/></label>
   </div>)}
   <div className="quest-create-warn"><ShieldAlert size={19}/> A draft is not a token distribution. Actual reward claims require the same wallet to create, register and fund an on-chain campaign first.</div>
   <button className="quest-live-main-action" type="submit" disabled={stage!=="draft"||busy}><Wallet size={16}/>{busy?"Processing…":"Sign & save draft"}</button>
  </form>
  <section className="quest-create-panel quest-create-progress">
   <h2><Coins size={21}/> Campaign launch</h2><p>Every action below is independent, wallet-authorized and verified through actual on-chain receipts.</p>
   <div className="quest-launch-step"><span>1</span><div><strong>Wallet-signed draft</strong><p>{draftId?"Saved as "+short(draftId):"Save the campaign parameters off-chain."}</p>
    {draftId&&<CheckCircle2 size={18} color="#4edf9c"/>}</div></div>
   <div className="quest-launch-step"><span>2</span><div><strong>Create the on-chain campaign</strong><p>{onchainId?"Actual campaign #"+onchainId:"Attestor, token, dates and payout terms become immutable escrow data."}</p>
    <button disabled={busy||!draftId||!!onchainId} onClick={()=>void deployCampaign()}>{busy?"Working…":"Deploy campaign"}</button></div></div>
   <div className="quest-launch-step"><span>3</span><div><strong>Bind draft to chain receipt</strong><p>Server independently checks escrow code, creator, signer and reward parameters.</p>
    <button disabled={busy||!onchainId||stage==="registered"||stage==="funded"} onClick={()=>void register()}>Verify & register</button></div></div>
   <div className="quest-launch-step"><span>4</span><div><strong>Escrow the entire reward budget</strong><p>Approve exact valueless test-token amount, then fund in a separate transaction.</p>
    <button disabled={busy||(stage!=="registered"&&stage!=="funded")} onClick={()=>void fund()}>{stage==="funded"?"Budget confirmed":"Approve / fund"}</button></div></div>
   {notice&&<div role="status" className="quest-launch-success">{notice}</div>}
   {error&&<div role="alert" className="quest-launch-error">{error}</div>}
   {tx&&explorer&&<a className="quest-create-link" href={explorer.replace(/\/$/,"")+"/tx/"+tx} rel="noreferrer" target="_blank">Inspect transaction <ExternalLink size={15}/></a>}
   <Link className="quest-create-link" href="/quests">View verified campaigns <ArrowRight size={16}/></Link>
   <div className="quest-launch-note">All campaigns remain unavailable until a verified isolated testnet, dedicated database, deployed QuestEscrow and server attestor are provisioned. Nothing here silently spends funds or produces pretend receipts.</div>
  </section>
 </div>;
}
