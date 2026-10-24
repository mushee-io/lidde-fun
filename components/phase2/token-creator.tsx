"use client";
import { useEffect, useState } from "react";
import { parseUnits, parseEventLogs, type Address, type Hash } from "viem";
import { creatorAbi } from "@/lib/phase2/abis";
import { loadManifest, verifiedWallet, verifyCreator, type SandboxManifest } from "@/lib/phase2/wallet";
import { ShieldAlert, Rocket, ExternalLink } from "lucide-react";
import Link from "next/link";
export function TokenCreator() {
  const [manifest,setManifest]=useState<SandboxManifest|null>(null);
  const [reason,setReason]=useState("Checking the sandbox…");
  const [name,setName]=useState("My Demo Token"),[symbol,setSymbol]=useState("tGEM");
  const [decimals,setDecimals]=useState(18),[initial,setInitial]=useState("10000"),[cap,setCap]=useState("100000");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [transaction,setTransaction]=useState<Hash|null>(null),[created,setCreated]=useState<Address|null>(null);
  useEffect(() => { let active=true;loadManifest().then(m => {if(active){setManifest(m);setReason(m.tokenCreator ? "" : "Token-creator deployment is not configured and code-hash verified.");}}).catch(e => {if(active)setReason(e.message);});return()=>{active=false;};},[]);
  const enabled=!!manifest?.tokenCreator;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");setMessage("");setBusy(true);setTransaction(null);setCreated(null);
    try {
      const live=await loadManifest();
      if (!enabled || !live.tokenCreator || live.chainId!==manifest?.chainId) throw new Error("Token creator has not passed verification.");
      if (name.trim().length<3 || name.trim().length>64 || !/^t[A-Za-z0-9]{1,13}$/.test(symbol))
        throw new Error("Enter a valid name (3–64 characters) and a demo symbol beginning with t.");
      if (![6,8,18].includes(decimals) || !/^\d+(\.\d+)?$/.test(initial) || !/^\d+(\.\d+)?$/.test(cap))
        throw new Error("Use demo supply amounts and approved decimal precision.");
      const quantity=parseUnits(initial,decimals),maximum=parseUnits(cap,decimals);
      if(quantity<=0n || maximum<quantity || maximum>(2n**192n-1n)) throw new Error("Supply must be positive, capped and no greater than 2^192−1 units.");
      const {account,client,wallet}=await verifiedWallet(live);
      const creator=await verifyCreator(live,client);
      const simulation=await client.simulateContract({account,address:creator,abi:creatorAbi,functionName:"createToken",
        args:[name.trim(),symbol,decimals,quantity,maximum]});
      const hash=await wallet.writeContract(simulation.request);
      setTransaction(hash);setMessage("Token creation submitted. Waiting for an on-chain receipt.");
      const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
      if(receipt.status!=="success")throw new Error("Token creation reverted.");
      const logs=parseEventLogs({abi:creatorAbi,eventName:"DemoTokenCreated",logs:receipt.logs,strict:true});
      const matched=logs.find(log => log.address.toLowerCase()===creator.toLowerCase()&&log.args.creator.toLowerCase()===account.toLowerCase());
      if(!matched) throw new Error("No matching DemoTokenCreated event found on-chain.");
      setCreated(matched.args.token);setMessage("Unverified, valueless sandbox token created. Creator retains mint authority up to the cap.");
    } catch(e){setError(e instanceof Error?e.message:"The testnet token creation failed.");}
    finally{setBusy(false);}
  }
  return <div className="phase2-grid">
    <form className="phase2-panel phase2-form" onSubmit={e=>void submit(e)}>
      <h2><Rocket size={20}/> Launch a valueless test token</h2><p>Uses the Lidde DEX capped ERC-20 creator contract. The creator controls later minting; no token here is a real asset or security audit.</p>
      <div className="phase2-fields"><label>Token name<input value={name} maxLength={64} onChange={e=>setName(e.target.value)} required/></label><label>Symbol (must begin with t)<input value={symbol} maxLength={14} onChange={e=>setSymbol(e.target.value)} required/></label>
        <label>Decimals<select value={decimals} onChange={e=>setDecimals(Number(e.target.value))}><option value={6}>6</option><option value={8}>8</option><option value={18}>18</option></select></label>
        <label>Initial demo supply<input value={initial} onChange={e=>setInitial(e.target.value)} inputMode="decimal"/></label>
        <label>Maximum mintable supply<input value={cap} onChange={e=>setCap(e.target.value)} inputMode="decimal"/></label></div>
      <div className="phase2-warning"><ShieldAlert size={18}/> Deployment needs a verified token-creator bytecode fingerprint and the wallet on the exact valueless sandbox chain.</div>
      <button type="submit" className="phase2-primary" disabled={!enabled||busy}>{busy?"Awaiting confirmation…":"Create test token"}</button>
      {!enabled&&<p className="phase2-muted" role="status">{reason}</p>}
    </form>
    <section className="phase2-panel phase2-form"><h2>Deployment receipt</h2><p>Created token contracts and transaction hashes appear only after a real wallet-signed testnet transaction.</p>
      {created&&<div className="phase2-result"><small>Deployed token address</small><code>{created}</code><Link className="phase2-text-link" href={"/pools/create?token="+created}>Seed the first test liquidity pool <ExternalLink size={14}/></Link></div>}
      {message&&<p role="status" className="phase2-success">{message}</p>}
      {error&&<p role="alert" className="phase2-error">{error}</p>}
      {transaction&&manifest&&<a className="phase2-text-link" target="_blank" rel="noreferrer" href={manifest.explorerUrl.replace(/\/$/,"")+"/tx/"+transaction}>Inspect sandbox receipt <ExternalLink size={15}/></a>}
      <p className="phase2-muted">After deployment, initial liquidity can be seeded through the separate Portfolio & LP module when pool/indexer prerequisites are satisfied. A new token is not automatically listed until an actual indexed pair exists.</p>
    </section>
  </div>;
}
