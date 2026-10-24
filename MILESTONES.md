# LIDDE FUN — COMPLETE ENGINEERING MILESTONES (M01–M20)

**Product:** Lidde Fun — a trading-discovery, token-launch, social-quests and rewards terminal for the VERY ecosystem, with native integration into the independently developed Lidde DEX.

**Reference:** PurrFlow's information architecture (left-hand discovery panel, quest focus, account actions and bottom ticker). Implement original source, components, content and brand. Do not copy third-party proprietary assets or frontend code.

**Status as of 24 October 2026:**
- M01: initial frontend preview committed; source files are present. GitHub Actions run #1 passed TypeScript and production build checks. No Vercel deployment is claimed by this document.
- M02: **initial frontend navigation, keyboard handling and responsive route pages implemented**, but browser accessibility and full component-system work remains.
- M03: **read-only pinned testnet identity and contract-bytecode checks implemented**; the isolated network remains unconfigured, undeployed and unverified.
- M04: **wallet account/chain event handling and a read-only connection panel implemented**; secure creator sessions, data controls and multiwallet support remain.
- M05: **schema-gated canonical Lidde DEX indexer reader and verified pool viewer implemented**; standalone persistent market indexing and live sources remain unconfigured.
- M06: **on-chain token/pool discovery plus bounded authenticated Pair Sync reserve-price observations implemented**; production-grade trending, USD pricing and full historical swap-derived OHLC remain pending.
- M07: **guarded capped sandbox ERC-20 creator, creator-bound first-pool launch with initial price acknowledgement and exact approvals implemented**; creator deployment and external-wallet test receipts remain pending.
- M08: **wallet-signed token-token sandbox swap code with exact approvals and source checks implemented**; no public testnet exists yet and real end-to-end receipts have not been demonstrated.
- M09: **indexed balance, LP holdings and existing-pool add/full-withdraw transaction source implemented**; unverified sandbox remains disabled and comprehensive external-wallet acceptance tests pending.
- M10: **signed durable quest drafts, step rules and creator interface implemented**; dedicated database provisioning/migration and browser acceptance tests pending.
- M11: **non-upgradeable EIP-712 QuestEscrow, vault registration, escrow funding and expiry-refunds implemented in source**; sandbox contract deployment and independent audits pending.
- M12: **multi-task hold, LP and swap evidence-verification implemented**; proof-provider attestation security review, abuse stress tests and public receipts pending.
- M13: **typed-wallet claim authorization, duplicate claim prevention and on-chain claim UI built**; live settlement verification and anti-Sybil effectiveness review pending.
- M14: **canonical QuestEscrow-claim XP ingestion, deterministic UTC rankings and signed opt-in profiles implemented**; rankings are empty or unavailable until the public indexed sandbox is configured, and unique-person Sybil control is not established.
- M15: **shareable quest pages, opt-in wallet referral attribution, QR onboarding and recorded eligible-claim conversion implemented**; social OAuth integrations, partner moderation and paid acquisition pipelines are not connected.
- M16: **wallet-scoped watchlists, bounded canonical pair-price/new-pair evaluation, deduped observations, export and deletion implemented**; scheduled workers, push/email/Telegram delivery and reorg reconciliation of historical alerts remain outstanding.
- M17: **read-only guarded trade lab with verified pool reserve simulation, slippage/budget controls and explicit spot handoff implemented**; copy trading, delegated accounts, automation and live funds deliberately disabled.
- M18–M20: **planned or separately gated**; do not claim a live launch without independent proof.
- The Lidde DEX repository currently has a planned isolated EVM test network. Its network registry is not configured; it must not be called a working public testnet.
- The VERY live network is not to be relabelled as a sandbox. No mainnet trade, reward, wallet-signer, lending or leverage transaction is enabled by the first Lidde Fun commit.
- The existing UI token numbers are fabricated placeholders marked as demo; local quest drafts are stored in localStorage, with no public campaign, token emission, identity verification or reward claim.
- All external systems, fees and economic token parameters are proposals requiring separate approvals and review.

## Product areas and navigation target

1. **Tokens:** Trending, New, Active and Graduated; verified token registry, detail screen, price chart, liquidity, market history, trades, holders and risk disclosures.
2. **Quests:** Discover campaigns, eligibility, multi-step tasks, verification evidence, on-chain escrow, gas-aware claims and safety.
3. **Launch:** Token creator, verified templates, initial token distribution, AMM liquidity launch, optional vesting and creator dashboard.
4. **Spot:** Lidde DEX swap, quotes, slippage, approvals, transaction receipts, position tracking and safe routing.
5. **Portfolio:** Assets, LP positions, rewards, history, task status and risk notices.
6. **Alerts:** Watchlists, real on-chain events, price and wallet threshold notifications.
7. **Leaderboard:** Reproducible activity metrics, task score, creator contributions and Sybil-resistant eligibility.
8. **Perp (gated):** Only after a distinct audited risk-engine, oracles, margin and liquidation system pass their own release criteria.
9. **Operator:** Campaign policies, incident controls, abuse, analytics, moderation, finance and treasury reconciliation.

