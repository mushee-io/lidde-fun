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

- `/discover`: real indexed ERC-20 metadata, pair authenticity, swap counts and token-to-token pool ratios. No false USD price or fabricated market cap.
- `/trade`: direct token-token Lidde Router swap quotes, precise allowance approval and real receipts, only when the chain and code fingerprints are verified.
- `/launch`: capped test token creation through an independently pinned Lidde demo creator, with issuer-control disclosure and on-chain event parsing.
- `/portfolio`: canonical indexed token balances and LP ownership, real ERC-20 add liquidity and full redeemable LP withdrawal flows for **existing** indexed pools.
- `/api/phase2/manifest`: server-attested public safe network and contract manifest. This is not a statement that a public chain is already deployed.
- `/api/discovery` and `/api/portfolio`: source-checked read-only endpoints gated by the canonical indexed block and Lidde DEX market indexer.
- Read the [Phase 2 implementation notes](docs/PHASE-02.md) before entering testnet configuration.

**Not yet complete:** the persistent testnet itself, funding and faucet verification, external-wallet swap receipts, first-pool launch for newly created tokens, real historical candles, full verified pricing/oracles and independent financial-contract audit.

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
