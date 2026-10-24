# Lidde Fun — Phase 4 Implementation / Release Gates (M14–M17)

**Date:** 24 October 2026  
**Source:** mushee-io/lidde-fun  
**Status:** application code committed; CI evidence in GitHub Actions. No production rewards or automated trades.

## Durable accomplishments

The additive migration \`db/migrations/014_growth.sql\` was applied **only** in the dedicated Neon project \`lidde-fun-quests\` (\`flat-frost-39649070\`, database \`lidde_fun\`). Five tables were confirmed: \`growth_profiles\`, \`growth_xp_events\`, \`growth_referrals\`, \`growth_watch_rules\`, and \`growth_alert_events\`. No changes were made to the existing \`lidde-testnet\` project. The deployed app does not currently have a valid Vercel project/production environment or an approved, persistent public chain, so database provisioning is not proof of external product availability.

## M14 — Nonfinancial, reproducible XP

- **Algorithm:** \`lidde-quest-v1\`. Exactly 100 off-chain XP per distinct, finalized-in-indexed-block QuestEscrow claim. No XP for swaps, raw trading volume, referrals, funding multiple wallets, social posts, likes or link clicks.
- **Primary evidence:** User supplies campaign UUID, claimant wallet and transaction hash via \`/leaderboard\`. A single-use wallet signature authorizes the server to inspect the transaction, never transfer assets.
- **RPC checks:** the configured Lidde testnet must pass genesis/Factory/Router fingerprint checks; its canonical indexer block hash must match the RPC. Check the transaction sender/recipient, successful receipt, block <= indexed height, block canonical hash, matching signed escrow deployment, reward amount and specific \`RewardClaimed\` event.
- **Database:** Insert a single XP row constrained by unique \`chain + vault + txHash + logIndex\` and \`campaign + wallet\`. Re-importing does not issue XP again.
- **Windowing:** ISO UTC week, calendar month, UTC quarterly season and all-time. Stable ranking order: descending XP, descending verified claims, lexicographically ascending lowercase address.
- **Privacy:** public display requires an explicitly opted-in profile; nickname is optional and subjected to basic reserved-name validation. Sign for profile operations and private score history. A deletion action clears off-chain profile, invites, XP and watch records; immutable public chain receipts cannot be erased.
- **Reorg protections:** leaderboard and personal evidence endpoints independently fetch every distinct scored event block and reject publication if any stored hash has ceased to be canonical. For now the ranking API fails closed beyond 500 ledger events rather than silently truncating ranks; production scale requires a dedicated reconciled ranking worker.
- **Result:** a transparent score explorer via \`/api/growth/history\` and a verified evidence-backed leaderboard. **XP is NOT a token, security, transferable asset, promised airdrop, guaranteed retrodrop, cash reward or financial entitlement.**

## M15 — Referrals and community

- \`/community\` has wallet-controlled invite attribution and client-side QR codes (no third-party QR endpoint).
- Referrers must explicitly opt in to public profile status before receiving/using a unique referral code.
- A referred wallet must sign its own one-time \`growth-referral\` challenge and consent; no invisible attribution just from visiting a link.
- Reject self-referrals, duplicate invite attribution and referrers who opted out.
- Referrer statistics distinguish wallet-level attributions from wallets with at least one imported, verified QuestEscrow claim; neither proves distinct human identity and both can be farmed.
- User-facing quest sharing includes only previously verified campaigns reported by the server-side escrow-checking directory.
- No XP, payout, airdrop or bounty is automatically attached to referrals. No unreviewed OAuth integrations to X, Telegram, Discord or bulk messaging were created. These need provider keys, compliance and consent handling.

## M16 — Saved watchlists and on-demand canonical signal checks

- Rules are wallet-private, require single-use \`growth-watch\` signed challenges, and are capped to 20 per wallet.
- Supported types: \`price_above\`, \`price_below\` (6-decimal *token1 per token0* ratio, no USD) and \`new_pair\` (new indexed Factory pair after the rule was created).
- Rule targets are sourced from \`/api/discovery\`, which verifies factory provenance of the pool at the canonical index block.
- Signal evaluation is **on demand** using \`POST /api/growth/watch\` \`op:check\`. Historical observations record chain ID, pair, block height/hash, and a deduplication event key. Continuous price-above/below states are edge-triggered, with 30-minute cooldown after false→true.
- The "new pair" scanner covers only the first 24 discovery pools and at most five new candidates per check; it is not a complete production-grade subscription service.
- Owners can list, toggle, delete, export, and erase their own rules and stored observations. Export JSON is created in the browser and never emailed or sent to a third-party server.
- **Not yet active:** persistent background worker, Telegram/email/web-push delivery, authenticated provider opt-in, reorg worker that reconciles historical stored alert rows and audited SLA/latency measurements. Old saved alert records are observations and not proof of current chain finality.

## M17 — Advanced terminal research with no delegated spending

- \`/lab\` reads actual registered indexed pool reserves or shows unavailable. It does **not** use sample market fixture data to invent quotes.
- Constant-product calculation uses bigint reserves, fee assumption of 30 basis points, bounded 0.1%–5% slippage and a user-set budget in input-token units. It produces a test token output, slippage minimum, estimated impact and three sensitivity scenarios.
- A user must explicitly acknowledge that an indexed quote is not executable before the UI links to \`/trade\`. The existing guarded spot terminal then requotes and requires explicit noncustodial wallet signing.
- No bot, copy trading, auto buying, delegated account, shared custody, leverage, mainnet contract, trade fill, PnL or MEV guarantee exists. This implementation is research only.

## Components / API

| Surface | Function | Live prerequisites |
| --- | --- | --- |
| \`/leaderboard\` | opt-in XP rankings, proof import, personal evidence explorer | verified chain/indexer/QuestEscrow, separate Neon DB |
| \`/community\` | consented referral links and QR, wallet-level conversions | Neon's deployed app connection, auth HTTPS origin; conversion requires real XP |
| \`/alerts\` | create/check/export/delete wallet-private watch rules | verified DEX pool indexer, HTTPS app origin, Neon DB |
| \`/lab\` | read-only integer-safe AMM scenario estimates | genuine indexed pools |
| \`/api/growth/claim\` | prove finalized campaign-claim event and credit once | actual \`RewardClaimed\` chain receipt |
| \`/api/growth/leaderboard\` | canonical block-hash checked deterministic public ranks | current chain/indexer and bounded database |
| \`/api/growth/history\` | signed wallet-private score evidence | current chain/indexer and stored claim events |
| \`/api/growth/account\` | signed profile privacy, opt-in, data deletion | separate Neon DB |
| \`/api/growth/referrals\` | signed wallet-level attribution | separate Neon DB |
| \`/api/growth/watch\` | signed watchlist controls and on-demand observations | separate Neon DB + indexer for add/check |

## Test procedures

Automated in GitHub CI:
\`\`\`bash
npm install --no-audit --no-fund
npm run typecheck
npm test
npm run build
forge test -vv
\`\`\`

Included direct unit tests exercise: replay-resistant XP, stable tie ordering, UTC week/month/season boundaries, opt-in exclusion, unsupported social XP rejection, fixed-six decimal alert prices, new-pair bounds, impossible reserve quote and slippage fail-closed.

**Mandatory external QA that has NOT been completed:**
1. Deploy the actual Lidde DEX persistent valueless testnet, stable RPC/explorer, funding faucet, canonical indexer and QuestEscrow signed manifest.
2. Link the *existing newly created* Neon \`lidde-fun-quests\` DB to a properly authorized Vercel environment using a scoped secret. The connected Vercel team previously returned HTTP 403 on project creation; no Vercel launch is claimed.
3. Execute browser wallet sign-in, profile creation, real swap/LP/claim and XP import using at least two independent external wallets, and preserve TX hashes.
4. Inject and recover from an RPC stall, reorged XP/alert block, expired challenge, forged claim log, same-wallet referral, duplicate import, background worker outage, malformed rule, leaked attestor key and oversized ranking window.
5. Add system-wide rate limits, periodic challenge/notification retention cleanup, operator appeals, username moderation, external audit and scalable job workers before a public growth campaign.
6. Verify mobile layout and screen-reader accessibility in browser automation; a successful production build alone is not usability sign-off.

## Release classification

- **Code:** M14–M17 implemented in application source; automatic unit/build checks verify source-level integration.
- **Database:** new Phase 4 Neon tables provisioned; production app env still unconnected.
- **Chain:** only local disposable Anvil receipt verification has previously succeeded for the escrow and underlying DEX. No persistent public Lidde EVM network exists in verified configuration.
- **Distribution:** referral attribution is wallet-level analytics only. No social providers, messaging blasts or paid campaigns activated.
- **Financial execution:** no automated trades, guaranteed XP-to-token conversion or mainnet spending enabled.

Never describe this as a live public rewards program until actual independently reachable-chain evidence meets the release gates.
