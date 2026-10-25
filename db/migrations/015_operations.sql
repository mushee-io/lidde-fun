-- Additive, scoped request control for /api/quests/challenge and sensitive actions.
CREATE TABLE IF NOT EXISTS ops_rate_buckets (
 category VARCHAR(50) NOT NULL,
 principal_digest VARCHAR(64) NOT NULL,
 window_id BIGINT NOT NULL,
 requests INTEGER NOT NULL CHECK (requests>0),
 PRIMARY KEY(category,principal_digest,window_id)
);
CREATE INDEX IF NOT EXISTS ops_rate_bucket_cleanup ON ops_rate_buckets(window_id);
