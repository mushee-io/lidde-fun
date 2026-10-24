# Lidde Fun — Deep Phase 3 technical implementation (M10–M13)

**Recorded 24 October 2026.** Source code is committed to `mushee-io/lidde-fun`. No persistent, public, valueless testnet or deployed reward contract is currently verified. No real-funds functionality is authorized.

## Summary: implemented vs. released

| Phase | Implemented code | External deployment still outstanding |
| --- | --- | --- |
| M10 Creator | Multi-step React quest builder, five-task maximum, wallet-signed one-time challenge, dedicated Neon schema, server authorization and draft persistence | Apply migration to a separate Neon project, set production HTTPS origin, browser acceptance testing |
| M11 Escrow | Non-upgradeable Solidity QuestEscrow, fixed funded budget, claims cap, escrow accounting, protected token movement, paused signing-key rotation, expiration refunds, EIP-712 digest separation; creator deployment/approval/funding wizard and on-chain event registration | Audit code and deploy pinned QuestEscrow on actual isolated chain |
| M12 Verification | Canonical indexed block validation, ERC-20 holdings, Factory-registered LP positions, direct Router swap receipt + token-specific output verification, proof deduplication and source record persistence | Operate the canonical DEX indexer and test actual signed wallet eligibility on public sandbox |
| M13 Claims | Off-chain wallet challenge, signed EIP-712 claim authorization bound to chain/campaign/wallet/evidence/nonce/expiry, one claim per wallet, evidence replay prevention, user-signed on-chain claim transaction and explorer receipt | Independently witness funded escrow payouts and anti-farming tests on a running sandbox |

## Verified working source

- Escrow Solidity source: [contracts/QuestEscrow.sol](../contracts/QuestEscrow.sol)
- Solidity security tests: [contracts/test/QuestEscrow.t.sol](../contracts/test/QuestEscrow.t.sol)
- Frontend quest directory: `/quests`
- Campaign design and funding: `/quests/create`
- Quest and claims: `/quests/[id]`
- Server-only signer: `lib/quests/vault.ts`
- On-chain proof rules: `lib/quests/proofs.ts`
- DB migration: [db/migrations/013_quests.sql](../db/migrations/013_quests.sql)
- API: `/api/quests/challenge`, `/api/quests/drafts`, `/api/quests/register`, `/api/quests`, `/api/quests/attest`, `/api/quests/config`
- CI: frontend checks and Solidity `forge test` for safety invariants.
- Separate [disposable-Anvil broadcast rehearsal](../.github/workflows/quest-anvil-e2e.yml) tests actual isolated-EVM create, fund and claim *only when passing*; run status is authoritative evidence. It never creates a persistent public chain.

## Chain-bound campaign flow

1. Creator connects browser wallet and signs a single-use message explaining draft creation. That signature **cannot** authorize asset transfers.
2. Creator prepares a draft containing reward token, exact raw reward per claim, campaign cap, start/end window and 1–5 verifiable on-chain tasks.
3. Server validates fields and saves the draft in a *separate* Neon database (only if configured).
4. Frontend reads `/api/quests/config`; server reports deployed vault only if current codehash exactly matches pinned operator-provided value and the isolated chain is verified.
5. Creator signs `QuestEscrow.createCampaign`; the UI waits for an actual `CampaignCreated` receipt.
6. Creator signs a *separate* register challenge; server verifies chain ID, deployed vault, escrow creator, token, amount per claim, claim cap, dates and authorized attestor against the saved draft.
7. Creator separately approves exact reward allocation and funds the vault. A partial or nonexistent balance cannot activate claims.
8. Public directory rechecks contract state on every request. It never labels an unfunded, paused or expired campaign active.
9. Participant connects wallet, provides a real swap tx hash for any required swap steps, and signs a separate short-lived verification challenge.
10. Server verifies all tasks against canonical chain state, persists source digests, prevents reuse of a transaction in the same campaign/task and signs a short-lived EIP-712 claim bound to the user.
11. User signs `QuestEscrow.claim` from their wallet and receives an actual escrow transfer receipt. There is no admin withdrawal while participants can claim; unclaimed funds can be returned after expiry.

## Exact task semantics

- **Hold:** Wallet ERC-20 balance at *one* confirmed indexed block is at least a specified raw amount. This is a **point-in-time** check, not proof of sustained historical ownership.
- **Swap:** A successful direct Router tx from the claimant is observed at a canonical block during the campaign. The event is emitted by a Factory-registered pair, and output **of the specified token** meets the raw threshold. One tx can't support multiple wallets' proof records for the same campaign task.
- **LP:** Wallet holds a minimum raw LP token balance in a Factory-recognized Lidde pair at the confirmed indexed block.
- **Social following, reposts, KYC, time-held positions, historical TWAP, and multi-identity detection** are not implemented as authoritative proof types; enabling such claims would require reviewed external attestors and additional safeguards.

## Contract security invariants

The `QuestEscrow` contract:

