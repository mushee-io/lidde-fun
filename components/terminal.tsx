"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Check, Clock3, Coins, Copy,
  ExternalLink, Flame, Gift, Info, LayoutGrid, Menu, Plus, Search,
  ShieldCheck, Sparkles, Trophy, Wallet, X
} from "lucide-react";

type Tab = "Quests" | "Tokens" | "Perp" | "Leaderboard" | "Alerts";
type TokenFilter = "Trending" | "New" | "Active" | "Graduated";
type Task = "Hold" | "Trade" | "Follow" | "Share" | "Provide LP";
type Token = { symbol: string; label: string; avatar: string; color: string; price: string; cap: string; change: number; tags: TokenFilter[] };
type Quest = { id: string; title: string; description: string; reward: string; symbol: string; task: Task; creator: string; draft?: boolean; icon: string; tone: string };

const filters: TokenFilter[] = ["Trending", "New", "Active", "Graduated"];
const tabs: Tab[] = ["Alerts", "Tokens", "Perp", "Leaderboard", "Quests"];
const taskOptions: Task[] = ["Hold", "Trade", "Follow", "Share", "Provide LP"];
const storageKey = "lidde-fun-quests-drafts-v1";

const tokens: Token[] = [
  { symbol: "tVERY", label: "Test VERY", avatar: "V", color: "lilac", price: "0.4203", cap: "42.8K", change: 21.8, tags: ["Trending", "Active"] },
  { symbol: "tLIDD", label: "Lidde sample", avatar: "L", color: "lime", price: "0.0814", cap: "18.2K", change: 8.1, tags: ["Trending", "New"] },
  { symbol: "tFUN", label: "Fun preview", avatar: "F", color: "pink", price: "0.0345", cap: "9.6K", change: -4.4, tags: ["Trending", "New"] },
  { symbol: "tUSD", label: "Synthetic USD", avatar: "$", color: "teal", price: "1.0000", cap: "5.4K", change: 0, tags: ["Trending", "Active"] },
  { symbol: "MOON", label: "Moon mock", avatar: "☾", color: "lilac", price: "0.0068", cap: "4.7K", change: 15.3, tags: ["Trending", "New"] },
  { symbol: "LIME", label: "Lime preview", avatar: "✳", color: "lime", price: "0.0124", cap: "3.3K", change: -2.1, tags: ["Active"] },
  { symbol: "MINT", label: "Mint mock", avatar: "M", color: "teal", price: "0.0091", cap: "2.7K", change: 5.9, tags: ["New", "Graduated"] },
  { symbol: "ASTRO", label: "Astro mock", avatar: "★", color: "orange", price: "0.0028", cap: "1.9K", change: -11.3, tags: ["Active", "Graduated"] }
];

const examples: Quest[] = [
  { id: "example-hold", title: "Hold tVERY, tLIDD and tFUN", description: "Example mission: learn to hold synthetic assets to unlock a quest", reward: "20,000", symbol: "tFUN", task: "Hold", creator: "Lidde concept", icon: "✳", tone: "purple" },
  { id: "example-trade", title: "Make your first Lidde trade", description: "Example mission for future sandbox swaps", reward: "2,000", symbol: "tLIDD", task: "Trade", creator: "Example", icon: "⇄", tone: "amber" },
  { id: "example-liquidity", title: "Discover liquidity pools", description: "Example LP task; no deposits or payouts", reward: "1,000", symbol: "tVERY", task: "Provide LP", creator: "Example", icon: "◈", tone: "teal" },
  { id: "example-social", title: "Meet the Lidde community", description: "Example social task; no verification yet", reward: "500", symbol: "tFUN", task: "Follow", creator: "Example", icon: "★", tone: "blue" }
];

function Avatar({ text, tone = "purple" }: { text: string; tone?: string }) {
  return <span className={"avatar " + tone}>{text}</span>;
}