---

## PHASE A — FRONTEND & VERIFIED FOUNDATION

### Milestone 01 — Lidde Fun terminal prototype

**Goal:** A standalone deployable Next.js product shell that faithfully delivers the broad UI interaction patterns while making preview status explicit.

**Detailed work**
- **1.1** Establish separate mushee-io/lidde-fun repository with App Router, TypeScript, React and production scripts.
- **1.2** Implement Lidde Fun header, logo treatment, global search, account area, responsive navigation and sticky bottom ticker.
- **1.3** Add desktop token-discovery sidebar with Trending/New/Active/Graduated filters and selection state.
- **1.4** Build quest hero card, supporting cards, task badges, reward labels and clearly disabled claims.
- **1.5** Add functioning quest-draft modal: title, example task type, preview reward amount and display token.
- **1.6** Persist bounded local drafts in the browser; support draft deletion and state recovery.
- **1.7** Add a wallet-account connect action that requests only a public address, not approval or transaction signatures.
- **1.8** Provide Tokens, Alerts, Perp and Leaderboard tabs without implying unavailable modules are active.
- **1.9** Make fabricated token prices and example quests conspicuously labelled; remove false launch claims and fictitious public activity.
- **1.10** Prepare README, environment separation, ignore rules and developer scripts.

**Deliverables:** Working UI source, sample-token fixtures, local draft workflow, read-only wallet account display, responsive CSS.

**Acceptance:** New contributor can install dependencies and run/build the app; browser interactions work; no network transaction or private-key flow is reachable. **Status: source pushed; CI TypeScript and production build passed; visual browser testing and Vercel deployment remain pending.**

### Milestone 02 — UI design system, accessibility and engineering quality

**Goal:** A polished and maintainable terminal suitable for mobile and desktop real users.

**Detailed work**
- **2.1** Extract reusable primitives: Button, Badge, Dialog, TokenAvatar, QuestCard, Modal, PriceChange, Skeleton and EmptyState.
- **2.2** Define consistent tokens for color, typography, spacing, radii, elevations, charts and semantic status.
- **2.3** Add keyboard shortcuts, accessible focus control, close-on-Escape for dialogs and full keyboard navigation.
- **2.4** Perform responsive review for 320px, 375px, 768px, 1024px, 1440px and ultrawide, including sticky ticker and sidebar overlap.
- **2.5** Add route-based navigation for token detail, creator, quest detail, market detail, portfolio and settings.
- **2.6** Implement query-state URLs and back-button behavior; avoid losing filters on navigation.
- **2.7** Create mock-api contracts and data model schemas separate from UI fixtures; disallow accidental fixture reuse in production.
- **2.8** Add unit tests for filters, quest-draft input validation, modal persistence, search, sorting and number formatting.
- **2.9** Add Playwright end-to-end smoke: desktop/mobile, wallet unavailable, dialog errors, sidebar, zero-results and token selections.
- **2.10** Add CI for lint, typecheck, build, tests, dependency audit and preview deployment.
- **2.11** Optimize Core Web Vitals, font fallback, image loading and data-update responsiveness.
- **2.12** Review WCAG 2.2 AA contrast, landmarks, form labels, screen-reader messages and motion preferences.

**Deliverables:** Component library, route structure, tests, CI and repeatable visual-regression snapshots.

**Acceptance:** Production build and tests pass in CI; supported devices have no inaccessible controls or clipped critical actions.

### Milestone 03 — Real isolated testnet and Lidde DEX connectivity

**Goal:** Establish real network provenance before any features call themselves live.

**Detailed work**
- **3.1** Identify the authoritative Lidde DEX contract sources, testnet deployment manifest, chain genesis, immutable chain ID and artifact commit SHA.
- **3.2** Provision an actual valueless isolated EVM test network or obtain verified official testnet parameters if a real testnet becomes available.
- **3.3** Verify externally reachable HTTPS RPC, explorer and wallet add-chain metadata; keep VERY production chain distinct.
- **3.4** Publish signed deployment manifests for the testnet Factory, Router, Pair, wrapped native test asset, faucet and token registry.
- **3.5** Use read-only environment config for network lists; reject missing RPC, mismatched chain IDs, incorrect codehashes and unknown ABI versions.
- **3.6** Integrate Lidde Fun with actual Lidde DEX testnet APIs only after independently verifying canonical chain state.
- **3.7** Separate local simulation data, staging sandbox and mainnet; no fallback from testnet requests to mainnet.
- **3.8** Add RPC failover, timeout, rate limiting, exponential backoff and a visible degraded-service banner.
- **3.9** Add production-grade RPC method allowlist; never expose admin, impersonation or node-private signing endpoints.
- **3.10** Verify external account receipts for faucet claim, token transfer, swap, LP creation and full LP withdrawal.
- **3.11** Add an operator network health page with observed block height, latency, last indexed block and verified contract hashes.

