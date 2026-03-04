CREATE TABLE IF NOT EXISTS notifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text        NOT NULL,
  type          text        NOT NULL DEFAULT 'general',
  title         text        NOT NULL,
  message       text,
  href          text,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (clerk_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (clerk_user_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Service-role DB access is used by server actions/routes.