- Can deploy only on an explicit sandbox-style EVM chain (rejects known chain 1 / VERY mainnet 4613; operational manifest independently verifies exact genesis and contract hashes).
- Has fixed campaign payout amounts and max wallet claims; funding must exactly reach a calculated budget before claims can begin.
- Refuses the same claimant twice or a reused evidence hash for the same campaign.
- Uses an EIP-712 domain bound to its verifying contract and chain ID, and rejects ECDSA high-`s` and invalid `v` signatures.
- Protects claims/funding/refunds against reentrancy and checks ERC-20 return values and incoming funding balance deltas.
- Allows creators to pause and rotate a compromised attestation signer while paused, but does not let creators reclaim funds during an open claim window.
- Refunds undistributed campaign tokens only after the final expiry; contracts are not currently independently audited.

**Safety note:** The off-chain attestor currently decides whether evidence meets the configured task rules. It is a trust component, not a fully decentralized proof system. Avoid real economic value until a separate independent audit of contracts, proof service, signer compromise scenarios and anti-Sybil policies is completed.

## Required operator configuration

From [`.env.example`](../.env.example), set *genuine* existing sandbox values:

```text
LIDDE_FUN_TESTNET_CHAIN_ID=<independently verified nonmainnet chain ID>
LIDDE_FUN_RPC_URL=<HTTPS RPC on your actual isolated EVM chain>
LIDDE_FUN_EXPLORER_URL=<validated block explorer>
LIDDE_FUN_GENESIS_HASH=<actual genesis block hash>
LIDDE_FUN_FACTORY_ADDRESS=<actual Factory>
LIDDE_FUN_FACTORY_CODE_HASH=<keccak256(runtime bytecode)>
LIDDE_FUN_ROUTER_ADDRESS=<actual Router>
LIDDE_FUN_ROUTER_CODE_HASH=<keccak256(runtime bytecode)>
LIDDE_DEX_MARKETS_API_URL=<canonical DEX testnet indexer endpoint>
LIDDE_FUN_QUEST_VAULT_ADDRESS=<deployed QuestEscrow contract>
LIDDE_FUN_QUEST_VAULT_CODE_HASH=<keccak256(runtime bytecode)>
LIDDE_FUN_QUEST_ATTESTOR_PRIVATE_KEY=<TESTNET-ONLY attestor; secure secret store>
QUEST_DATABASE_URL=<dedicated Lidde Fun Neon database connection>
QUEST_PUBLIC_ORIGIN=<HTTPS origin of deployed Lidde Fun>
```

Do not set publicly documented Anvil keys as a production or shared testnet attestor. A persistent public chain needs new dedicated test-only keys, firewall/RPC method controls, monitored confirmations, automated database backups, secure signed deploy receipts, independent operator review, and terms clearly separating valueless test tokens from funds.

## Release gates and missing independent acceptance evidence

1. **Network:** Deploy Lidde DEX Factory/Router/TestTokenFactory/Faucet and QuestEscrow on one persistent isolated test chain, verify genesis and all codehashes, publish an external explorer URL.
2. **Indexer:** Start the Lidde DEX canonical indexer on that chain, apply indexer database migrations and verify block hash reorg handling and historic sync data.
3. **Database:** Create dedicated Neon storage, apply additive 013 migration, set scoped credentials and cookie/origin/signature protections. This conversation has **not** applied a database migration to any user data.
4. **Faucet:** Verify a wallet with no prior gas can receive valueless tokens without sending real currency.
5. **Campaign:** Two *independent* wallets create a draft, escrow a funded campaign, trade, hold LP, verify all task proofs and claim. Capture actual chain transaction hashes and account balances.
6. **Adversarial:** Replay the same signature, duplicate an onchain claim, reuse swap tx from another wallet, forge a pair, disconnect wallet, change chain ID, reorg proof block, rotate signer mid-claim and attempt early refund.
7. **Operations:** Conduct independent audit, browser accessibility and pressure/load reviews, alert on signer loss, indexer lag, shared wallet use and escrow balances.
8. **Deployment:** Vercel app deployment requires authenticated project-create permissions and a connected Git repository. Do not assume a Vercel project exists unless that action actually succeeds.

## Current operational blockers

- `mushee-io/lidde-dex/config/networks.testnet.json` and `config/deployments.testnet.json` are currently `not-configured`; the existing GitHub workflow verifies only an **ephemeral GitHub Actions Anvil chain**. That does not give external participants an available RPC after the job.
- The initial attempt to create a Vercel project returned **HTTP 403 forbidden** for the connected Vercel team. This did not create a deployment.
- No dedicated Neon database was created or mutated in this pass.
- These limitations are intentional fail-closed states, not simulated success.

## Next operator action

Provision infrastructure with required access for a long-running RPC/explorer and connected Vercel project; provide verified testnet manifests. Then configure the code, run tests, complete browser and external-wallet acceptance checks, and only then enable independent public testers.