**Deliverables:** Versioned network manifest, public testnet health endpoints, verified explorer links, integration fixtures and chain-check middleware.

**Acceptance:** Independent testers obtain receipts from an authentic persistent zero-value network; no testnet wallet flow can accidentally target chain 4613 or any live-value network.

### Milestone 04 — Wallet, sessions, account privacy and portfolio identity

**Goal:** Wallet UX that is safe, recoverable and suitable for quest and trading users.

**Detailed work**
- **4.1** Add supported EVM wallet chooser (injected wallets plus WalletConnect where authorized), provider event handling and network prompts.
- **4.2** Implement reconnect, account change, network change, multi-tab synchronization and wallet rejection cases.
- **4.3** Introduce EIP-4361 SIWE-style nonce-bound authentication for optional off-chain preferences, without equating a public address with a verified person.
- **4.4** Store short-lived sessions with HttpOnly cookies, CSRF boundaries, expiration, logout and device/session revocation.
- **4.5** Build a user account hub: addresses, assets, watchlist, saved quests, campaigns, claims and transaction log.
- **4.6** Bind each request to expected chain, wallet, contract and expiry; enforce server-side access checks on creator actions.
- **4.7** Label token contract risk, chain ambiguity and wallet signature purpose before any signing.
- **4.8** Support read-only address lookup without requiring connection.
- **4.9** Prevent storing seed phrases, raw keys, signed transaction payloads and sensitive identifiers in browser logs.
- **4.10** Add copy-address, disconnect UI, permission errors, hardware wallet guidance and mobile wallet deep links.

**Deliverables:** Wallet provider framework, optional secure sessions, account center, threat model and user-control settings.

**Acceptance:** Connection/cancellation/account-change tests pass; backend cannot impersonate user wallets; no real-value interaction hidden inside session login.

---

## PHASE B — TOKEN DISCOVERY & EXCHANGE

### Milestone 05 — Canonical data indexing, registry and quality controls

**Goal:** One reproducible source of truth for tokens, markets, swaps and liquidity.

**Detailed work**
- **5.1** Create Neon/Postgres schemas for chains, contracts, tokens, pairs, pools, blocks, events, candles, liquidity actions and processing cursors.
- **5.2** Build a confirmed-block indexer for ERC-20 transfers, pool creation, Pair Sync, Mint, Burn and Swap logs.
- **5.3** Track chain reorgs, idempotent retries, finality depths, event deduplication and reconstruction after indexer restart.
- **5.4** Validate token symbol/name/decimals, contract bytecode, deployer, proxy implementation, interface compatibility and supply.
- **5.5** Maintain token lifecycle classifications (new, active, graduated), definitions and deterministic inclusion/exclusion rules.
- **5.6** Calculate market depth, volume, price and liquidity using actual reserves and source-labelled reference pricing; null out USD equivalents when unavailable.
- **5.7** Add signed registry moderation actions: verified, unverified, blocked for malicious behavior; no paid listing disguised as independent verification.
- **5.8** Publish cursor freshness, chain height, source, confidence, block reference and potential inconsistency warnings.
- **5.9** Implement token/pair APIs with cursor pagination, rate limiting, anti-scraping budgets, caching and structured errors.
- **5.10** Write replay/reconciliation tools to reproduce aggregates from raw event logs.

**Deliverables:** Indexer, database migrations, source-of-truth APIs, verified token registry and data provenance.

**Acceptance:** Every displayed live volume, cap, token price and transaction points to a reproducible source and block range. No invented data is presented as live.

### Milestone 06 — Real-time discovery, charts and market analytics

**Goal:** Make the first live consumer-facing token-discovery terminal.

**Detailed work**
- **6.1** Replace sample feed with indexed token metadata, recent listings, liquidity thresholds and computed activity.
- **6.2** Define transparent Trending scoring using documented, weighted factors; avoid selling fabricated trend ranks.
- **6.3** Add listing cards and sortable tables for price, market cap, volume, liquidity, holders, age, deployment and price-change windows.
- **6.4** Add multi-timeframe OHLC candles sourced from actual swaps, with sparse-pair warnings and accurate currency/unit labels.
- **6.5** Implement token detail views with contract address, pair address, supply, verified source, explorer links and pool health.
- **6.6** Add newest-pair feed, search by token/contract address, token watchlist and filters by liquidity and trading activity.
- **6.7** Support creator/team token labels only with evidence; warn on mint authority, owner privileges, concentration and liquidity risk.
- **6.8** Stream canonical updates via server-sent events or bounded polling with reconnection/backpressure.
- **6.9** Detect stale price feeds, impossible numbers, reverted swaps, low-liquidity spikes and price-manipulation flags.
- **6.10** Add analytics provenance metadata and data export for inspection.

**Deliverables:** Token discovery, token details, verifiable charts and alert-ready event streams.

**Acceptance:** External testers can trace on-screen numbers to actual test chain events and observe deterministic updates after test swaps.

