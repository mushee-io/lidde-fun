# Lidde Fun — Phase 2 Engineering Delivery (M05–M09)

**Date:** 24 October 2026  
**Repository:** https://github.com/mushee-io/lidde-fun  
**Status:** Application source implemented and CI checks established. **No public isolated test chain is currently configured in Lidde DEX; no live test token, trade, on-chain LP, public wallet receipts, mainnet trading, USD prices or realized volumes are claimed.** Real signing paths fail closed until the network is independently verifiable.

## Added route map

| URL | Function | Status without sandbox |
| --- | --- | --- |
| `/discover` | Search, sort and inspect verified DEX pairs, token metadata and pool ratios | Graceful unavailable state |
| `/pairs/[address]` | Bounded testnet Sync reserve-price history (not trade-derived OHLC) | Graceful unavailable state |
| `/trade` | Actual ERC-20 token-to-token swap using Lidde Router, exact approval step, fresh quote, limits and receipt | Wallet transactions disabled |
| `/launch` | Capped demo token creation through LiddeDemoTokenFactory, creator receipts | Creator action disabled |
| `/pools/create` | Creator-bound first liquidity pool, pricing warning and Factory pair creation | Action disabled |
| `/portfolio` | Canonical indexed wallet/LP holdings, add liquidity and full redeemable LP exit | No balances until indexer verified |
| `/network` | Observed chain ID, genesis fingerprint and configured Router/Factory bytecode checks | Not verified |
| `/api/discovery` | Canonical indexer plus factory-contract provenance and metadata reads | HTTP 503 |
| `/api/portfolio?address=...` | Same-block ERC-20, gas and LP balances; no invented valuations | HTTP 503 |
| `/api/pair-history?pair=...` | Genuine bounded Pair Sync logs, 60 max display observations, 900-block lookback | HTTP 503 |
| `/api/phase2/manifest` | Public subset of verified network and Router bindings, opt-in creator codehash | HTTP 503 |

## M05 — Read integrity and indexer bridge

**Built:** Schema validators, confirmed block hash check, a hard 500-block maximum indexer lag, 24 indexed-pool discovery cap, direct Factory.getPair verification, actual token0/token1 contract verification, token symbol/name/decimals reads from a canonical block and canonical wallet balances at that same block.

**Depends on:** Lidde DEX canonical testnet indexer API. No independent indexer worker/database was newly deployed in this repo. The indexer in `mushee-io/lidde-dex` must be deployed and populated on a genuine persistent separate sandbox.

**Gate:** A real pool on the verified test chain appears with consistent factory address, reserves and balances. The same queries after a chain reorg must be reconciled before providing finalized statistics.

## M06 — Discovery and price history

**Built:** Token search, pair browsing, indexed swap-event sorting, new-pool sorting, source-labeled pool reserve ratios and direct on-chain bounded Sync event history with an SVG time-series view. Reference USD price, market cap and total USD volume remain unavailable because there is no independently validated pricing reference.

**Not built yet:** Complete block-range historical OHLCV indexer, historical volume and liquidity time-series database, sophisticated trending score and token-contract security vetting.

**Gate:** Independent on-chain proof supports every number and last indexed block. Bots and multihop event counts remain disclosed.

## M07 — Token creator and initial pair launch

**Built:** Creator ABIs compatible with Lidde DEX, symbol/supply/decimals validation, maximum supply bounds, account and chain checks, creator deployed bytecode hash verification, local wallet signing via injected EVM provider, transaction receipt and actual creation-event decoding. First pool accepts two test assets, requires creator ownership of at least one, checks no existing Factory pair, asks explicit pricing and permanently locked LP acknowledgement, and approves exact amounts separately.

**Not built yet:** Public creator contract deployment, operator manifest and successful external wallet receipts. The code remains disabled without those prerequisites. Custom assets are unverified even if created by the demo creator.

**Gate:** Independently connected wallet creates valueless token, receives an actual receipt, successfully seeds first pool, and the pair appears on the canonical indexer.

## M08 — Spot swaps

