"use client";

import { useEffect, useState } from "react";
import { Copy, ShieldAlert, Wallet, X } from "lucide-react";

type Provider = {
  request(input: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (name: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (name: string, handler: (...args: unknown[]) => void) => void;
};
const injected = (): Provider | null => (window as Window & { ethereum?: Provider }).ethereum ?? null;
const parseAccounts = (data: unknown): string =>
  Array.isArray(data) && typeof data[0] === "string" && /^0x[0-9a-fA-F]{40}$/.test(data[0]) ? data[0] : "";
const parseChainId = (data: unknown): number | null => {
  if (typeof data !== "string" || !/^0x[0-9a-fA-F]+$/.test(data)) return null;
  const chain = Number.parseInt(data, 16);
  return Number.isSafeInteger(chain) ? chain : null;
};
type Status = { status: string; chainId: number | null };
export function WalletConnect({ notify }: { notify: (message: string) => void }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [expectedChain, setExpectedChain] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    const provider = injected();
    fetch("/api/network/status", { cache: "no-store" })
      .then(r => r.json())
      .then((data: Status) => { if (active && data.status === "verified" && data.chainId) setExpectedChain(data.chainId); })
      .catch(() => {});
    if (!provider) return () => { active = false; };
    const changeAccounts = (...args: unknown[]) => { if (active) setAddress(parseAccounts(args[0])); };
    const changeChain = (...args: unknown[]) => { if (active) setChainId(parseChainId(args[0])); };
    const disconnected = () => { if (active) { setAddress(""); setChainId(null); } };
    provider.on?.("accountsChanged", changeAccounts);
    provider.on?.("chainChanged", changeChain);
    provider.on?.("disconnect", disconnected);
    Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" })
    ]).then(([accounts, chain]) => {
      if (active) { setAddress(parseAccounts(accounts)); setChainId(parseChainId(chain)); }
    }).catch(() => {});
    return () => {
      active = false;
      provider.removeListener?.("accountsChanged", changeAccounts);
      provider.removeListener?.("chainChanged", changeChain);
      provider.removeListener?.("disconnect", disconnected);
    };
  }, []);
  const mismatch = !!address && expectedChain !== null && chainId !== expectedChain;
  const verified = !!address && expectedChain !== null && chainId === expectedChain;
  async function connect() {
    const provider = injected();
    if (!provider) return notify("No browser EVM wallet found. Install a compatible wallet to connect.");
    setBusy(true);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = parseAccounts(accounts);
      if (!account) throw new Error("The wallet did not provide an address.");
      const chain = await provider.request({ method: "eth_chainId" });
      setAddress(account);
      setChainId(parseChainId(chain));
      setVisible(true);
      notify("Wallet address connected. Lidde Fun does not request spending approvals or transactions.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Wallet connection was rejected.");
    } finally { setBusy(false); }
  }
  function hide() {
    setAddress("");
    setVisible(false);
    notify("Wallet hidden in this interface. For a full dApp permission revoke, disconnect the website in your wallet.");
  }
  return <div className="wallet-control">
    <button className={"connect " + (address ? "wallet-connected" : "")}
      aria-expanded={visible} aria-haspopup="dialog"
      onClick={() => address ? setVisible(v => !v) : void connect()} disabled={busy}>
      {address ? <><Wallet size={15}/>{address.slice(0,6)}…{address.slice(-4)}</> : busy ? "Connecting…" : "Connect"}
    </button>
    {visible && address && <div className="wallet-panel" role="dialog" aria-label="Connected wallet details">
      <div className="wallet-panel-head"><strong>Connected address</strong><button aria-label="Close wallet details" onClick={() => setVisible(false)}><X size={16}/></button></div>
      <code>{address}</code>
      <div className={"wallet-chain " + (verified ? "ok" : "warning")}>
        {verified ? "Verified sandbox chain" : mismatch ? "Different chain connected" : "Sandbox not verified"}
        <small>Wallet chain: {chainId ?? "unknown"} · Expected: {expectedChain ?? "not configured"}</small>
      </div>
      {mismatch && <p className="wallet-warning"><ShieldAlert size={15}/> Switch to the verified sandbox in your wallet. No transactions are enabled here.</p>}
      <div className="wallet-panel-actions"><button onClick={async () => {
        try { await navigator.clipboard.writeText(address); notify("Address copied."); }
        catch { notify("Clipboard permission unavailable."); }
      }}><Copy size={14}/> Copy</button><button onClick={hide}><X size={14}/> Hide wallet</button></div>
    </div>}
  </div>;
}
