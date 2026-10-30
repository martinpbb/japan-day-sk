-- Nullable session reference preserves historical registrations without inventing sessions.
CREATE TABLE workshop_sessions (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  start_at TEXT NOT NULL,
  end_at TEXT,
  location TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  registration_open INTEGER NOT NULL DEFAULT 1 CHECK (registration_open IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_workshop ON workshop_sessions(workshop_id);
CREATE INDEX idx_sessions_start ON workshop_sessions(start_at);
ALTER TABLE registrations ADD COLUMN session_id TEXT REFERENCES workshop_sessions(id);
ALTER TABLE registrations ADD COLUMN access_token_hash TEXT;
DROP INDEX idx_registrations_workshop_email;
CREATE UNIQUE INDEX idx_registrations_session_email
  ON registrations(session_id, lower(trim(email))) WHERE status != 'cancelled';
-- Retain duplicate protection for historical rows lacking a session.
CREATE UNIQUE INDEX idx_registrations_legacy_email
  ON registrations(workshop_id, email) WHERE session_id IS NULL AND status != 'cancelled';
CREATE INDEX idx_registrations_session_status ON registrations(session_id, status);
CREATE TRIGGER registrations_require_session BEFORE INSERT ON registrations
WHEN NEW.session_id IS NULL
BEGIN SELECT RAISE(ABORT, 'session_id is required'); END;
CREATE TABLE registration_payments (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  payment_reference TEXT NOT NULL UNIQUE CHECK (
    length(payment_reference) BETWEEN 1 AND 10 AND payment_reference NOT GLOB '*[^0-9]*'
  ),
  iban TEXT NOT NULL,
  bic TEXT,
  beneficiary_name TEXT NOT NULL,
  message TEXT,
  pay_by_square_payload TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT
);
