"use client";
import { useEffect, useState } from "react";
import { erc20Abi, formatUnits, getAddress, isAddress, parseUnits, type Address, type Hash } from "viem";
import { ArrowRight, ExternalLink, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import { discovery, portfolio, type DiscoveryResponse, type PortfolioResponse } from "@/lib/phase2/browser-data";
import { factoryAbi, pairAbi, routerAbi } from "@/lib/phase2/abis";
import { loadManifest, minAfterSlippage, numericSlippage, verifiedWallet, type SandboxManifest } from "@/lib/phase2/wallet";
import { optimalLiquidity, withdrawEstimate } from "@/lib/phase2/liquidity";

const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export function PortfolioManager() {
  const [account,setAccount]=useState("");
  const [data,setData]=useState<PortfolioResponse|null>(null),[directory,setDirectory]=useState<DiscoveryResponse|null>(null),[manifest,setManifest]=useState<SandboxManifest|null>(null);
  const [reason,setReason]=useState(""),[error,setError]=useState(""),[status,setStatus]=useState("");
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
  const [pool,setPool]=useState(""),[mode,setMode]=useState<"add"|"withdraw">("add");
  const [amountA,setAmountA]=useState("10"),[amountB,setAmountB]=useState("10"),[slippage,setSlippage]=useState("0.5");
  const [preview,setPreview]=useState<{label:string;inputA:bigint;inputB:bigint;lp:bigint;reserve0:bigint;reserve1:bigint;totalSupply:bigint}|null>(null);
  const [transaction,setTransaction]=useState<Hash|null>(null);
  const selected=directory?.pools.find(p=>same(p.pair,pool));
  const t0=directory?.tokens.find(t=>selected&&same(t.address,selected.token0));
  const t1=directory?.tokens.find(t=>selected&&same(t.address,selected.token1));
  const existing=data?.liquidity?.find(p=>same(p.pair,pool));

  useEffect(()=>{const provider=(window as Window & {ethereum?:{request(a:{method:string}):Promise<unknown>}}).ethereum;
    if(provider)void provider.request({method:"eth_accounts"}).then(a=>{
      if(Array.isArray(a)&&typeof a[0]==="string"&&isAddress(a[0]))setAccount(a[0]);
    }).catch(()=>{});
  },[]);
  async function read(){
    setLoading(true);setReason("");setError("");setPreview(null);
    try{
      if(!isAddress(account))throw new Error("Enter a valid EVM wallet address to view sandbox holdings.");
      const [d,m,p]=await Promise.all([discovery(),loadManifest(),portfolio(account)]);
      setDirectory(d);setManifest(m);setData(p);setPool(old=>d.pools.some(x=>same(x.pair,old))?old:d.pools[0]?.pair??"");
    }catch(e){setData(null);setDirectory(null);setReason(e instanceof Error?e.message:"Portfolio unavailable.");}
    finally{setLoading(false);}
  }

  async function verifyPair(client:ReturnType<typeof import("@/lib/phase2/wallet").readSandbox>,manifest:SandboxManifest) {
    if(!selected||!t0||!t1) throw new Error("Choose an indexed canonical test liquidity pool.");
    const [factory,actualPair,token0,token1,code,reserves,supply]=await Promise.all([
      client.readContract({address:manifest.router,abi:routerAbi,functionName:"factory"}),
      client.readContract({address:manifest.factory,abi:factoryAbi,functionName:"getPair",args:[selected.token0,selected.token1]}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"token0"}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"token1"}),
      client.getBytecode({address:selected.pair}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"getReserves"}),
      client.readContract({address:selected.pair,abi:pairAbi,functionName:"totalSupply"})
    ]);
    if(!same(factory,manifest.factory)||!same(actualPair,selected.pair)||
      !same(token0,t0.address)||!same(token1,t1.address)||!code||code==="0x")
      throw new Error("Pool/Factory provenance mismatch; liquidity operation is blocked.");
    return {reserves,totalSupply:supply};
  }
  async function makePreview() {
    setBusy(true);setError("");setStatus("");setPreview(null);
    try{
      if(!isAddress(account))throw new Error("Supply an account address.");
      const m=await loadManifest();const client=(await import("@/lib/phase2/wallet")).readSandbox(m);
      const {reserves,totalSupply}=await verifyPair(client,m);
      const limits=numericSlippage(slippage);
      if(mode==="add"){
        if(!t0||!t1||!/^\d+(\.\d+)?$/.test(amountA)||!/^\d+(\.\d+)?$/.test(amountB))
          throw new Error("Enter valid sandbox liquidity amounts.");
        const a=parseUnits(amountA,t0.decimals),b=parseUnits(amountB,t1.decimals);
        const opt=optimalLiquidity(a,b,reserves[0],reserves[1]);
        if(opt.firstLiquidity)throw new Error("First-pool creation requires an explicit launch-price and permanently locked minimum LP acknowledgement. Use the Lidde DEX launch flow.");
        setPreview({label:"Deposit "+formatUnits(opt.usedA,t0.decimals)+" "+t0.symbol+" + "+formatUnits(opt.usedB,t1.decimals)+" "+t1.symbol,
          inputA:opt.usedA,inputB:opt.usedB,lp:0n,reserve0:reserves[0],reserve1:reserves[1],totalSupply});
      }else{
        if(!isAddress(account))throw new Error("Invalid wallet address.");
        const walletLp=await client.readContract({address:selected!.pair,abi:pairAbi,functionName:"balanceOf",args:[getAddress(account)]});
        const amounts=withdrawEstimate(walletLp,totalSupply,reserves[0],reserves[1]);
        setPreview({label:"Withdraw 100% of wallet LP · expected "+
          formatUnits(amounts.amount0,t0!.decimals)+" "+t0!.symbol+" + "+formatUnits(amounts.amount1,t1!.decimals)+" "+t1!.symbol,
          inputA:amounts.amount0,inputB:amounts.amount1,lp:walletLp,reserve0:reserves[0],reserve1:reserves[1],totalSupply});
      }
      void limits;
    }catch(e){setError(e instanceof Error?e.message:"Unable to simulate liquidity preview.");}
    finally{setBusy(false);}
  }
  async function execute(){
    setBusy(true);setError("");setStatus("");setTransaction(null);
    try{
      if(!preview||!selected||!t0||!t1||!isAddress(account))throw new Error("Refresh position and quote before signing.");
      const m=await loadManifest();const {account:walletAccount,client,wallet}=await verifiedWallet(m);
      if(!same(account,walletAccount))throw new Error("Connected wallet differs from the account selected on the portfolio page.");
      const {reserves,totalSupply}=await verifyPair(client,m);
      if(reserves[0]!==preview.reserve0||reserves[1]!==preview.reserve1||totalSupply!==preview.totalSupply)
        throw new Error("On-chain liquidity changed. Recalculate the preview first.");
      const bps=numericSlippage(slippage);
      let tx:Hash;
      if(mode==="add"){
        for(const [token,needed] of [[t0,preview.inputA],[t1,preview.inputB]] as const){
          const [balance,allowance]=await Promise.all([
            client.readContract({address:token.address,abi:erc20Abi,functionName:"balanceOf",args:[walletAccount]}),
            client.readContract({address:token.address,abi:erc20Abi,functionName:"allowance",args:[walletAccount,m.router]})
          ]);
          if(balance<needed)throw new Error("Insufficient "+token.symbol+" token balance.");
          if(allowance<needed){
            const approveAmount=allowance>0n?0n:needed;
            const sim=await client.simulateContract({account:walletAccount,address:token.address,abi:erc20Abi,functionName:"approve",args:[m.router,approveAmount]});
            tx=await wallet.writeContract(sim.request);setTransaction(tx);
            const rec=await client.waitForTransactionReceipt({hash:tx,confirmations:1,timeout:120000});
            if(rec.status!=="success")throw new Error("Liquidity token approval reverted.");
            setStatus(approveAmount===0n?"Previous allowance revoked. Refresh and approve an exact amount.":"Exact approval confirmed for "+token.symbol+". Refresh preview and confirm separately.");
            setPreview(null);return;
          }
        }
        const deadline=BigInt(Math.floor(Date.now()/1000)+15*60);
        const sim=await client.simulateContract({account:walletAccount,address:m.router,abi:routerAbi,functionName:"addLiquidity",
          args:[t0.address,t1.address,preview.inputA,preview.inputB,minAfterSlippage(preview.inputA,bps),minAfterSlippage(preview.inputB,bps),walletAccount,deadline]});
        tx=await wallet.writeContract(sim.request);
      }else{
        const lp=await client.readContract({address:selected.pair,abi:pairAbi,functionName:"balanceOf",args:[walletAccount]});
        if(lp!==preview.lp || lp<=0n)throw new Error("LP balance changed. Refresh the full-exit quote.");
        const allowance=await client.readContract({address:selected.pair,abi:erc20Abi,functionName:"allowance",args:[walletAccount,m.router]});
        if(allowance<lp){
          const approveAmount=allowance>0n?0n:lp;
          const sim=await client.simulateContract({account:walletAccount,address:selected.pair,abi:erc20Abi,functionName:"approve",args:[m.router,approveAmount]});
          tx=await wallet.writeContract(sim.request);setTransaction(tx);
          const receipt=await client.waitForTransactionReceipt({hash:tx,confirmations:1,timeout:120000});
          if(receipt.status!=="success")throw new Error("LP approval failed.");
          setPreview(null);setStatus(approveAmount===0n?"Old LP allowance revoked; refresh and approve again.":"Exact LP allowance confirmed; refresh before full withdrawal.");
          return;
        }
        const deadline=BigInt(Math.floor(Date.now()/1000)+15*60);
        const sim=await client.simulateContract({account:walletAccount,address:m.router,abi:routerAbi,functionName:"removeLiquidity",
          args:[t0.address,t1.address,lp,minAfterSlippage(preview.inputA,bps),minAfterSlippage(preview.inputB,bps),walletAccount,deadline]});
        tx=await wallet.writeContract(sim.request);
      }
      setTransaction(tx);setStatus("Liquidity transaction submitted; waiting for sandbox confirmation.");
      const rec=await client.waitForTransactionReceipt({hash:tx,confirmations:1,timeout:120000});
      if(rec.status!=="success")throw new Error("Liquidity transaction reverted.");
      setPreview(null);setStatus("Liquidity transaction confirmed at sandbox block "+rec.blockNumber.toString()+". Refresh wallet balances.");
      await read();
    }catch(e){setError(e instanceof Error?e.message:"Liquidity transaction failed.");}
    finally{setBusy(false);}
  }

  return <div className="phase2-grid">
    <section className="phase2-panel phase2-form">
      <h2><Wallet size={20}/> Wallet assets & positions</h2>
      <label>Wallet public address<input value={account} onChange={e=>setAccount(e.target.value)} placeholder="0x…" spellCheck={false}/></label>
      <button className="phase2-primary" onClick={()=>void read()} disabled={loading}>{loading?"Loading…":"Read indexed balances"}<RefreshCw size={15}/></button>
      {reason&&<div className="phase2-blocked"><ShieldAlert size={19}/><p>{reason}</p></div>}
      {data&&<><div className="phase2-stats"><div><small>Snapshot block</small><strong>{data.indexedBlock}</strong></div><div><small>Native test gas</small><strong>{formatUnits(BigInt(data.native!.balance),18)} tVERY</strong></div></div>
      <h3>ERC-20 token holdings</h3><div className="phase2-balances">{data.assets?.filter(a=>BigInt(a.balance)>0n).map(a=><div key={a.address}><strong>{a.symbol}</strong><span>{formatUnits(BigInt(a.balance),a.decimals)}</span></div>)}
        {!data.assets?.some(a=>BigInt(a.balance)>0n)&&<p>No indexed ERC-20 balances found.</p>}</div>
      <h3>Liquidity holdings</h3><div className="phase2-balances">{data.liquidity?.filter(p=>BigInt(p.lpBalance)>0n).map(p=><div key={p.pair}><strong>{p.symbol0} / {p.symbol1} LP</strong><span>{formatUnits(BigInt(p.lpBalance),18)}</span></div>)}
        {!data.liquidity?.some(p=>BigInt(p.lpBalance)>0n)&&<p>No redeemable LP positions indexed.</p>}</div>
      <p className="phase2-muted">All balances are read at the same canonical indexed block. No USD values or synthetic investment returns are shown.</p></>}
    </section>
    <section className="phase2-panel phase2-form">
      <h2>Manage pool liquidity</h2><p>Add ERC-20 pairs or withdraw your entire redeemable LP position. Initial pool launch is handled separately due to locked LP and initial-price risk.</p>
      <label>Verified indexed pool<select value={pool} onChange={e=>{setPool(e.target.value);setPreview(null);}}>
        {directory?.pools.map(p=><option key={p.pair} value={p.pair}>{p.token0Symbol} / {p.token1Symbol} · {p.pair.slice(0,8)}</option>)}
      </select></label>
      <div className="phase2-switch"><button className={mode==="add"?"active":""} onClick={()=>{setMode("add");setPreview(null);}}>Add liquidity</button><button className={mode==="withdraw"?"active":""} onClick={()=>{setMode("withdraw");setPreview(null);}}>Withdraw 100%</button></div>
      {mode==="add"&&<div className="phase2-fields"><label>{t0?.symbol??"Token 0"} amount<input value={amountA} onChange={e=>{setAmountA(e.target.value);setPreview(null);}}/></label>
        <label>{t1?.symbol??"Token 1"} amount<input value={amountB} onChange={e=>{setAmountB(e.target.value);setPreview(null);}}/></label></div>}
      {mode==="withdraw"&&<p className="phase2-muted">LP balance {existing?.lpBalance??"—"} raw units; 100% means all LP tokens redeemable by your wallet, excluding protocol minimum permanently locked at initial creation.</p>}
      <label>Max slippage<select value={slippage} onChange={e=>{setSlippage(e.target.value);setPreview(null);}}><option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1">1%</option><option value="3">3%</option><option value="5">5%</option></select></label>
      <button className="phase2-primary" onClick={()=>void makePreview()} disabled={!data||busy||!pool}>{busy?"Checking…":"Preview actual pool state"}</button>
      {preview&&<div className="phase2-quote"><small>Simulated preview · reverified before signing</small><strong>{preview.label}</strong>
        <button onClick={()=>void execute()} className="phase2-primary" disabled={busy}>{busy?"Waiting for wallet…":"Approve or confirm "+(mode==="add"?"deposit":"full withdrawal")}</button></div>}
      {status&&<p className="phase2-success" role="status">{status}</p>}
      {error&&<p className="phase2-error" role="alert">{error}</p>}
      {transaction&&manifest&&<a className="phase2-text-link" target="_blank" rel="noreferrer" href={manifest.explorerUrl.replace(/\/$/,"")+"/tx/"+transaction}>View on-chain transaction <ExternalLink size={15}/></a>}
      <div className="phase2-warning"><ShieldAlert size={18}/> Transactions are only possible after the independently configured testnet and contract fingerprints are verified. Real funds are never accepted.</div>
    </section>
  </div>;
}
