-- Synchronize every registration-required workshop from the current Slovak
-- workshop catalogue. Existing editorial/settings values are preserved.
PRAGMA defer_foreign_keys = ON;

-- D1 does not authorize TEMP tables; these migration helpers are dropped below.
CREATE TABLE canonical_workshops (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  capacity INTEGER NOT NULL
);
INSERT INTO canonical_workshops VALUES
  ('japoncina', 'Japončina', 'Workshop venovaný základom japonského jazyka.', 0, '2026-11-07T11:00:00+01:00', '2026-11-07T15:30:00+01:00', 15),
  ('origami', 'Origami', 'Tradičné japonské umenie skladania papiera, pri ktorom z jednoduchého listu vznikajú zvieratá, kvety a ďalšie dekoratívne tvary.', 0, '2026-11-07T11:00:00+01:00', '2026-11-07T14:30:00+01:00', 15),
  ('shodo', 'Shodō – japonská kaligrafia', 'Praktický workshop tradičnej japonskej kaligrafie, na ktorom sa účastníci zoznámia so štetcom, tušom a základnými princípmi písania japonských znakov.', 0, '2026-11-07T11:00:00+01:00', '2026-11-07T17:00:00+01:00', 20),
  ('tsumami-zaiku', 'Tsumami zaiku つまみ細工', 'Tvorivý workshop tsumami zaiku s ozdobnými tvorivými podložkami.', 1000, '2026-11-07T11:40:00+01:00', '2026-11-07T14:10:00+01:00', 2),
  ('ayatori', 'Ayatori あやとり', 'Tradičná japonská hra so slučkou zo špagátu, pri ktorej sa pomocou prstov vytvárajú rôzne obrazce a figúry.', 0, '2026-11-07T12:20:00+01:00', '2026-11-07T14:50:00+01:00', 10),
  ('kumihimo', 'Kumihimo', 'Workshop tradičného japonského pletenia šnúr.', 0, '2026-11-07T11:00:00+01:00', '2026-11-07T15:30:00+01:00', 10),
  ('cajova-degustacia', 'Čajová degustácia', 'Riadená degustácia japonských čajov.', 0, '2026-11-07T12:45:00+01:00', '2026-11-07T14:45:00+01:00', 15);

CREATE TABLE canonical_sessions (
  id TEXT PRIMARY KEY,
  workshop_slug TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  capacity INTEGER NOT NULL
);
INSERT INTO canonical_sessions VALUES
  ('japoncina-1100', 'japoncina', '2026-11-07T11:00:00+01:00', '2026-11-07T11:30:00+01:00', 15),
  ('japoncina-1300', 'japoncina', '2026-11-07T13:00:00+01:00', '2026-11-07T13:30:00+01:00', 15),
  ('japoncina-1500', 'japoncina', '2026-11-07T15:00:00+01:00', '2026-11-07T15:30:00+01:00', 15),
  ('origami-1100', 'origami', '2026-11-07T11:00:00+01:00', '2026-11-07T11:30:00+01:00', 15),
  ('origami-1145', 'origami', '2026-11-07T11:45:00+01:00', '2026-11-07T12:15:00+01:00', 15),
  ('origami-1230', 'origami', '2026-11-07T12:30:00+01:00', '2026-11-07T13:00:00+01:00', 15),
  ('origami-1315', 'origami', '2026-11-07T13:15:00+01:00', '2026-11-07T13:45:00+01:00', 15),
  ('origami-1400', 'origami', '2026-11-07T14:00:00+01:00', '2026-11-07T14:30:00+01:00', 15),
  ('shodo-1100', 'shodo', '2026-11-07T11:00:00+01:00', '2026-11-07T12:30:00+01:00', 20),
  ('shodo-1330', 'shodo', '2026-11-07T13:30:00+01:00', '2026-11-07T15:00:00+01:00', 20),
  ('shodo-1530', 'shodo', '2026-11-07T15:30:00+01:00', '2026-11-07T17:00:00+01:00', 20),
  ('tsumami-zaiku-1140', 'tsumami-zaiku', '2026-11-07T11:40:00+01:00', '2026-11-07T12:10:00+01:00', 2),
  ('tsumami-zaiku-1340', 'tsumami-zaiku', '2026-11-07T13:40:00+01:00', '2026-11-07T14:10:00+01:00', 2),
  ('ayatori-1220', 'ayatori', '2026-11-07T12:20:00+01:00', '2026-11-07T12:50:00+01:00', 10),
  ('ayatori-1420', 'ayatori', '2026-11-07T14:20:00+01:00', '2026-11-07T14:50:00+01:00', 10),
  ('kumihimo-1100', 'kumihimo', '2026-11-07T11:00:00+01:00', '2026-11-07T11:45:00+01:00', 10),
  ('kumihimo-1215', 'kumihimo', '2026-11-07T12:15:00+01:00', '2026-11-07T13:00:00+01:00', 10),
  ('kumihimo-1330', 'kumihimo', '2026-11-07T13:30:00+01:00', '2026-11-07T14:15:00+01:00', 10),
  ('kumihimo-1445', 'kumihimo', '2026-11-07T14:45:00+01:00', '2026-11-07T15:30:00+01:00', 10),
  ('cajova-degustacia-1245', 'cajova-degustacia', '2026-11-07T12:45:00+01:00', '2026-11-07T13:30:00+01:00', 15),
  ('cajova-degustacia-1400', 'cajova-degustacia', '2026-11-07T14:00:00+01:00', '2026-11-07T14:45:00+01:00', 15);

