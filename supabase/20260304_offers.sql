CREATE TABLE IF NOT EXISTS offers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id      text        NOT NULL,
  amount_cents  integer     NOT NULL CHECK (amount_cents > 0),
  message       text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offers_listing_idx ON offers (listing_id);
CREATE INDEX IF NOT EXISTS offers_buyer_idx ON offers (buyer_id);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
-- No anon/auth policies for now; app uses service-role DB access.
