# Lidde Fun — Phase 5 cross-check (25 October 2026)

This document separates source implementation from verified public deployment.

## M18: Perpetuals research

- Fixed-point margin and liquidation simulation in lib/perps/risk.ts with long/short positions, capped 1–10x research leverage, synthetic price scenarios, fees, maintenance requirements and stale-oracle rejection.
- React research UI at /perps with no financial wallet transactions.
- Adversarial unit tests for bounds, stale prices, long-loss / short-loss liquidation and stress scenarios.
- NOT COMPLETE for live leverage: audited oracles, on-chain margin vault, keeper and liquidation engine, insurance, funding, positions, solvency invariants, independent audit or regulated real-value offering approval.

## M19: Security and operations

- Default-off wallet/signing policy; LIDDE_FUN_WRITES_ENABLED must be exactly true. LIDDE_FUN_EMERGENCY_STOP=true overrides it.
- Server middleware denies signed quest and growth API mutations if operator writes are off, plus oversized request guards.
- Phase 2 wallet manifest and Phase 3 quest vault config include the operator signing flag; browser signing checks it again.
- Shared Neon atomic rate limit table ops_rate_buckets applied and verified in dedicated lidde-fun-quests database. Challenge quotas 5/wallet/minute and 500 globally/minute; verified signed actions 40/wallet/minute.
- Security response headers include anti-framing, nosniff, base/object policy, permission and referrer restrictions.
- Read-only /api/ops/status and /beta report observed chain, indexer, escrow and DB checks. External evidence and audit are deliberately not self-approved.
- SECURITY.md contains incident and disclosure guidance.

Critical limitation: an application emergency brake cannot pause an independently accessible contract or recall already-broadcast transactions. The claim escrow supports creator-side campaign pause only. External audits, incident drills, backup/recovery, key rotation and threat modeling remain needed.

## M20: Public beta release

- Preflight NO_GO script, release gate unit tests, static header checks.
- Browser/API Chromium crosscheck workflow with preview-only tests for /beta, /perps, /quests and blocked write endpoints.
- No claims of actual public tester adoption, trade volume, referrals, revenue, automated alert deliveries or guaranteed wallet transaction rates.
- No Vercel deployment was created; the connected team repeatedly returns 403 Forbidden when creating lidde-fun.
- Public network and indexer manifests in mushee-io/lidde-dex remain not-configured.

## Infrastructure and acceptance checklist

| Prerequisite | Current evidence |
| --- | --- |
| Persistent EVM RPC, chain ID and explorer | Not configured |
| Faucet, Factory, Router, demo token creator | Not publicly deployed |
| Indexed markets and reconciliation | Not publicly running |
| QuestEscrow, secured attestor and funded claim | Temporary Anvil proof only |
| Dedicated Neon quest tables and ops rate buckets | Created and verified |
| Database and keys connected to live app | Not done |
| Vercel app and HTTPS domain | Blocked by team permission 403 |
| Two independent external-wallet faucet/swap/LP/quest/XP end-to-end receipts | Not demonstrated |
| Contract audit, legal/privacy review and launch signoff | Not completed |

**Public beta status: NO_GO.** Temporary GitHub Actions Anvil receipts prove local EVM calls, not a persistent publicly accessible blockchain.

## Source crosscheck commands

    npm install
    npm run typecheck
    npm test
    npm run build
    npm run test:browser
    node scripts/check-headers.mjs
    node scripts/release-preflight.mjs --json
    forge test -vv

An explicitly strict release preflight deliberately fails until independent evidence and reviewed approvals exist. To operate a beta, a team member must provision a persistent chain on durable infrastructure, deploy signed codehash-pinned contracts, run the indexer, configure restricted environment keys, resolve the Vercel team permission and independently verify transaction receipts from separate wallets.

### Status terminology

M18: research simulation code built; no live perpetual product.  
M19: initial runtime safety controls built; audits and operations signoff pending.  
M20: readiness and browser test harness built; no beta or production deployment.
