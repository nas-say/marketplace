-- Migration: add featured_until column to listings for timed featured upgrades

ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until timestamptz;
