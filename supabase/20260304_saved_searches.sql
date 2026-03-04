-- Migration: saved_searches table for listing alert notifications

CREATE TABLE IF NOT EXISTS saved_searches (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    text        NOT NULL,
  email            text        NOT NULL,
  category         text,                     -- NULL = any category
  max_price_cents  integer,                  -- NULL = any price
  last_notified_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON saved_searches (clerk_user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
-- Service role key used for all reads/writes (bypasses RLS)
