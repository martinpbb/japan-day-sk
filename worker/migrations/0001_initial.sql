CREATE TABLE workshops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lecturer TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 0),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  registration_open INTEGER NOT NULL DEFAULT 0 CHECK (registration_open IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  cancelled_at TEXT,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id)
);

CREATE UNIQUE INDEX idx_registrations_workshop_email
  ON registrations(workshop_id, email)
  WHERE status != 'cancelled';
CREATE INDEX idx_registrations_workshop_id ON registrations(workshop_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_workshops_slug ON workshops(slug);