### Milestone 07 — Token creator, launchpad and risk disclosure

**Goal:** A responsible first-party launch workflow integrated with Lidde DEX contracts.

**Detailed work**
- **7.1** Integrate the existing Lidde DEX testnet ERC-20 creator and factory interfaces, verifying deployed bytecode/codehash before showing launch actions.
- **7.2** Offer audited template presets for symbol, decimals, initial supply, mint cap and transfer behavior; no arbitrary unsafe hidden privilege.
- **7.3** Validate names, addresses, ticker collisions, impersonation risks, metadata and image uploads.
- **7.4** Provide a launch preview listing owner permissions, future mint powers, mint cap, fee policy and any vesting contracts.
- **7.5** Simulate deployment and gas; require explicit wallet confirmation and a post-deployment explorer receipt.
- **7.6** Integrate creation of first AMM pair, test liquidity deposit, ratio checks, LP ownership and optional time lock.
- **7.7** Build creator console: launched tokens, metadata, verified contract, pool liquidity, token supply and launch status.
- **7.8** Add static/code-level automated checks but never call them a completed independent audit.
- **7.9** Require independent security review of any liquidity locks or creator fee splits before value-bearing production.
- **7.10** Separate token promotional claims from objective registry indicators and show unverified-token warnings.

**Deliverables:** Testnet launch form, creator console, listing transitions, safety notices and deployment receipts.

**Acceptance:** A new wallet can create a *valueless sandbox* token, seed pool liquidity and observe the newly indexed listing on Lidde Fun.

### Milestone 08 — Lidde DEX spot trading, quotes and execution

**Goal:** Execute genuine testnet swaps safely from token discovery.

**Detailed work**
- **8.1** Add a buy/sell panel for each token tied to verified pair/router addresses from Milestone 03.
- **8.2** Discover available routes through real Lidde DEX pairs; never route to spoofed or unknown contracts.
- **8.3** Provide amount, estimated output, USD-equivalent where grounded, pool reserves, price impact, route path and fees.
- **8.4** Implement slippage presets, recipient validation, deadline enforcement, minimum received and exact allowance handling.
- **8.5** Simulate before signing; show gas estimate, actual contract, token approvals and irreversible transaction warning.
- **8.6** Support wallet rejection, wrong chain, token transfer failures, sandwich exposure, reverted transactions and indexer lag.
- **8.7** Index pending/confirmed/finalized/reverted swap receipts; persist local transaction history.
- **8.8** Add limit orders only if a verified compatible testnet escrow and execution engine exists; otherwise keep disabled.
- **8.9** Ensure users can revoke lingering allowances, see router fee rules and avoid unlimited token approvals by default.
- **8.10** Stress-test no-liquidity markets, fee-on-transfer tokens, malformed decimals, extreme prices and network outages.
- **8.11** Mainnet trading remains a separate release requiring security signoff, legal review where necessary and explicit consent.

**Deliverables:** Spot terminal, route estimator, swap receipt view, allowance UI and resilient transaction states.

**Acceptance:** Independent wallets can execute swaps on a verified valueless network, compare quotes with receipts and unwind allowances without mainnet interaction.

### Milestone 09 — Portfolio, LP positions and transaction insights

**Goal:** A wallet-centered view that reconciles actual chain holdings.

**Detailed work**
- **9.1** Index connected wallet fungible asset balances and canonical testnet pair ownership.
- **9.2** Show token balances, timestamps, liquidity share, underlying reserves and per-position withdrawal estimates.
- **9.3** Add deposit, add-liquidity, remove-liquidity and full-LP-exit flows invoking reviewed existing router code.
- **9.4** Explain LP impermanent loss, token weighting, spot price drift and minimum received.
- **9.5** Include approval statuses, transaction lifecycle and explorer receipts.
- **9.6** Compute testnet PnL only with explicitly labelled synthetic valuation assumptions; omit unknown costs.
- **9.7** Add filters and downloads of portfolio transactions by chain, type and block range.
- **9.8** Reconcile portfolio state at the same confirmed block as pool analytics; never mix lagged reserves with fresh balances without disclosure.
- **9.9** Build empty states and wrong-chain warnings, including a read-only disconnected portfolio search.
- **9.10** Validate multi-wallet LP shares, repeated swaps and full withdrawal after a test chain restart.

**Deliverables:** Portfolio dashboard, LP actions, receipt history and explainable synthetic PnL.

**Acceptance:** Test wallet completes deposit, trade and total LP withdrawal; positions and wallet balances reconcile at consistent block heights.

---

## PHASE C — QUEST CREATOR, ESCROW & REAL REWARDS

### Milestone 10 — Quest builder, templates and publication workflow

**Goal:** Convert local modal drafts into a structured multi-step campaign management system.

