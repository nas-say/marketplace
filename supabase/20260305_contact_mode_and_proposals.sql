-- Add listing contact mode:
-- direct   = unlock reveals seller contact immediately
-- proposal = unlock allows proposal; seller acceptance reveals contact
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS contact_mode text NOT NULL DEFAULT 'direct';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_contact_mode_check'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_contact_mode_check
      CHECK (contact_mode IN ('direct', 'proposal'));
  END IF;
END $$;

-- Allow proposal-only messages without a numeric offer amount.
ALTER TABLE offers
  ALTER COLUMN amount_cents DROP NOT NULL;

ALTER TABLE offers
  DROP CONSTRAINT IF EXISTS offers_amount_cents_check;

ALTER TABLE offers
  ADD CONSTRAINT offers_amount_cents_check
  CHECK (amount_cents IS NULL OR amount_cents > 0);

CREATE INDEX IF NOT EXISTS offers_listing_buyer_status_idx
  ON offers (listing_id, buyer_id, status);
