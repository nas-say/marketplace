-- Migration: listing_views table + under_offer status support
-- Run this in your Supabase SQL editor or via CLI

-- 1. Listing views table for seller analytics
CREATE TABLE IF NOT EXISTS listing_views (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text        NOT NULL,
  viewer_id  text,                           -- NULL = unauthenticated visitor
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_views_listing_id_idx ON listing_views (listing_id);

-- Enable RLS (service role key bypasses it for our analytics writes)
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

-- No public read policy — analytics are only surfaced via the service client

-- 2. Under-offer status
-- If your `listings.status` column is a PostgreSQL ENUM, uncomment the line below.
-- If it is a plain text/varchar column, no change is needed.
-- ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'under_offer';