**Built:** Direct ERC-20/ ERC-20 swap route for existing indexed pools, fresh on-chain Router.getAmountsOut quote, checked Router→Factory and Factory→Pair binding, real token balances and decimals, configured slippage 0.1%–5%, expiry bounds, separate exact ERC-20 allowance approve or zero-revoke step, transaction simulation, signed wallet send, confirmed receipt.

**Not built yet:** Native-coin wrap/unwrap swap paths, multi-hop routing, limit orders, advanced price-impact chart, and independent real swap receipts. Production/mainnet trading is disabled.

**Gate:** Two outside wallets get test assets, quote independently against pool reserves, submit swaps, observe correct received amounts and explorer receipts, and cannot approve or trade on wrong-chain RPC.

## M09 — Portfolio and liquidity

**Built:** Public-address token and LP balance views at the indexed block, direct LP position share estimation, existing-pool add-liquidity paths with optimal amount ratio, separate exact token approval, re-verified reserves, min receive, deadline and simulated Router writes. Full LP withdrawal calculates pro-rata output and locks against stale supply/reserve state. Initial minimum LP locks remain contract enforced.

**Not built yet:** New publicly deployed LP receipts, cash-equivalent PnL, migration tooling, yield accounting, other AMM protocol LP adapters and independent end-to-end position roundtrip tests.

**Gate:** Independent wallet seeds pool, trades, adds liquidity and removes all owned LP tokens; event reconciliations show balances and reserves accurately after restart.

## Environment setup (server-owned only)

Configure the values in [`.env.example`](../.env.example) from observed, *actually deployed* testnet contracts:

- `LIDDE_FUN_TESTNET_CHAIN_ID` — unique sandbox chain (not 4613).
- `LIDDE_FUN_RPC_URL`, `LIDDE_FUN_EXPLORER_URL` — real public HTTPS endpoints.
- `LIDDE_FUN_GENESIS_HASH` — observed genesis block hash.
- `LIDDE_FUN_FACTORY_ADDRESS`, `LIDDE_FUN_FACTORY_CODE_HASH` — deployed Factory address and keccak256 runtime bytecode.
- `LIDDE_FUN_ROUTER_ADDRESS`, `LIDDE_FUN_ROUTER_CODE_HASH` — deployed Router address and codehash.
- `LIDDE_DEX_MARKETS_API_URL` — canonical sandbox indexer `/api/testnet/markets` endpoint (same chain ID and Factory).
- Optional `LIDDE_FUN_TOKEN_CREATOR_ADDRESS`, `LIDDE_FUN_TOKEN_CREATOR_CODE_HASH` — codehash-verified deployed LiddeDemoTokenFactory. When not supplied, token launches and first-pool creation are disabled.

Never use private keys, live-value RPC infrastructure or arbitrary unverified contract addresses to bypass checks. The backend deliberately returns HTTP 503 instead of invented demo trading values until the codehash and canonical block verification succeed.

## CI and local validation

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Automated tests cover non-mainnet chain configuration, malformed indexed payloads, duplicate entries, slippage limits, optimal liquidity deposits and LP withdrawal share maths. CI performs TypeScript checks, unit tests and production build.

## Release gate — decisions still required before testnet launch

1. Provision a **persistent, independently reachable** valueless chain in Lidde DEX; verify genesis hash, chain ID, deployed source, contract codehash, faucet and explorer.
2. Operate the actual Lidde DEX indexer against that chain and bind only that canonical indexer URL.
3. Smoke-test all user write paths with separate, non-team wallets and retain proof transaction links.
4. Review web UI accessibility, wallet provider compatibility, transaction error states, malformed token behavior and RPC restarts in a browser.
5. Keep mainnet execution, real-value rewards, sponsored bot economics and perps outside this Phase 2 sandbox release.
6. Do not describe Phase 2 as a *launched exchange* until the above have verifiable evidence and operational signoff.

**Next implementation tranche:** Provider compatibility browser tests, full-chain test deployment evidence, production-grade OHLCV indexing and operator incident/faucet facilities — not fictitious statistics.
