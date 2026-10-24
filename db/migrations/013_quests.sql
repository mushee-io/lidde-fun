-- Lidde Fun Phase 3: add only to a dedicated sandbox database; no destructive statements.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS quest_auth_challenges (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), wallet_address VARCHAR(42) NOT NULL,
 message TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_auth_active ON quest_auth_challenges(wallet_address,expires_at) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS quest_campaigns (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), creator_address VARCHAR(42) NOT NULL,
 chain_id BIGINT NOT NULL, title VARCHAR(100) NOT NULL, description TEXT NOT NULL,
 task_rules JSONB NOT NULL, token_address VARCHAR(42) NOT NULL,
 reward_each_raw NUMERIC(78,0) NOT NULL CHECK(reward_each_raw>0),
 max_claims INTEGER NOT NULL CHECK(max_claims BETWEEN 1 AND 10000),
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 lifecycle VARCHAR(20) NOT NULL DEFAULT 'draft'
 CHECK(lifecycle IN('draft','registered','active','ended','archived')),
 vault_address VARCHAR(42), onchain_campaign_id NUMERIC(78,0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT quest_dates CHECK(ends_at>starts_at),
 CONSTRAINT quest_rule_array CHECK(jsonb_typeof(task_rules)='array')
);
CREATE UNIQUE INDEX IF NOT EXISTS quest_campaign_chain_id ON
 quest_campaigns(chain_id,vault_address,onchain_campaign_id)
 WHERE onchain_campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quest_campaigns_status ON quest_campaigns(lifecycle,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS quest_task_evidence (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id UUID NOT NULL REFERENCES quest_campaigns(id),
 wallet_address VARCHAR(42) NOT NULL, task_number SMALLINT NOT NULL CHECK(task_number BETWEEN 0 AND 4),
 source_tx_hash VARCHAR(66), observed_block NUMERIC(78,0) NOT NULL,
 observed_block_hash VARCHAR(66) NOT NULL, evidence_digest VARCHAR(66) NOT NULL,
 evidence_record JSONB NOT NULL DEFAULT '{}'::jsonb, verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(campaign_id,wallet_address,task_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS quest_swap_evidence_replay ON
 quest_task_evidence(campaign_id,task_number,source_tx_hash) WHERE source_tx_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS quest_claim_attestations (
 campaign_id UUID NOT NULL REFERENCES quest_campaigns(id),
 wallet_address VARCHAR(42) NOT NULL, chain_id BIGINT NOT NULL, vault_address VARCHAR(42) NOT NULL,
 onchain_campaign_id NUMERIC(78,0) NOT NULL, evidence_hash VARCHAR(66) NOT NULL,
 claim_nonce NUMERIC(78,0) NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
 typed_signature VARCHAR(132) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(campaign_id,wallet_address),
 UNIQUE(chain_id,vault_address,onchain_campaign_id,evidence_hash)
);
