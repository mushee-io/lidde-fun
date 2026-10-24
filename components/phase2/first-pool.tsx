"use client";
import { useEffect, useState } from "react";
import { erc20Abi, isAddress, getAddress, parseUnits, parseEventLogs, parseAbi, zeroAddress, type Address, type Hash } from "viem";
import { Droplets, ExternalLink, ShieldAlert } from "lucide-react";
import { creatorAbi, factoryAbi, routerAbi } from "@/lib/phase2/abis";
import { loadManifest, verifiedWallet, verifyCreator, minAfterSlippage, numericSlippage, type SandboxManifest } from "@/lib/phase2/wallet";

const factoryEvents=parseAbi(["event PairCreated(address indexed token0,address indexed token1,address pair,uint256 pairIndex)"]);
const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
type Asset={address:Address;symbol:string;decimals:number;creator:Address};
export function FirstPool() {
  const [manifest,setManifest]=useState<SandboxManifest|null>(null),[reason,setReason]=useState("Checking testnet configuration…");
  const [addressA,setAddressA]=useState(""),[addressB,setAddressB]=useState("");
  const [amountA,setAmountA]=useState("10000"),[amountB,setAmountB]=useState("10000"),[slippage,setSlippage]=useState("0.5");
  const [ack,setAck]=useState(false),[working,setWorking]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState("");
  const [tx,setTx]=useState<Hash|null>(null),[pair,setPair]=useState<Address|null>(null);
  const [preview,setPreview]=useState<{a:Asset;b:Asset;rawA:bigint;rawB:bigint;owner:Address}|null>(null);
  useEffect(()=>{
    let alive=true;
    loadManifest().then(m=>{if(alive){setManifest(m);setReason(m.tokenCreator?"":"Capped token creator is not pinned and deployed.");}})
      .catch(e=>{if(alive)setReason(e.message);});
    const fromUrl=new URL(window.location.href).searchParams.get("token");
    if(fromUrl&&isAddress(fromUrl))setAddressA(fromUrl);
    return()=>{alive=false;};
  },[]);

  async function verifySetup() {
    const m=await loadManifest();
    if(!m.tokenCreator) throw new Error("A pinned sandbox token creator contract is required to verify the launch issuer.");
    const {account,client,wallet}=await verifiedWallet(m);
    const creator=await verifyCreator(m,client);
    if(!isAddress(addressA)||!isAddress(addressB)||same(addressA,addressB)||
      same(addressA,zeroAddress)||same(addressB,zeroAddress))throw new Error("Enter two distinct nonzero sandbox ERC-20 addresses.");
    const asset=async(value:string):Promise<Asset>=>{
      const address=getAddress(value);
      const code=await client.getBytecode({address});
      if(!code||code==="0x")throw new Error("Selected ERC-20 token contract is not deployed.");
      const [symbol,decimals,issuer]=await Promise.all([
        client.readContract({address,abi:erc20Abi,functionName:"symbol"}),
        client.readContract({address,abi:erc20Abi,functionName:"decimals"}),
        client.readContract({address:creator,abi:parseAbi(["function creatorOf(address) view returns(address)"]),functionName:"creatorOf",args:[address]})
      ]);
      if(!/^t[A-Za-z0-9]{1,13}$/.test(symbol)||![6,8,18].includes(decimals))
        throw new Error("Only explicit t-prefixed sandbox tokens with approved decimals are accepted.");
      return {address,symbol,decimals,creator:issuer};
    };
    const [a,b]=await Promise.all([asset(addressA),asset(addressB)]);
    if(!same(a.creator,account)&&!same(b.creator,account))
      throw new Error("Connected wallet must be the recorded creator of at least one token in this pair.");
    const [existing,routerFactory]=await Promise.all([
      client.readContract({address:m.factory,abi:factoryAbi,functionName:"getPair",args:[a.address,b.address]}),
      client.readContract({address:m.router,abi:routerAbi,functionName:"factory"})
    ]);
    if(existing!==zeroAddress||!same(routerFactory,m.factory))
      throw new Error("Pool already exists or Factory mismatch. Use Portfolio & LP to manage existing pools.");
    const bps=numericSlippage(slippage);
    if(!/^\d+(\.\d+)?$/.test(amountA)||!/^\d+(\.\d+)?$/.test(amountB))
      throw new Error("Enter valid positive token amounts.");
    const rawA=parseUnits(amountA,a.decimals),rawB=parseUnits(amountB,b.decimals);
    if(rawA<=1000n||rawB<=1000n||rawA*rawB<=1000000n)
      throw new Error("Initial token quantities are too small relative to the permanently locked minimum liquidity.");
    minAfterSlippage(rawA,bps);
    minAfterSlippage(rawB,bps);
    return {m,client,wallet,account,a,b,rawA,rawB};
  }
  async function inspect() {
    setWorking(true);setStatus("");setError("");setPreview(null);setTx(null);setPair(null);
    try{
      const info=await verifySetup();
      setPreview({a:info.a,b:info.b,rawA:info.rawA,rawB:info.rawB,owner:info.account});
    }catch(e){setError(e instanceof Error?e.message:"Pool launch preview failed.");}
    finally{setWorking(false);}
  }
  async function launch(){
    setWorking(true);setError("");setStatus("");setTx(null);setPair(null);
    try{
      if(!ack||!preview)throw new Error("Read and acknowledge the initial pool pricing and locked liquidity warning.");
      const {m,client,wallet,account,a,b,rawA,rawB}=await verifySetup();
      if(!same(account,preview.owner)||!same(a.address,preview.a.address)||!same(b.address,preview.b.address)||
        rawA!==preview.rawA||rawB!==preview.rawB)throw new Error("Inputs or wallet changed; preview again.");
      for(const [token,quantity] of [[a,rawA],[b,rawB]] as const){
        const [balance,allowance]=await Promise.all([
          client.readContract({address:token.address,abi:erc20Abi,functionName:"balanceOf",args:[account]}),
          client.readContract({address:token.address,abi:erc20Abi,functionName:"allowance",args:[account,m.router]})
        ]);
        if(balance<quantity)throw new Error("Insufficient "+token.symbol+" to seed initial liquidity.");
        if(allowance<quantity){
          const next=allowance>0n?0n:quantity;
          const sim=await client.simulateContract({account,address:token.address,abi:erc20Abi,functionName:"approve",args:[m.router,next]});
          const hash=await wallet.writeContract(sim.request);setTx(hash);
          const receipt=await client.waitForTransactionReceipt({hash,timeout:120000,confirmations:1});
          if(receipt.status!=="success")throw new Error("ERC-20 allowance transaction reverted.");
          setPreview(null);
          setStatus(next===0n?"Old allowance revoked. Preview again before exact approval.":"Exact token approval confirmed. Preview the pool again before launching.");
          return;
        }
      }
      const bps=numericSlippage(slippage);
      const deadline=BigInt(Math.floor(Date.now()/1000)+15*60);
      const sim=await client.simulateContract({account,address:m.router,abi:routerAbi,functionName:"addLiquidity",
        args:[a.address,b.address,rawA,rawB,minAfterSlippage(rawA,bps),minAfterSlippage(rawB,bps),account,deadline]});
      const hash=await wallet.writeContract(sim.request);
      setTx(hash);setStatus("Initial pool transaction submitted. Waiting for actual contract receipt.");
      const receipt=await client.waitForTransactionReceipt({hash,timeout:120000,confirmations:1});
      if(receipt.status!=="success")throw new Error("First-pool transaction reverted.");
      const parsed=parseEventLogs({abi:factoryEvents,eventName:"PairCreated",logs:receipt.logs,strict:true});
      const event=parsed.find(x=>same(x.address,m.factory));
      const address=event?.args.pair??await client.readContract({address:m.factory,abi:factoryAbi,functionName:"getPair",args:[a.address,b.address]});
      if(address===zeroAddress)throw new Error("Confirmed receipt missing canonical newly created Factory pool.");
      setPair(address);setPreview(null);
      setStatus("Testnet liquidity pool created in block "+receipt.blockNumber.toString()+". Minimum LP supply is permanently locked by the Pair contract.");
    }catch(e){setError(e instanceof Error?e.message:"First pool creation failed.");}
    finally{setWorking(false);}
  }
  return <div className="phase2-grid"><section className="phase2-panel phase2-form">
    <h2><Droplets size={20}/> Launch the first sandbox pool</h2>
    <p>Pair a token created by your wallet with another sandbox ERC-20. This creates the first pair through the real Lidde Factory and seeds liquidity through the Router.</p>
    <label>Token A contract<input value={addressA} onChange={e=>{setAddressA(e.target.value);setPreview(null);}} placeholder="0x…" spellCheck={false}/></label>
    <label>Token B contract<input value={addressB} onChange={e=>{setAddressB(e.target.value);setPreview(null);}} placeholder="0x…" spellCheck={false}/></label>
    <div className="phase2-fields"><label>Token A quantity<input value={amountA} onChange={e=>{setAmountA(e.target.value);setPreview(null);}} inputMode="decimal"/></label>
      <label>Token B quantity<input value={amountB} onChange={e=>{setAmountB(e.target.value);setPreview(null);}} inputMode="decimal"/></label></div>
    <label>Max slippage<select value={slippage} onChange={e=>{setSlippage(e.target.value);setPreview(null);}}>
      <option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1">1%</option><option value="3">3%</option><option value="5">5%</option></select></label>
    <label className="phase2-check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>
      I understand I set the initial price ratio and the Pair permanently locks MINIMUM_LIQUIDITY (1000 raw LP units). I am spending valueless sandbox tokens only.</label>
    <button className="phase2-primary" disabled={working||!manifest?.tokenCreator} onClick={()=>void inspect()}>{working?"Checking…":"Verify creator & preview first pool"}</button>
    {preview&&<div className="phase2-quote"><small>Verified new pool · no existing Factory pair</small><strong>{preview.a.symbol} / {preview.b.symbol}</strong>
      <p>Initial supplied quantities: {amountA} and {amountB}. This ratio fixes the initial pool price.</p>
      <button disabled={!ack||working} className="phase2-primary" onClick={()=>void launch()}>{working?"Waiting for wallet…":"Approve or create pool"}</button></div>}
    {!manifest?.tokenCreator&&<p className="phase2-muted" role="status">{reason}</p>}
  </section>
  <section className="phase2-panel phase2-form"><h2>Launch and proof</h2>
    <div className="phase2-warning"><ShieldAlert size={17}/> First-pool prices are arbitrary and vulnerable to mispricing. All launches are zero-value test experiments and require two separate token approvals when none are present.</div>
    {status&&<p className="phase2-success" role="status">{status}</p>}
    {error&&<p className="phase2-error" role="alert">{error}</p>}
    {pair&&<div className="phase2-result"><small>Created Factory pair</small><code>{pair}</code><p>Once indexed, the pair appears in token discovery and portfolio holdings.</p></div>}
    {tx&&manifest&&<a className="phase2-text-link" target="_blank" rel="noreferrer" href={manifest.explorerUrl.replace(/\/$/,"")+"/tx/"+tx}>Inspect confirmed chain receipt <ExternalLink size={15}/></a>}
  </section></div>;
}
