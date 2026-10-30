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
-- Rebuild rather than ALTER: production has TEXT IDs and a payment CHECK,
-- while historical local 0001 used integer IDs. Copy IDs losslessly as TEXT.
-- No child tables reference registrations until after this rebuild.
CREATE TABLE registrations_reconciled (
  id TEXT PRIMARY KEY NOT NULL,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  session_id TEXT REFERENCES workshop_sessions(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('free', 'not_due', 'pending', 'paid', 'cancelled')),
  payment_reference TEXT,
  registration_access_token_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  cancelled_at TEXT
);
-- Legacy missing phones stay explicitly unknown (empty), without inventing data.
INSERT INTO registrations_reconciled
  (id, workshop_id, first_name, last_name, email, phone, status, payment_status,
   payment_reference, created_at, updated_at, paid_at, cancelled_at)
SELECT CAST(id AS TEXT), CAST(workshop_id AS TEXT), first_name, last_name, email,
  COALESCE(phone, ''), status, payment_status, payment_reference,
  created_at, updated_at, paid_at, cancelled_at FROM registrations;
DROP TABLE registrations;
ALTER TABLE registrations_reconciled RENAME TO registrations;
CREATE UNIQUE INDEX idx_registrations_session_email
  ON registrations(session_id, email) WHERE status != 'cancelled';
CREATE INDEX idx_registrations_workshop_id ON registrations(workshop_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
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
