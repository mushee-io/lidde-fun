# Lidde Fun

A VERY ecosystem trading-discovery and quests terminal, inspired by the **layout patterns** of PurrFlow but independently implemented for Lidde.

## Status

**M01 preview + initial M02–M05 foundation committed.** The sidebar token rows are explicitly sample data, but a separate `/markets` page now checks for canonical indexed testnet pools; `/network` independently validates configured sandbox chain identity. Quests are local drafts and not live reward programs. Wallet connection is account read-only. Swaps, deposits, perps, leaderboards, and rewards are not live. No testnet chain is presented as provisioned until deployment is independently verified.

## Development

- Node.js 22+
- `npm install`
- `npm run dev` — http://localhost:3000
- `npm run build` — production build

## Stack

Next.js App Router, React, TypeScript, Lucide icons, custom responsive CSS. Zero wallet private keys, no server-side signers or fake on-chain activities.

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
- `db/migrations/013_quests.sql`: dedicated quest database migration; the schema has **not** been applied unless separately verified.
- `/api/quests/challenge`, `/api/quests/drafts`, `/api/quests/register`, `/api/quests/attest`: server-issued wallet challenges and conditional proof attestation.
- Verified on-chain funding and task evidence gate *all* live UI states and signatures.

**Operational status:** requires separate Neon configuration, a persistent valueless chain, code-hash pinned QuestEscrow and a securely controlled test-only attestor. See [Phase 3 release notes](docs/PHASE-03.md).

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
