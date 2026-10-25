# Lidde Fun

A VERY ecosystem trading-discovery and quests terminal, inspired by the **layout patterns** of PurrFlow but independently implemented for Lidde.

## Status

**Phase 1–4 source implementation committed; genuine public sandbox remains unconfigured.** The original home terminal still includes clearly labelled preview fixtures, while route-specific Phase 2/3/4 modules fail closed when the verified chain, indexer and escrow are unavailable. No real-money trading, rewards, perps, automated execution or verified public beta is active. The Phase 3/4 SQL tables have been created on the separate Neon `lidde-fun-quests` database, but this is not a live application deployment.

## Development

- Node.js 22+
- `npm install`
- `npm run dev` — http://localhost:3000
- `npm run build` — production build

## Stack

Next.js App Router, React, TypeScript, Viem, Neon PostgreSQL, Lucide icons, custom responsive CSS. Phase 3 adds a **server-side test-only EIP-712 attestor** which is disabled without secure environment credentials; browser wallet transactions remain noncustodial.

## Initial M02–M05 engineering pass

- [Network readiness](app/network/page.tsx) and read-only `/api/network/status` with pinned genesis/Factory/Router bytecode validation.
- [Indexed markets](app/markets/page.tsx) with canonical RPC block-hash crosschecking; any unavailable or invalid data fails closed.
- Wallet account and network change handling, warning states, keyboard focus for `/` search, modal Escape handling.
- [Implementation handover](docs/M02-M05-IMPLEMENTATION.md) and [unit tests](tests/infra-validation.test.ts).
- GitHub Actions now runs tests, typecheck, and production build.

## Phase 2 implementation (M05–M09)

- `/discover`: real indexed ERC-20 metadata, pair authenticity, swap counts and token-to-token pool ratios, with bounded genuine Sync history at `/pairs/[address]`. No false USD price or fabricated market cap.
- `/trade`: direct token-token Lidde Router swap quotes, precise allowance approval and real receipts, only when the chain and code fingerprints are verified.
- `/pools/create`: verify creator ownership of a newly issued demo token, acknowledge initial pool pricing and locked minimum LP, then create the Factory pair and initial test liquidity with exact allowances.
- `/launch`: capped test token creation through an independently pinned Lidde demo creator, with issuer-control disclosure and on-chain event parsing.
- `/portfolio`: canonical indexed token balances and LP ownership, real ERC-20 add liquidity and full redeemable LP withdrawal flows for **existing** indexed pools.
- `/api/phase2/manifest`: server-attested public safe network and contract manifest. This is not a statement that a public chain is already deployed.
- `/api/discovery` and `/api/portfolio`: source-checked read-only endpoints gated by the canonical indexed block and Lidde DEX market indexer.
- Read the [Phase 2 implementation notes](docs/PHASE-02.md) before entering testnet configuration.

**Not yet complete:** the persistent testnet itself, funding and faucet verification, external-wallet swap receipts, real externally verified pool-launch receipts, full historical trade-derived OHLC candles, full verified pricing/oracles and independent financial-contract audit.

## Phase 3 (quest creation, funding and verification)

- `/quests`: only chain-checked registered campaigns, with actual funded status and claim counts.
- `/quests/create`: creator workflow with signed challenge, durable draft, EIP-712 attestor-bound on-chain campaign creation, chain registration, exact allowance and separate escrow-funding steps.
- `/quests/[id]`: token-hold, token-specific swap and LP proof forms, wallet-signed eligibility request and wallet-bound on-chain claim execution.
- `contracts/QuestEscrow.sol`: fixed-budget escrow, limited claims, typed proof signatures, replay prevention, expiry, controlled pause/signing-key rotation and post-expiry refund.
- `db/migrations/013_quests.sql`: dedicated quest database migration; applied and table inventory verified in the separate Neon `lidde-fun-quests` project.
- `/api/quests/challenge`, `/api/quests/drafts`, `/api/quests/register`, `/api/quests/attest`: server-issued wallet challenges and conditional proof attestation.
- Verified on-chain funding and task evidence gate *all* live UI states and signatures.

**Operational status:** requires separate Neon configuration, a persistent valueless chain, code-hash pinned QuestEscrow and a securely controlled test-only attestor. See [Phase 3 release notes](docs/PHASE-03.md).

## Phase 4 (XP, community, alerts and trading research)

- `/leaderboard`: week/month/season/all-time deterministic, **opt-in** ranking, only backed by canonically verified QuestEscrow `RewardClaimed` events (100 nonfinancial XP per unique campaign claim). Single-use wallet authorization, no trade-volume points, score replay check.
- `/community`: referral codes and QR links created only for publicly opted-in profiles. Wallets explicitly consent to referral attribution; link clicks or referral registrations **never** grant XP or tokens. Creator quest-sharing uses the verified campaign directory, not fictitious advertisements.
- `/alerts`: up to 20 wallet-private on-chain watch rules, on-demand threshold/new-pair checks against indexed data, deduplicated stored observations, export and erase controls. **No push, Telegram, email or scheduled cron exists.**
- `/lab`: read-only indexed constant-product AMM quote simulation, bounded budgets and slippage sensitivity. Requires acknowledgement before navigating to the separately verified spot terminal; **no delegated/copy/automated trading**.
- `db/migrations/014_growth.sql`: applied to separate Neon `lidde-fun-quests`; five growth tables verified.
- See [Phase 4 release notes and gates](docs/PHASE-04.md).

No Phase 4 feature is labelled as an active production reward program or verified trading performance until a persistent sandbox and independent wallet receipts are available.

## Phase 5 — Perps research and verified beta operations (M18–M20)

- `/perps`: **non-trading**, bounded 1–10x long/short hypothetical margin and liquidation stress model. No perpetual contracts or real-value positions deployed.
- `/beta`: operator-facing public-readiness inspection backed by actual RPC, indexer, vault, attestor and database checks where configured. It does not self-approve independent wallet, faucet or audit evidence.
- `/api/ops/status`: privacy-preserving readiness checks, no actual signing keys or DB connection details returned.
- `middleware.ts`: signed mutation emergency stop (off by default) with oversized payload protection.
- `lib/phase2/wallet.ts`: rechecks operator write enablement before wallet signing.
- `db/migrations/015_operations.sql`: applied to Neon `lidde-fun-quests`; shared atomic API request quotas.
- `e2e/beta-smoke.spec.ts`: real Chromium and API preview tests run in GitHub Actions.
- `scripts/release-preflight.mjs`: independent-evidence release policy produces an honest NO_GO.
- [Phase 5 delivery & crosscheck](docs/PHASE-05.md) and [security guidance](SECURITY.md).

**Public beta status: NOT RELEASED.** Lidde DEX has no verified public persistent network or contract deployments, external-wallet receipts are absent, and the Vercel team's project-creation API still returns 403 Forbidden.

## Roadmap

See [MILESTONES.md](MILESTONES.md) for 20 milestone phases, sub-tasks, release gates and acceptance tests.

## Existing ecosystem

[Lidde DEX](https://github.com/mushee-io/lidde-dex) is an independent repository. Do not reuse its planned or locally simulated features as if they were active live infrastructure.

## Safety

- Never ask for seed phrases or private keys.
- On-chain quests require reviewed escrow/claim contracts, a real verified chain ID, replay protection and claim proofs.
- Token prices, market caps, volume, wallet PnL and leaderboard ranks must come from identified on-chain sources before turning on live labels.
- Perps/options/leverage are future gated work, not part of this prototype.

MIT © Mushee.
