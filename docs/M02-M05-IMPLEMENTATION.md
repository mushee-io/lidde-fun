# M02–M05 implementation — engineering handover

Status: Initial features committed to main. No Lidde Fun real-world exchange, testnet, faucet or quests are claimed as deployed.

## Implemented in this pass

- **M02 / Terminal UX:** navigation to canonical market and network verification views, `/` keyboard focus for search, Escape closes the quest modal, responsive status panels and truthful sample data labels.
- **M03 / Chain safety:** pinned chain ID, genesis block hash, exact factory/router bytecode Keccak hashes, fail-closed configuration parser and a read-only `/api/network/status` check.
- **M04 / Wallet:** provider event handling for account and chain changes, address copy, hide-wallet state, visible mismatch warnings; no transactions, spending permissions, or private keys.
- **M05 / Market data bridge:** `/api/markets` consumes the canonical Lidde DEX testnet indexer response only if an actual sandbox identity check succeeds, confirms canonical indexed block hash using the RPC and rejects stale or malformed snapshots. `/markets` shows raw reserves without invented USD valuations.
- **Tests / CI:** automated TypeScript typecheck, a compact unit test suite for manifest and indexed market validation, and Next.js production build.

## Required environment values

See `.env.example` for sandbox chain ID, RPC HTTPS address, explorer URL, observed genesis hash, Factory/Router contract addresses and deployed bytecode hashes plus the authenticated canonical indexer API endpoint.

Do not use live VERY Mainnet 4613 as a mock testnet. The linked `mushee-io/lidde-dex` repository's own separate testnet registry is still `not-configured`. Both APIs intentionally return 503 until deployed and verified.

## URLs when deployed

- `/`: Lidde Fun preview terminal with wallet and quest drafts.
- `/network`: testnet readiness and observed chain diagnostics.
- `/markets`: verified indexed pool viewer.
- `/api/network/status`: machine-readable chain provenance.
- `/api/markets`: canonical indexer proxy with reorg and source integrity checks.

## Next practical work

1. Fully provision and independently test the isolated Lidde DEX sandbox infrastructure, public HTTPS RPC and contract deployment manifest.
2. Expose verified canonical Lidde DEX indexer API from the same sandbox and configure Lidde Fun's read-only upstream environment.
3. Improve real-time market indexing, pair metadata, token-decimals awareness and block-aware UI updates.
4. Continue M04 creator sign-in and safe preference sessions; then M06 token analytics and M07 token creator transaction tests.
5. M08 spot swaps and M09 LP position flows remain disabled until external-wallet sandbox evidence exists.

## Verification commands

    npm install
    npm test
    npm run typecheck
    npm run build