**Detailed work**
- **10.1** Define campaign schemas: creator, chain, token, reward budget, reward per claim, max claims, dates, whitelist mode, metadata version and policy state.
- **10.2** Support task templates for token hold, swap, LP deposit, follow, share, wallet age and custom signed-attestation tasks.
- **10.3** Support sequential and parallel task groups, minimum durations, proof expiry and task dependency graphs.
- **10.4** Add creator sign-in, draft persistence in database, editing, media uploads and review history.
- **10.5** Build campaign preview with example reward calculation, task conditions, eligibility and unavoidable terms.
- **10.6** Provide estimated cost, funding requirement, claim gas and minimum campaign duration.
- **10.7** Add publishing lifecycle: draft, review, funding, scheduled, active, paused, ended, exhausted, archived.
- **10.8** Add anti-impersonation review, deceptive-task moderation and token-source warnings before publication.
- **10.9** Add event-driven creator statistics that distinguish participation from verified completions and settled claims.
- **10.10** Build accessible mobile task progress and creator error-recovery flows.

**Deliverables:** Quest database, schema validation, public/creator views, publication states and API access control.

**Acceptance:** Authorized creators can draft, revise, submit for review and preview quests without acquiring unauthorized escrow or falsely activating unfunded campaigns.

### Milestone 11 — On-chain quest vault and reward escrow

**Goal:** Guarantee reward availability through explicit, auditable escrow rather than off-chain promises.

**Detailed work**
- **11.1** Define approved reward token list (only sandbox ERC-20s for testnet), decimals, fee behavior and malicious-token exclusions.
- **11.2** Implement a Solidity escrow/vault for each campaign or auditable shared campaigns with per-campaign accounting.
- **11.3** Bind each campaign to chain ID, creator, nonce, funding token, max budget, per-claim or variable distribution rule and final deadline.
- **11.4** Support funding with exact token allowance, safe transfer delta accounting and post-transaction verification.
- **11.5** Implement remaining-budget invariant: claimable obligations never exceed held eligible escrow.
- **11.6** Ensure safe refunds of undistributed balances only when claims are closed or expired, with disclosed cooldown and settlement conditions.
- **11.7** Add reentrancy protection, replay-resistant identifiers, role separation and pause/incident restrictions scoped by campaign.
- **11.8** Emit campaign funded, budget changed, claimed, refunded and campaign closed events.
- **11.9** Add unit, fuzz, invariant and malicious ERC-20 token tests.
- **11.10** Obtain independent code review before any real-value campaign and document upgrade authority/timelock if upgradeability is used.

**Deliverables:** QuestEscrow contracts, ABI, invariant suite, funding UX, indexer events and refund paths.

**Acceptance:** Sandbox campaigns only become active after confirmed actual escrow funding; exact claim limits are enforced under concurrent claim attempts.

### Milestone 12 — Task verification and attestation pipeline

**Goal:** Make quest completions verifiable and resistant to false claims.

**Detailed work**
- **12.1** Verify on-chain holds using balance snapshots at defined blocks and duration rules; prevent instant borrow/flash hold exploits where possible.
- **12.2** Verify swaps by chain ID, approved pool/router, canonical tx log, wallet owner, minimum notional and finality.
- **12.3** Verify LP tasks through mint/burn and holdings over a declared time interval.
- **12.4** For social actions, use authorized provider OAuth/webhooks where available; never claim deterministic verification from scraped screenshots.
- **12.5** Define signed attestations binding campaign, task, wallet, chain, time window, proof hash, nonce, expiry and oracle key.
- **12.6** Build an independent evidence store with audit logs and selective public proof visibility.
- **12.7** Handle reorgs, reverted swaps, self-swaps, transfers between owned accounts, duplicate completions and revoked attestations.
- **12.8** Support oracle key rotation, threshold signing or independently reviewed proof pipeline when feasible.
- **12.9** Allow user appeal for incorrect eligibility outcomes without revealing private social account data publicly.
- **12.10** Publish which proof types are cryptographically verified versus trusted-provider assertions.

**Deliverables:** Verification workers, attestation service, public proof schemas and creator proof rules.

**Acceptance:** Unrelated wallets, reused transactions, unfinalized events and forged attestations cannot produce valid completion proofs in negative tests.

### Milestone 13 — Rewards claiming, Sybil controls and settlement

**Goal:** Allow legitimate eligible wallets to claim exactly once without double spending or invisible centralized payouts.

**Detailed work**
- **13.1** Design claim contract interface accepting either signed eligibility proofs or Merkle proof trees tied to campaign version and chain.
- **13.2** Enforce nullifier or nonce use, per-wallet and per-campaign limits, expiry and exact escrow debit.
- **13.3** Support deterministic claim status: ineligible, incomplete, eligible, queued, broadcast, confirmed, finalized, failed and already-claimed.
- **13.4** Add gas estimation, testnet sponsored claims if budgeted and guarded fallback to wallet-paid test gas.
- **13.5** Build an anti-sybil scoring and rate-limiting system that is transparent, appealable and avoids treating one metric as identity proof.
- **13.6** Monitor farming across wallets, repeated tiny wash trades, circular funding and automation; flag rather than automatically confiscating legitimate funds.
- **13.7** Add campaign budget reconciliation that matches escrow balances with verified settlement receipts.
- **13.8** Implement reorg-aware claim indexing and avoid retrying unknown-status broadcasts blindly.
- **13.9** Add creator tools for end-of-campaign refund, disputes and treasury reporting.
- **13.10** Test claims under concurrency, duplicate requests, malicious receiver contracts, wrong chain and invalid proofs.

