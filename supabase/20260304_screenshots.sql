-- Add screenshots array to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS screenshots text[] NOT NULL DEFAULT '{}';

-- NOTE: You also need to create a public Supabase Storage bucket named "listing-screenshots".
-- In Supabase Dashboard → Storage → New bucket → name: listing-screenshots → Public: yes
