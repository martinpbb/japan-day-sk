CREATE TABLE admin_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'lecturer')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE lecturer_workshops (
  email TEXT NOT NULL REFERENCES admin_users(email) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  PRIMARY KEY (email, workshop_id)
);
