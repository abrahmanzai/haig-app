-- SnapTrade integration
-- Stores per-user SnapTrade credentials (user_id + user_secret)
-- Admins connect the club brokerage via the SnapTrade portal; secrets never leave the server.

CREATE TABLE IF NOT EXISTS snaptrade_users (
  id                   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  snaptrade_user_id    TEXT NOT NULL UNIQUE,
  snaptrade_user_secret TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only accessible via service role (no client-side RLS policies needed)
ALTER TABLE snaptrade_users ENABLE ROW LEVEL SECURITY;

-- Track SnapTrade activity IDs on trades so we can upsert without duplicates
ALTER TABLE trades ADD COLUMN IF NOT EXISTS snaptrade_id TEXT UNIQUE;
