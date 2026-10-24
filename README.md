# Lidde Fun

A VERY ecosystem trading-discovery and quests terminal, inspired by the **layout patterns** of PurrFlow but independently implemented for Lidde.

## Status

**Milestone 1 — frontend prototype.** The market rows are explicitly sample data; quests are local drafts and not live reward programs. Wallet connection is account read-only. Swaps, deposits, perps, leaderboards, and rewards are not live. No testnet chain is presented as provisioned until deployment is independently verified.

## Development

- Node.js 22+
- `npm install`
- `npm run dev` — http://localhost:3000
- `npm run build` — production build

## Stack

Next.js App Router, React, TypeScript, Lucide icons, custom responsive CSS. Zero wallet private keys, no server-side signers or fake on-chain activities.

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