**Deliverables:** Reward claim contract/service, claim UI, Sybil safeguards, ledger and finality-aware reconciliation.

**Acceptance:** Independent wallets complete test tasks, claim actual **valueless test tokens** from a funded test vault and confirm receipts; duplicate and over-budget claims revert safely.

---

## PHASE D — RETENTION, GROWTH & ACTIVE TRADERS

### Milestone 14 — Reputation, XP, seasonal programs and leaderboards

**Goal:** Give traders and community users transparent reasons to return.

**Detailed work**
- **14.1** Specify off-chain XP event sources, point weights, caps, season dates and clearly nonfinancial redemption expectations.
- **14.2** Build event-reconciled scores for eligible swaps, unique tasks, real liquidity activity and account participation.
- **14.3** Avoid rewarding artificial gross volume; account for economically meaningful activity, referral abuse and self-trading.
- **14.4** Implement weekly, monthly, seasonal and all-time rankings with a fully versioned scoring algorithm.
- **14.5** Add opt-in pseudonymous profiles, hide-address preferences, nickname moderation and account deletion for off-chain records.
- **14.6** Publish rank computation snapshots, Sybil-filter flags, delayed finality and leaderboard disputes/appeals.
- **14.7** Add achievements and optional soulbound badges only after wallet/signature/access reviews.
- **14.8** Define what XP is not: it is not automatically a token, transferable asset, guaranteed airdrop or financial entitlement.
- **14.9** Model rewards so incentive cost, budget and wash-trading sensitivity are understood before launch.
- **14.10** Provide a score explorer showing exactly which confirmed events contributed to an account's ranking.

**Deliverables:** Reproducible scoring ledger, seasons, eligibility panels and leaderboards.

**Acceptance:** Reindexing the same event set yields identical ranks; no XP payout is misrepresented as an assured future token allocation.

### Milestone 15 — Community quests, creator distribution and referrals

**Goal:** Expand campaign reach without creating uncontrolled reward farming.

**Detailed work**
- **15.1** Build shareable quest pages, OG previews, referral links and QR onboarding.
- **15.2** Introduce referral proof linked to meaningful account onboarding, not link clicks alone.
- **15.3** Limit self-referrals, bot clusters, repeated funded wallets and incentivized spam.
- **15.4** Create approved integrations for Discord, Telegram and X using provider terms and account permissions.
- **15.5** Add partner/creator portals: branded campaign pages, approved media, budgets, task counts and moderation status.
- **15.6** Launch optional invite-only creator cohort with review and transparent promotion policy.
- **15.7** Implement discovery ranking labels distinguishing paid placement, community features and algorithmic results.
- **15.8** Add opt-in reminder notifications and consent withdrawal controls.
- **15.9** Track onboarding conversion, verified completion, repeat active users and real campaign cost per eligible participant.
- **15.10** Establish growth abuse thresholds and account appeals with privacy safeguards.

**Deliverables:** Campaign sharing, partner workflows, provider integrations and attributable funnel metrics.

**Acceptance:** Legitimate new users can discover, join and complete campaigns; repeat link spam and self-referral farms do not produce automatic rewards.

### Milestone 16 — Advanced signals, alerts and watchlists

**Goal:** Turn Lidde Fun into a habit-forming market-monitoring tool grounded in real data.

**Detailed work**
- **16.1** Create watchlists for contracts, tokens, wallets and pools scoped to user sessions.
- **16.2** Add price thresholds, large liquidity changes, new pair creation, volume spikes and creator-token events.
- **16.3** Index only confirmed and appropriately final events; carry timestamp, block, chain and data freshness.
- **16.4** Add quiet hours, per-rule cooldown, deduplication and alert delivery history.
- **16.5** Support opt-in email, Telegram or web push with verified channel ownership; never send secrets or raw wallet signatures.
- **16.6** Rate-limit alert fan-out to contain infrastructure cost and protect external provider quotas.
- **16.7** Build a rule builder with simulation, frequency preview, disable and deletion.
- **16.8** Include security alerts for approvals, suspicious token permission changes and unusual wallet exposure when reliable data exists.
- **16.9** Allow users to export/delete watchlists and notification data.
- **16.10** Benchmark indexing lag, alert delay and false positives in testnet load conditions.

**Deliverables:** Rules engine, notification adapters, delivery logs and user controls.

**Acceptance:** Test events produce one correct alert within defined measured latency; reorgs do not cause misleading permanent alerts.

### Milestone 17 — Advanced trading utilities: quick buys, automation and copy-trading research

