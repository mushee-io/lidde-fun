-- Phase 4: additive tables in the dedicated Lidde Fun quests DB, NOT Lidde DEX.
-- Profile display is strictly opt-in; claims on-chain remain public irrespective of account deletion.
CREATE TABLE IF NOT EXISTS growth_profiles (
 wallet_address VARCHAR(42) PRIMARY KEY,
 nickname VARCHAR(32),
 show_on_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
 referral_code VARCHAR(24) UNIQUE NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS growth_xp_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 chain_id BIGINT NOT NULL,
 vault_address VARCHAR(42) NOT NULL,
 campaign_id UUID NOT NULL REFERENCES quest_campaigns(id),
 wallet_address VARCHAR(42) NOT NULL,
 transaction_hash VARCHAR(66) NOT NULL,
 log_index INTEGER NOT NULL CHECK(log_index >= 0),
 block_number NUMERIC(78,0) NOT NULL,
 block_hash VARCHAR(66) NOT NULL,
 event_at TIMESTAMPTZ NOT NULL,
 event_type VARCHAR(24) NOT NULL DEFAULT 'quest_claim' CHECK(event_type = 'quest_claim'),
 xp SMALLINT NOT NULL DEFAULT 100 CHECK(xp = 100),
 verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(chain_id,vault_address,transaction_hash,log_index),
 UNIQUE(campaign_id,wallet_address)
);
CREATE INDEX IF NOT EXISTS growth_xp_period ON growth_xp_events(chain_id,event_at,block_number);
CREATE INDEX IF NOT EXISTS growth_xp_wallet ON growth_xp_events(wallet_address,event_at DESC);

CREATE TABLE IF NOT EXISTS growth_referrals (
 referee_wallet VARCHAR(42) PRIMARY KEY,
 referrer_wallet VARCHAR(42) NOT NULL REFERENCES growth_profiles(wallet_address) ON DELETE CASCADE,
 referral_code VARCHAR(24) NOT NULL,
 accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT no_self_referral CHECK (LOWER(referee_wallet) <> LOWER(referrer_wallet))
);
CREATE INDEX IF NOT EXISTS growth_referral_referrer ON growth_referrals(referrer_wallet,accepted_at);

CREATE TABLE IF NOT EXISTS growth_watch_rules (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_wallet VARCHAR(42) NOT NULL,
 chain_id BIGINT NOT NULL,
 pair_address VARCHAR(42) NOT NULL,
 rule_type VARCHAR(24) NOT NULL
  CHECK(rule_type IN('price_above','price_below','new_pair')),
 threshold_six NUMERIC(65,0),
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at_block NUMERIC(78,0) NOT NULL,
 last_matched BOOLEAN NOT NULL DEFAULT FALSE,
 last_fired_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT watch_threshold CHECK (
  (rule_type='new_pair' AND threshold_six IS NULL)
   OR (rule_type <> 'new_pair' AND threshold_six > 0)
 )
);
CREATE INDEX IF NOT EXISTS growth_watch_owner ON growth_watch_rules(owner_wallet,chain_id);
CREATE TABLE IF NOT EXISTS growth_alert_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 rule_id UUID NOT NULL REFERENCES growth_watch_rules(id) ON DELETE CASCADE,
 chain_id BIGINT NOT NULL,
 pair_address VARCHAR(42) NOT NULL,
 block_number NUMERIC(78,0) NOT NULL,
 block_hash VARCHAR(66) NOT NULL,
 observed_ratio_six NUMERIC(65,0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(rule_id,block_hash)
);
CREATE INDEX IF NOT EXISTS growth_alert_history ON growth_alert_events(rule_id,created_at DESC);
