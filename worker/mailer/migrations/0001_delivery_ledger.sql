CREATE TABLE IF NOT EXISTS mail_delivery_ledger (
  idempotency_key TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('sending', 'sent', 'failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