-- Only the tea tasting rename is an approved registration mapping. Other stale
-- registered sessions stop the migration for manual, evidence-based review.
CREATE TABLE registration_repair_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO registration_repair_guard
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id
    JOIN canonical_workshops cw ON cw.slug = w.slug
    LEFT JOIN canonical_sessions cs ON cs.id = s.id AND cs.workshop_slug = w.slug
    WHERE cs.id IS NULL AND s.id != 'cajova-degustacia-1330'
      AND EXISTS (SELECT 1 FROM registrations r WHERE r.session_id = s.id)
  )
  OR EXISTS (
    SELECT 1 FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id
    JOIN canonical_workshops cw ON cw.slug = w.slug
    JOIN canonical_sessions cs ON cs.id = s.id
    WHERE cs.workshop_slug != w.slug
  )
  OR EXISTS (
    SELECT 1 FROM workshop_sessions s
    WHERE s.id IN (SELECT id FROM canonical_sessions)
      AND s.workshop_id != (SELECT id FROM workshops WHERE slug = (SELECT workshop_slug FROM canonical_sessions WHERE id = s.id))
  )
  OR EXISTS (
    SELECT 1 FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id
    WHERE s.id = 'cajova-degustacia-1330' AND w.slug != 'cajova-degustacia'
  )
  OR EXISTS (
    SELECT 1 FROM registrations stale
    JOIN registrations canonical ON lower(trim(canonical.email)) = lower(trim(stale.email))
      AND canonical.session_id = 'cajova-degustacia-1400'
      AND canonical.status != 'cancelled'
    WHERE stale.session_id = 'cajova-degustacia-1330' AND stale.status != 'cancelled'
  )
  THEN 0 ELSE 1 END;
DROP TABLE registration_repair_guard;

INSERT INTO workshops
  (id, slug, title, lecturer, short_description, description, start_at, end_at, location,
   capacity, price_cents, currency, active, registration_open)
SELECT slug, slug, title, '', short_description, short_description, start_at, end_at, '',
  capacity, price_cents, 'EUR', 1, 1
FROM canonical_workshops
WHERE 1
ON CONFLICT(slug) DO NOTHING;

INSERT INTO workshop_sessions
  (id, workshop_id, start_at, end_at, location, capacity, active, registration_open)
SELECT cs.id, w.id, cs.start_at, cs.end_at, NULL, cs.capacity, 1, w.registration_open
FROM canonical_sessions cs
JOIN workshops w ON w.slug = cs.workshop_slug
WHERE 1
ON CONFLICT(id) DO UPDATE SET
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  capacity = excluded.capacity;

-- The 13:30 tea row is a known stale ID for the current 14:00 session. Preserve
-- every registration row and payment snapshot by changing only its FK value.
UPDATE registrations
SET session_id = 'cajova-degustacia-1400',
    workshop_id = (SELECT id FROM workshops WHERE slug = 'cajova-degustacia')
WHERE session_id = 'cajova-degustacia-1330';

-- Unregistered stale rows for these seven workshops are safe to remove after
-- the registration guards above. Any other stale row with registrations aborts.
DELETE FROM workshop_sessions
WHERE workshop_id IN (SELECT id FROM workshops WHERE slug IN (SELECT slug FROM canonical_workshops))
  AND id NOT IN (SELECT id FROM canonical_sessions)
  AND id != 'cajova-degustacia-1330';
DELETE FROM workshop_sessions WHERE id = 'cajova-degustacia-1330';

DROP TABLE canonical_sessions;
DROP TABLE canonical_workshops;
