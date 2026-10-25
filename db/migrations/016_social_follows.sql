-- Privacy-conscious, explicitly wallet-signed opt-in follow graph.
CREATE TABLE IF NOT EXISTS growth_follows(
 follower_wallet VARCHAR(42) NOT NULL,
 followed_wallet VARCHAR(42) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(follower_wallet,followed_wallet),
 CHECK(follower_wallet<>followed_wallet),
 CHECK(follower_wallet~'^0x[0-9a-f]{40}$'),
 CHECK(followed_wallet~'^0x[0-9a-f]{40}$')
);
CREATE INDEX IF NOT EXISTS growth_follows_followed ON growth_follows(followed_wallet,created_at DESC);