function WalletConnect({ notify }: { notify: (message: string) => void }) {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  async function connect() {
    if (address) {
      try { await navigator.clipboard.writeText(address); notify("Wallet address copied."); }
      catch { notify("Connected wallet: " + address); }
      return;
    }
    const injected = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum;
    if (!injected) return notify("No browser EVM wallet found. Install an EVM wallet to connect your address.");
    setBusy(true);
    try {
      const result = await injected.request({ method: "eth_requestAccounts" });
      const account = Array.isArray(result) && typeof result[0] === "string" ? result[0] : "";
      if (!account) throw new Error("The wallet returned no account.");
      setAddress(account);
      notify("Wallet connected for UI preview. No transactions or approvals were requested.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Wallet connection was unsuccessful.");
    } finally { setBusy(false); }
  }
  return <button className={"connect " + (address ? "wallet-connected" : "")} onClick={connect} disabled={busy}>
    {address ? <><Wallet size={15}/>{address.slice(0, 6)}…{address.slice(-4)}<Copy size={12}/></> : busy ? "Connecting…" : "Connect"}
  </button>;
}

export function Terminal() {
  const [tab, setTab] = useState<Tab>("Quests");
  const [filter, setFilter] = useState<TokenFilter>("Trending");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [split, setSplit] = useState<"normal" | "bottom" | "right">("normal");
  const [drafts, setDrafts] = useState<Quest[]>([]);
  const [create, setCreate] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftReward, setDraftReward] = useState("");
  const [draftSymbol, setDraftSymbol] = useState("tFUN");
  const [draftTask, setDraftTask] = useState<Task>("Hold");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setDrafts(saved.filter((q): q is Quest =>
        !!q && q.draft === true && typeof q.title === "string" &&
        typeof q.id === "string" && typeof q.reward === "string" &&
        typeof q.symbol === "string" && taskOptions.includes(q.task)
      ).slice(0, 30));
    } catch { /* local browser storage may be disabled */ }
  }, []);

  const normalized = search.toLowerCase().trim();
  const visibleTokens = useMemo(() => tokens.filter(t => t.tags.includes(filter) && (t.symbol + " " + t.label).toLowerCase().includes(normalized)), [filter, normalized]);
  const visibleQuests = [...drafts, ...examples].filter(q => (q.title + " " + q.description + " " + q.symbol).toLowerCase().includes(normalized));
  const feature = visibleQuests[0];
  const others = visibleQuests.slice(1);

  function changeTab(name: Tab) { setTab(name); setMobileMenu(false); }
  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftTitle.trim().slice(0, 90);
    const amount = Number(draftReward);
    if (name.length < 5 || !Number.isInteger(amount) || amount <= 0 || amount > 1000000000)
      return setNotice("A title of at least 5 characters and a whole-number reward of 1–1,000,000,000 are required.");
    const item: Quest = {
      id: "draft-" + Date.now(), title: name,
      description: "Local-only quest draft · no live claims or token rewards",
      reward: amount.toLocaleString("en-GB"), symbol: draftSymbol, task: draftTask,
      creator: "Your browser", draft: true, icon: "✦", tone: "purple"
    };
    const next = [item, ...drafts].slice(0, 30);
    setDrafts(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* in-memory fallback */ }
    setCreate(false); setDraftTitle(""); setDraftReward(""); setTab("Quests"); setSearch("");
    setNotice("Draft saved locally. It is not published or funded on-chain.");
  }
  function deleteDraft(id: string) {
    const next = drafts.filter(q => q.id !== id);
    setDrafts(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* in-memory fallback */ }
    setNotice("Local draft deleted.");
  }

  return <div className="app">
    <header className="topbar">
      <div className="brand-group">
        <button className="mobile-toggle" aria-label="Open sidebar" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21}/></button>
        <a className="brand" href="/"><span className="brand-symbol">↭</span><span>Lidde<span>Fun</span></span></a>
      </div>
      <label className="searchbox"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for tokens, quests or creators..." aria-label="Search tokens and quests"/><kbd>/</kbd></label>
      <div className="top-actions">
        <span className="preview-pill">● UI PREVIEW</span>
        <a className="network" href="https://github.com/mushee-io/lidde-dex" target="_blank" rel="noreferrer"><small>Network</small><strong>VERY ecosystem <ExternalLink size={12}/></strong></a>
        <button className="portfolio" onClick={() => setNotice("Portfolio indexer and balances are not yet connected.")}><small>—</small><span>Portfolio</span></button>
        <WalletConnect notify={setNotice}/>
      </div>
    </header>

    <div className="workspace">
      <aside className={"sidebar " + (mobileMenu ? "sidebar-open" : "")}>
        <nav className="navline" aria-label="Terminal sections">{tabs.map(t =>
          <button key={t} className={tab === t ? "on" : ""} onClick={() => changeTab(t)}>{t}</button>)}</nav>
        <div className="filters"><span>Crypto</span>{filters.map(f =>
          <button key={f} className={filter === f ? "on" : ""} onClick={() => {setFilter(f);changeTab("Tokens");}}>{f}</button>)}</div>
        <div className="sidebar-label"><Flame size={14}/> Illustrative token feed <span>DEMO</span></div>
        <div className="sidebar-scroll">
          {visibleTokens.length ? visibleTokens.map(t => <button className={"token-row " + (selectedToken?.symbol === t.symbol ? "selected" : "")} key={t.symbol}
            onClick={() => {setSelectedToken(t);changeTab("Tokens");}}>
            <Avatar text={t.avatar} tone={t.color}/>
            <span className="token-info"><strong>{t.symbol}</strong><small>{"$"}{t.price} mock</small></span>
            <span className="token-stats"><strong>{"$"}{t.cap}<small> MC</small></strong><small className={t.change >= 0 ? "up" : "down"}>{t.change >= 0 ? "▲" : "▼"} {Math.abs(t.change).toFixed(2)}%</small></span>
          </button>) : <p className="empty-small">No sample tokens found.</p>}
        </div>
        <div className="sidebar-actions"><button className={split === "bottom" ? "chosen" : ""} onClick={() => setSplit(split === "bottom" ? "normal" : "bottom")}><LayoutGrid size={15}/> Split bottom</button>
          <button className={split === "right" ? "chosen" : ""} onClick={() => setSplit(split === "right" ? "normal" : "right")}><Activity size={15}/> Split right</button></div>
      </aside>

      <main className={"main-content layout-" + split}>
        <div className="page-title">
          <div><div className="page-title-line">
            {tab === "Quests" ? <Trophy/> : tab === "Tokens" ? <Flame/> : tab === "Perp" ? <Activity/> : tab === "Leaderboard" ? <Trophy/> : <Bell/>}
            <h1>{tab === "Tokens" ? "Token discovery" : tab}</h1><span className="tag-preview">PREVIEW</span>
          </div><p>{tab === "Quests" ? "Complete tasks. Explore future on-chain rewards. 0 live campaigns."
            : tab === "Tokens" ? "Discover assets with a sample feed before verified market data is connected."
            : tab === "Perp" ? "Leveraged trading is unavailable until the risk engine passes review."
            : tab === "Alerts" ? "Wallet signals and watchlists are being planned."
            : "Standings require genuine, verifiable transaction data."}</p></div>
          {tab === "Quests" ? <button className="cta" onClick={() => setCreate(true)}><Plus size={19}/> Create quest</button>
            : <a className="ghost-cta" href="https://github.com/mushee-io/lidde-dex" target="_blank" rel="noreferrer">DEX source <ArrowUpRight size={16}/></a>}
        </div>
        {notice && <div className="notice" role="status"><Info size={16}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={15}/></button></div>}

        {tab === "Quests" && <section>
          <p className="disclaimer"><ShieldCheck size={15}/> Sample quests and saved drafts are not publicly funded; rewards, signatures and claims are not active.</p>
          {feature ? <article className="feature-card">
            <div className={"feature-top " + feature.tone}>
              <div className="feature-arts"><Avatar text={feature.icon} tone={feature.tone}/><span>◈</span></div>
              <div className="feature-title"><div><span className="status"><Clock3 size={13}/>{feature.draft ? "LOCAL DRAFT" : "EXAMPLE"}</span><small>No live claims</small></div><h2>{feature.title}</h2><p>{feature.description}</p></div>
            </div>
            <div className="feature-bottom"><div><small className="eyebrow">ILLUSTRATIVE REWARD</small><div className="reward"><Avatar text={feature.icon} tone={feature.tone}/><strong>{feature.reward} <span>{feature.symbol}</span></strong></div><div className="task-pills"><span><Gift size={13}/>{feature.task}</span><span><ShieldCheck size={13}/> Sample</span></div></div>
              <div className="claim"><div className="claimed"><strong>0</strong> live claims <span>unavailable</span></div><div className="progress"/><button onClick={() => setNotice("This is " + (feature.draft ? "a local draft" : "a sample mission") + ". Real quest settlement is not enabled.")}>Preview quest <ArrowRight size={17}/></button></div>
            </div>
          </article> : <div className="empty-state">No quests match your search.</div>}
          <div className="section-label"><span><Sparkles size={15}/> MORE QUESTS</span><small>{others.length} displayed</small></div>
          <div className="quest-grid">{others.map(q => <article key={q.id} className="mini-quest"><div className="mini-top">
            <Avatar text={q.icon} tone={q.tone}/><div className="mini-info"><span className="mini-meta"><b>{q.draft ? "DRAFT" : "EXAMPLE"}</b> by {q.creator}</span><h3>{q.title}</h3></div><div className="mini-reward"><small>REWARD</small><strong>{q.reward} {q.symbol}</strong></div>
          </div><div className="mini-bottom"><span className="task-pills"><span>{q.task}</span></span>{q.draft ? <button onClick={() => deleteDraft(q.id)}>Delete draft</button> : <small>not live</small>}</div><div className="progress"/></article>)}</div>
          <div className="roadmap"><span className="roadmap-icon"><Coins size={22}/></span><div><strong>Make the rewards real.</strong><p>First: public testnet receipts, task verification, campaign escrow, anti-sybil limits and safe claim settlement.</p></div><a href="https://github.com/mushee-io/lidde-fun/blob/main/MILESTONES.md" target="_blank" rel="noreferrer">Roadmap <ArrowUpRight size={15}/></a></div>
        </section>}

        {tab === "Tokens" && <section>
          <p className="disclaimer"><Info size={15}/> Every number below is fabricated UI sample data — not an actual trading price or market valuation.</p>
          {selectedToken && <div className="selected-token"><Avatar text={selectedToken.avatar} tone={selectedToken.color}/><div><small>SELECTED SAMPLE TOKEN</small><h2>{selectedToken.symbol}</h2><p>{selectedToken.label}</p></div><div className="price-selected"><strong>{"$"}{selectedToken.price}</strong><span className={selectedToken.change >= 0 ? "up" : "down"}>{selectedToken.change.toFixed(2)}% mock</span></div></div>}
          <div className="table-container"><table><thead><tr><th>Token</th><th>Mock price</th><th>Mock cap</th><th>Mock 24h</th><th>Action</th></tr></thead><tbody>{visibleTokens.map(t => <tr key={t.symbol}>
            <td><div className="table-token"><Avatar text={t.avatar} tone={t.color}/><span><strong>{t.symbol}</strong><small>{t.label}</small></span></div></td>
            <td>{"$"}{t.price}</td><td>{"$"}{t.cap}</td><td className={t.change >= 0 ? "up" : "down"}>{t.change.toFixed(2)}%</td>
            <td><button onClick={() => {setSelectedToken(t);setNotice("Trade execution is disabled. The displayed asset is only an illustrative fixture.");}}>Inspect <ArrowRight size={13}/></button></td>
          </tr>)}</tbody></table></div>
          <div className="integration"><h3><Activity size={19}/> Connect genuine Lidde DEX market data</h3><p>When the isolated testnet, indexer, contract addresses and token registry are verifiably deployed, token discovery can use canonical indexed events instead of these fixtures.</p><a href="https://github.com/mushee-io/lidde-dex" target="_blank" rel="noreferrer">View source <ExternalLink size={14}/></a></div>
        </section>}

        {(tab === "Alerts" || tab === "Perp" || tab === "Leaderboard") && <section className="coming"><span className="coming-icon">{tab === "Alerts" ? <Bell size={32}/> : tab === "Perp" ? <Activity size={32}/> : <Trophy size={32}/>}</span><small>NOT ENABLED · ROADMAP</small>
          <h2>{tab === "Alerts" ? "Your signals, your terms." : tab === "Perp" ? "Risk controls before leverage." : "Earn your place with real activity."}</h2>
          <p>{tab === "Alerts" ? "Wallet activity alerts, customizable watchlists, price triggers, notification routing and history will be implemented after a trusted indexer exists."
            : tab === "Perp" ? "No leveraged orders, liquidation engines, oracle assumptions or synthetic PnL will be presented as a working market before review and deployment."
            : "Leaderboard calculations will be reproducible from on-chain events and will distinguish genuine testers from scripts and wash trading."}</p>
          <a href="https://github.com/mushee-io/lidde-fun/blob/main/MILESTONES.md" target="_blank" rel="noreferrer">See milestone plan <ArrowUpRight size={15}/></a>
        </section>}
      </main>
    </div>
    <footer className="ticker"><span className="ticker-demo">● DEMO DATA</span>{tokens.slice(0, 7).map(t => <button key={t.symbol} onClick={() => {setSelectedToken(t);setTab("Tokens");}}><b>{t.symbol}</b><span>{"$"}{t.price}</span><span className={t.change >= 0 ? "up" : "down"}>{t.change >= 0 ? "▲" : "▼"}{Math.abs(t.change).toFixed(1)}%</span></button>)}<a href="https://github.com/mushee-io/lidde-fun" target="_blank" rel="noreferrer">GitHub</a></footer>

    {create && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setCreate(false);}}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div className="modal-head"><div><span className="eyebrow">LOCAL UI PREVIEW</span><h2 id="create-title">Create a quest draft</h2></div><button aria-label="Close" onClick={() => setCreate(false)}><X size={20}/></button></div>
        <p>This saves a draft to your browser, not a funded campaign. No wallet signature is required.</p>
        <form onSubmit={saveDraft}>
          <label>Quest name<input required minLength={5} maxLength={90} placeholder="e.g. Explore Lidde pools" value={draftTitle} onChange={e => setDraftTitle(e.target.value)}/></label>
          <div className="form-two"><label>Illustrative reward<input type="number" required min="1" max="1000000000" step="1" placeholder="20000" value={draftReward} onChange={e => setDraftReward(e.target.value)}/></label>
            <label>Demo token<select value={draftSymbol} onChange={e => setDraftSymbol(e.target.value)}><option value="tFUN">tFUN</option><option value="tLIDD">tLIDD</option><option value="tVERY">tVERY</option></select></label></div>
          <label>Sample task<select value={draftTask} onChange={e => setDraftTask(e.target.value as Task)}>{taskOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
          <div className="modal-warning"><ShieldCheck size={16}/> Real quests need reviewed escrow contracts, funding, secure task verification and anti-sybil checks.</div>
          <button className="cta" type="submit"><Plus size={17}/> Save local draft</button>
        </form>
      </div>
    </div>}
  </div>;
}