**Goal:** Evaluate advanced terminal features without creating unsafe or deceptive execution paths.

**Detailed work**
- **17.1** Prototype configurable fast-trade panels using the same guarded quote/simulate/approve/sign flow as spot trading.
- **17.2** Analyze mempool and newly created pools for contract risk, liquidity depth, sell restrictions and deployment provenance.
- **17.3** Add maximum per-trade budget, slippage, allowable tokens, account limits and explicit user confirmation for every authorization mode.
- **17.4** Research copy-trade strategies using opt-in monitored wallets; distinguish viewing another wallet from authorization to mirror it.
- **17.5** Do not promise guaranteed fill, arbitrage, profit or MEV protection.
- **17.6** Simulate latency, route slippage, priority fees, stale prices, malicious routers and transaction cancellation in valueless tests.
- **17.7** Keep server-side custodial wallets and delegated spend permissions disabled until threat model, independent review and revocation policy exist.
- **17.8** Add position/trade-level kill switches and explicit per-token allocation constraints.
- **17.9** Provide transparent audit logs of automation intent, signature, execution decision and user revocation.
- **17.10** Separate research-only simulation performance from any actual on-chain execution metrics.

**Deliverables:** Isolated advanced terminal previews, execution-control specs, simulations and safety audit trail.

**Acceptance:** No automation can spend beyond a user-approved policy; all high-risk scenarios fail closed; unsupported automation remains disabled.

---

## PHASE E — FINANCIAL RISK, OPERATIONS & REAL PUBLIC RELEASE

### Milestone 18 — Perpetuals and leverage (strictly separate gated product)

**Goal:** Determine whether leveraged markets can be added responsibly after the base exchange works.

**Detailed work**
- **18.1** Write an independent risk/market design: collateral assets, leverage caps, funding, margin modes, insurance and expiry where applicable.
- **18.2** Select resilient price oracles with independent sanity checks, stale-data cutoffs and manipulation resistance.
- **18.3** Implement margin accounting, isolated/cross balance rules and deterministic maintenance requirements.
- **18.4** Create keeper/liquidator simulator, auctions or closeout rules, bad-debt containment and insurance fund mechanics.
- **18.5** Add borrow/funding fee, open interest, exposure and market concentration limits.
- **18.6** Model chain stalls, oracle gaps, market manipulation, cascading liquidation and extreme collateral depeg.
- **18.7** Build transparent orderbook or virtual execution mechanics, no fictitious fill reporting and verifiable contract receipts.
- **18.8** Require formal invariants, adversarial simulation, separate external audit, funded incident operations and legal/regulatory review before live-value access.
- **18.9** Keep perps behind individual OFF → SIMULATION → SANDBOX → REVIEWED feature flags.
- **18.10** Build honest risk disclosure and accessible forced-liquidation history for users.

**Deliverables:** Research specification, risk engine code only if independently approved, sandbox market test suite and release decision.

**Acceptance:** Base spot/quest features need not depend on perps. No leverage can be signed while Oracle/RiskEngine/Liquidation/insurance controls are absent or unverified.

### Milestone 19 — Protocol security, backend operations, governance and monitoring

**Goal:** Run a secure, auditable, supportable service rather than a screenshot-driven app.

**Detailed work**
- **19.1** Split frontend, indexer, task workers, API, settlement contracts and operator components into separate roles and restricted credentials.
- **19.2** Write threat models for wallet signing, quest escrow, attestation forgery, referral fraud, social token misuse, RPC compromise and market manipulation.
- **19.3** Apply structured logs, tracing, queue retries, metric dashboards, alert ownership and service budget caps.
- **19.4** Add database migrations, backups, recovery rehearsals, secret rotation and scoped least-privilege Neon credentials.
- **19.5** Integrate dependency, smart-contract, secret and infrastructure scanning into CI.
- **19.6** Review authentication, session management, API abuse, clickjacking, CSP, CORS and file-upload protections.
- **19.7** Perform independent code audits, property testing, bug bounty triage and explicit change-control for financial contracts.
- **19.8** Build incident controls: disable UI writes, suspend new campaigns, mark chain status and emergency procedures consistent with each contract's actual authority.
- **19.9** Prepare privacy notices, data retention/deletion, marketing consent and policy for handling provider-connected account data.
- **19.10** Establish treasury/fee tracking from verifiable on-chain events; do not count a user's gross swaps as platform revenue.
- **19.11** Define published fees, creator payment terms, campaign liabilities, refunds and moderation disputes, with legal review where applicable.
- **19.12** Require signed release manifests, reproducible deployment artifacts and tracked privileged operations.

**Deliverables:** Security and operations runbooks, telemetry, independent reviews, incident drills and trustworthy financial ledgers.

**Acceptance:** Team can demonstrate detection, containment and recovery for RPC compromise, signer loss, Sybil wave, invalid indexer state and vault exploit simulations.

### Milestone 20 — Public beta, measurement, production decisions and Vercel launch

**Goal:** Launch only capabilities with verified receipts, safe UX and measurable user adoption.

