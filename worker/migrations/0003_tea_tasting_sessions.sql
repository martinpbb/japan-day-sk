-- Synchronize the owner-confirmed tea tasting schedule with the public workshop data.
PRAGMA defer_foreign_keys = ON;
-- Refuse ambiguous merges instead of losing registration or uniqueness data.
CREATE TEMP TABLE tea_session_merge_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO tea_session_merge_guard
SELECT CASE WHEN
  EXISTS (SELECT 1 FROM workshop_sessions WHERE id = 'cajova-degustacia-1330')
  AND EXISTS (SELECT 1 FROM workshop_sessions WHERE id = 'cajova-degustacia-1400')
  AND EXISTS (SELECT 1 FROM registrations WHERE session_id = 'cajova-degustacia-1330')
  THEN 0 ELSE 1 END;
DROP TABLE tea_session_merge_guard;

INSERT INTO workshop_sessions (id, workshop_id, start_at, end_at, location, capacity, active, registration_open)
SELECT 'cajova-degustacia-1245', id, '2026-11-07T12:45:00+01:00', '2026-11-07T13:30:00+01:00', NULL, 15, 1, registration_open
FROM workshops WHERE slug = 'cajova-degustacia'
ON CONFLICT(id) DO UPDATE SET
  workshop_id = excluded.workshop_id,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  location = excluded.location,
  capacity = excluded.capacity,
  active = excluded.active;

-- The canonical row now exists; preserve stale-row registration references.
UPDATE registrations
SET session_id = 'cajova-degustacia-1400', workshop_id = (SELECT id FROM workshops WHERE slug = 'cajova-degustacia')
WHERE session_id = 'cajova-degustacia-1330';

DELETE FROM workshop_sessions WHERE id = 'cajova-degustacia-1330';

INSERT INTO workshop_sessions (id, workshop_id, start_at, end_at, location, capacity, active, registration_open)
SELECT 'cajova-degustacia-1400', id, '2026-11-07T14:00:00+01:00', '2026-11-07T14:45:00+01:00', NULL, 15, 1, registration_open
FROM workshops WHERE slug = 'cajova-degustacia'
ON CONFLICT(id) DO UPDATE SET
  workshop_id = excluded.workshop_id,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  location = excluded.location,
  capacity = excluded.capacity,
  active = excluded.active;
