"use client";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits, parseUnits, type Address, type Hash } from "viem";
import { ArrowLeftRight, ArrowUpRight, ShieldAlert, Wallet } from "lucide-react";
import { discovery, type DiscoveryResponse } from "@/lib/phase2/browser-data";
import { factoryAbi, pairAbi, routerAbi } from "@/lib/phase2/abis";
import { loadManifest, minAfterSlippage, numericSlippage, readSandbox, verifiedWallet, type SandboxManifest } from "@/lib/phase2/wallet";

const equals=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export function SpotTerminal() {
  const [data,setData]=useState<DiscoveryResponse|null>(null),[manifest,setManifest]=useState<SandboxManifest|null>(null);
  const [reason,setReason]=useState("Checking the sandbox indexer…");
  const [pair,setPair]=useState(""),[inverse,setInverse]=useState(false);
  const [amount,setAmount]=useState("10"),[slippage,setSlippage]=useState("0.5");
  const [quote,setQuote]=useState<{amountIn:bigint;amountOut:bigint;balance:string;allowance:string;atBlock:string}|null>(null);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState("");
  const [transaction,setTransaction]=useState<Hash|null>(null);
  async function reload() {
    setReason("Checking canonical indexed pairs…");setData(null);setQuote(null);
    try{
      const [d,m]=await Promise.all([discovery(),loadManifest()]);
      setData(d);setManifest(m);setReason("");
      const wanted = new URL(window.location.href).searchParams.get("pair");
      setPair(d.pools.find(p=>wanted&&equals(p.pair,wanted))?.pair ?? d.pools[0]?.pair ?? "");
    }catch(e){setReason(e instanceof Error?e.message:"No verified sandbox data.");}
  }
  useEffect(()=>{void reload();},[]);
  const selected=data?.pools.find(p=>pair&&equals(p.pair,pair));
  const token0=data?.tokens.find(t=>selected&&equals(t.address,selected.token0));
  const token1=data?.tokens.find(t=>selected&&equals(t.address,selected.token1));
  const input=inverse?token1:token0,output=inverse?token0:token1;
  const path=useMemo(()=>(input&&output?[input.address,output.address]:null) as [Address,Address]|null,[input?.address,output?.address]);

  async function freshQuote(client:ReturnType<typeof readSandbox>, m:SandboxManifest) {
    if(!selected||!path||!input||!output)throw new Error("Select a canonical indexed liquidity pool.");
    if(!/^\d+(\.\d+)?$/.test(amount))throw new Error("Enter a positive token amount.");
    const inputAmount=parseUnits(amount,input.decimals);
    if(inputAmount<=0n)throw new Error("Amount must be larger than zero.");
    if(inputAmount>2n**192n-1n)throw new Error("Trade amount exceeds safe sandbox bounds.");
    const [factory,actualPair,code,t0,t1,reserves,actualDecimals] = await Promise.all([
      client.readContract({address:m.router,abi:routerAbi,functionName:"factory"}),
      client.readContract({address:m.factory,abi:factoryAbi,functionName:"getPair",args:path}),
      client.getBytecode({address:selected.pair}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"token0"}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"token1"}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"getReserves"}),
      client.readContract({address:input.address,abi:erc20Abi,functionName:"decimals"})
    ]);
    if(!equals(factory,m.factory)||!equals(actualPair,selected.pair)||!code||code==="0x"||
      !equals(t0,selected.token0)||!equals(t1,selected.token1)||actualDecimals!==input.decimals)
      throw new Error("Pair, token decimals or Router binding changed. Trading blocked.");
    if(reserves[0]===0n||reserves[1]===0n)throw new Error("This indexed pool has no tradable liquidity.");
    const outputs=await client.readContract({address:m.router,abi:routerAbi,functionName:"getAmountsOut",args:[inputAmount,path]});
    const outputAmount=outputs[outputs.length-1];
    if(outputAmount<=0n)throw new Error("Trade has no output at current on-chain reserves.");
    return {inputAmount,outputAmount};
  }
  async function preview() {
    setBusy(true);setError("");setStatus("");setQuote(null);
    try {
      const m=await loadManifest();const client=readSandbox(m);
      const {inputAmount,outputAmount}=await freshQuote(client,m);
      const account = (window as Window & {ethereum?:{request(a:{method:string}):Promise<unknown>}}).ethereum;
      const accounts=account?await account.request({method:"eth_accounts"}):[];
      let balance="—",allowance="—";
      if(Array.isArray(accounts)&&typeof accounts[0]==="string"&&/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) {
        const address=accounts[0] as Address;
        const [b,a]=await Promise.all([
          client.readContract({address:input!.address,abi:erc20Abi,functionName:"balanceOf",args:[address]}),
          client.readContract({address:input!.address,abi:erc20Abi,functionName:"allowance",args:[address,m.router]})
        ]);
        balance=formatUnits(b,input!.decimals);allowance=formatUnits(a,input!.decimals);
      }
      setQuote({amountIn:inputAmount,amountOut:outputAmount,balance,allowance,atBlock:(await client.getBlockNumber()).toString()});
    } catch(e){setError(e instanceof Error?e.message:"Quote could not be verified.");}
    finally{setBusy(false);}
  }
  async function trade(){
    setBusy(true);setError("");setStatus("");setTransaction(null);
    try {
      if(!quote||!input||!output||!path)throw new Error("Refresh the on-chain quote before signing.");
      const m=await loadManifest(); const {account,client,wallet}=await verifiedWallet(m);
      const {inputAmount,outputAmount}=await freshQuote(client,m);
      if(inputAmount!==quote.amountIn)throw new Error("The input changed. Get a new quote.");
      const minReceived=minAfterSlippage(outputAmount,numericSlippage(slippage));
      const [balance,allowance]=await Promise.all([
        client.readContract({address:input.address,abi:erc20Abi,functionName:"balanceOf",args:[account]}),
        client.readContract({address:input.address,abi:erc20Abi,functionName:"allowance",args:[account,m.router]})
      ]);
      if(balance<inputAmount)throw new Error("Insufficient actual sandbox token balance.");
      if(allowance<inputAmount) {
        // Never auto-approve in the same flow as a swap; confirm and re-review first.
        const amountToApprove=allowance>0n?0n:inputAmount;
        const sim=await client.simulateContract({account,address:input.address,abi:erc20Abi,functionName:"approve",args:[m.router,amountToApprove]});
        const h=await wallet.writeContract(sim.request);
        setTransaction(h);
        const receipt=await client.waitForTransactionReceipt({hash:h,confirmations:1,timeout:120000});
        if(receipt.status!=="success")throw new Error("Token approval reverted.");
        setQuote(null);
        setStatus(amountToApprove===0n?"Existing approval revoked. Refresh quote and approve the exact amount.":"Exact token allowance confirmed. Refresh the quote and submit the swap separately.");
        return;
      }
      const deadline=BigInt(Math.floor(Date.now()/1000)+15*60);
      const sim=await client.simulateContract({account,address:m.router,abi:routerAbi,functionName:"swapExactTokensForTokens",
        args:[inputAmount,minReceived,path,account,deadline]});
      const hash=await wallet.writeContract(sim.request);
      setTransaction(hash);setStatus("Swap sent. Waiting for a confirmed sandbox receipt.");
      const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000});
      if(receipt.status!=="success")throw new Error("Swap transaction reverted.");
      setQuote(null);setStatus("Sandbox swap confirmed in block "+receipt.blockNumber.toString()+". It has zero real monetary value.");
    }catch(e){setError(e instanceof Error?e.message:"Wallet transaction failed.");}
    finally{setBusy(false);}
  }

  return <div className="phase2-grid">
    <section className="phase2-panel phase2-form">
      <h2><ArrowLeftRight size={21}/> Swap indexed ERC-20s</h2>
      <p>Direct Router swaps only. No real assets, real USD price, synthetic execution or unverified custom routes.</p>
      {!data&&<div className="phase2-blocked"><ShieldAlert/><p>{reason}</p></div>}
      {data&&<><label>Indexed liquidity pool<select value={pair} onChange={e=>{setPair(e.target.value);setQuote(null);}}>
          {data.pools.map(p=><option key={p.pair} value={p.pair}>{p.token0Symbol} / {p.token1Symbol} · {p.pair.slice(0,8)}</option>)}</select></label>
        <div className="phase2-swap-pair"><span>Pay: {input?.symbol??"—"}</span><button onClick={()=>{setInverse(!inverse);setQuote(null);}}><ArrowLeftRight size={15}/> Reverse</button><span>Receive: {output?.symbol??"—"}</span></div>
        <label>Amount to send<input inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setQuote(null);}}/></label>
        <label>Max slippage<select value={slippage} onChange={e=>{setSlippage(e.target.value);setQuote(null);}}>
          <option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1">1%</option><option value="3">3%</option><option value="5">5%</option></select></label>
        <button className="phase2-primary" disabled={busy||!selected} onClick={()=>void preview()}>{busy?"Working…":"Get current on-chain quote"}</button>
        {quote&&<div className="phase2-quote"><small>Confirmed pool estimate · block {quote.atBlock}</small>
          <strong>{formatUnits(quote.amountOut,output!.decimals)} {output!.symbol}</strong>
          <div>Minimum at {slippage}% slippage: {formatUnits(minAfterSlippage(quote.amountOut,numericSlippage(slippage)),output!.decimals)}</div>
          <div>Wallet available: {quote.balance} · Router allowance: {quote.allowance}</div>
          <button className="phase2-primary" onClick={()=>void trade()} disabled={busy}><Wallet size={16}/> {busy?"Waiting for wallet…":"Approve or sign test swap"}</button>
        </div>}
      </>}
      <p className="phase2-muted">Each signing attempt rechecks exact chain fingerprints, factory/pair provenance, current pool state, balances, Router allowance and price limits. For approvals, the user must intentionally return to the swap.</p>
    </section>
    <section className="phase2-panel phase2-form"><h2>Transaction and safety</h2>
      <div className="phase2-warning"><ShieldAlert size={18}/> Never deposit real VERY or bridge real funds. ERC-20 approvals are exact where supported and are signed separately from swaps.</div>
      {status&&<p className="phase2-success" role="status">{status}</p>}
      {error&&<p className="phase2-error" role="alert">{error}</p>}
      {transaction&&manifest&&<a className="phase2-text-link" href={manifest.explorerUrl.replace(/\/$/,"")+"/tx/"+transaction} target="_blank" rel="noreferrer">Inspect actual transaction <ArrowUpRight size={16}/></a>}
      <p className="phase2-muted">Use the Portfolio & LP screen for real balances and to add or remove indexed sandbox liquidity. An indexed market may still be thin or manipulated.</p>
    </section>
  </div>;
}