**Detailed work**
- **20.1** Provision Vercel project, verified custom domain, preview/staging/production environments and appropriate environment-variable separation.
- **20.2** Gate CI on dependency integrity, production build, typecheck, unit/integration tests, supported-chain checks and automated browser smoke.
- **20.3** Publish public beta only after persistent sandbox chain, wallet onboarding, faucet, token creator, swap, LP exit and explorer receipts work externally.
- **20.4** Invite independent nonteam wallets and record consented genuine sessions separately from bots and scripted test volumes.
- **20.5** Measure wallet connect success, time to first test swap, token launch completion, quest verified completion, successful claims and second-week retention.
- **20.6** Observe server response latency, indexer lag, event reorg handling, transaction revert rate, wallet errors and browser performance.
- **20.7** Create a public status page, known-issues board, safety disclosures, bug reporting and service/support ownership.
- **20.8** Stress-test with 100, 1,000 and 10,000 simulated users; show measured outcome, cost and blockers, not invented production capacity.
- **20.9** Run failure-mode exercises: chain pause, bad indexer, RPC mismatch, empty faucet, escrow shortage, fraudulent attestations and revoked signing key.
- **20.10** Stage-gate each product independently (read-only discovery, test spot, test quests, test launches) rather than toggling everything live at once.
- **20.11** For any future production real-money rollout, obtain reviewed contract deployment, independent audit evidence, regulator/counsel analysis where applicable and treasury/operator approval.
- **20.12** Produce go/no-go memo with proof links, independent tester feedback, all open severity-one/two issues, known limitations and rollback plan.

**Deliverables:** Vercel deployment, testnet beta, real activity dashboard, release evidence, operating handbook and signed launch decision.

**Acceptance:** External users can independently prove what works, receive genuine test transaction/claim receipts and distinguish testnet from live money. Production/real-funds enablement is a different formally approved release.

---

## RELEASE GATES — what the UI is allowed to say

| Gate | Required evidence | Safe visible label |
| --- | --- | --- |
| G0 Design only | Working UI / browser-only drafts | Preview / Example / Local draft |
| G1 Infrastructure | Verified non-mainnet chain, RPC, explorer, contract addresses | Sandbox network configured |
| G2 Trading | External-wallet test faucet, swaps, LP and full withdrawal receipts | Testnet swaps live |
| G3 Campaigns | Actual funded test token escrow and receipt-backed task proofs | Testnet quests live |
| G4 Growth | Reproducible rankings, non-fake retention and anti-farming safeguards | Measured beta activity |
| G5 Production | Independent audit, formal governance and legal/regulatory approvals where applicable | Production features individually live |

## PRIORITY ORDER — do not build everything at once

**Immediate P0:** Finish M01 build verification; M02 CI/UX; M03 authentic isolated testnet; M04 wallet boundaries; M05 indexer; M08 actual test swaps; M07 token creation; M09 LP withdrawal.

**Next P1:** M06 genuine discovery; M10 creator UX; M11 testnet escrow; M12 verified proof service; M13 claim settlement; M19 incident and security foundation.

**Growth P2:** M14 rankings, M15 community distribution, M16 alerts, M20 beta readiness and measurement.

**Long-term gated R&D:** M17 advanced execution and M18 perps; do not block safer spot/quest launches on these features.

## PRODUCT METRICS (targets, not current claims)

- **Trading:** Independent connected wallets, completed test swaps, swap success rate, real indexed swaps, median confirmation wait, indexed reserves and liquidity withdrawals.
- **Quests:** Verified funded budgets, campaigns that reached active state, unique eligible testers, proof failure rate, net confirmed claims and escrow reconciliation.
- **Growth:** Qualified onboarding sources, first meaningful action, weekly cohorts, consented retention, creator campaigns that funded and settled, rate of flagged self-referrals.
- **Reliability:** RPC/indexer lag, provider outage, alert delay, queue retries, service cost, restore-test outcome, incorrect chain/contract detection.
- **Integrity:** Report humans and bots separately. Never present fake token prices, scripted test volume, proposed reward allocations or simulation PnL as real platform achievements.

## OPERATING PRINCIPLES

1. Lidde Fun is a separate product and repository but should integrate with a single canonical Lidde DEX chain, ABI and market indexer.
2. Token launch and quest mechanics must not accept an unverified chain or counterfeit contract address.
3. Browser localStorage is not a public campaign database, and a displayed reward is not an escrow-backed entitlement.
4. Wallet account connection is not wallet custody; transaction actions require explicit and narrowly scoped user authorization.
5. No guaranteed airdrops, token profits, trading returns or fictitious user/volume numbers.
6. Production identity, promotion and finance features require privacy, legal and trust/safety assessment proportional to their implementation.
7. Every milestone closes only when code, CI, proof receipts and user acceptance criteria are independently documented.

**Repo:** https://github.com/mushee-io/lidde-fun

**Integration dependency:** https://github.com/mushee-io/lidde-dex
