-- Shift existing workshop sessions by 30 minutes without changing IDs or registrations.
-- Abort if production contains sessions beyond the owner-provided schedule.
CREATE TABLE workshop_schedule_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO workshop_schedule_guard
SELECT CASE WHEN
  (SELECT COUNT(*) FROM workshop_sessions WHERE id IN (
    'japoncina-1100','japoncina-1300','japoncina-1500',
    'origami-1100','origami-1145','origami-1230','origami-1315','origami-1400',
    'shodo-1100','shodo-1330','shodo-1530',
    'tsumami-zaiku-1140','tsumami-zaiku-1340',
    'ayatori-1220','ayatori-1420',
    'kumihimo-1100','kumihimo-1215','kumihimo-1330','kumihimo-1445',
    'cajova-degustacia-1245','cajova-degustacia-1400'
  )) != 21
  OR EXISTS (
    SELECT 1 FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id
    WHERE w.slug IN ('japoncina','origami','shodo','tvorba-kombiku','tsumami-zaiku','ayatori','kumihimo','cajova-degustacia')
      AND s.id NOT IN (
        'japoncina-1100','japoncina-1300','japoncina-1500',
        'origami-1100','origami-1145','origami-1230','origami-1315','origami-1400',
        'shodo-1100','shodo-1330','shodo-1530','tvorba-kombiku-drop-in',
        'tsumami-zaiku-1140','tsumami-zaiku-1340','ayatori-1220','ayatori-1420',
        'kumihimo-1100','kumihimo-1215','kumihimo-1330','kumihimo-1445',
        'cajova-degustacia-1245','cajova-degustacia-1400'
      )
  )
  OR EXISTS (
    SELECT 1 FROM workshop_sessions s
    JOIN workshops w ON w.id = s.workshop_id
    WHERE (s.id = 'tvorba-kombiku-drop-in' AND w.slug != 'tvorba-kombiku')
       OR (s.id LIKE 'japoncina-%' AND w.slug != 'japoncina')
       OR (s.id LIKE 'origami-%' AND w.slug != 'origami')
       OR (s.id LIKE 'shodo-%' AND w.slug != 'shodo')
       OR (s.id LIKE 'tsumami-zaiku-%' AND w.slug != 'tsumami-zaiku')
       OR (s.id LIKE 'ayatori-%' AND w.slug != 'ayatori')
       OR (s.id LIKE 'kumihimo-%' AND w.slug != 'kumihimo')
       OR (s.id LIKE 'cajova-degustacia-%' AND w.slug != 'cajova-degustacia')
  )
  THEN 0 ELSE 1 END;
DROP TABLE workshop_schedule_guard;

UPDATE workshop_sessions SET
  start_at = CASE id
    WHEN 'japoncina-1100' THEN '2026-11-07T11:30:00+01:00'
    WHEN 'japoncina-1300' THEN '2026-11-07T13:30:00+01:00'
    WHEN 'japoncina-1500' THEN '2026-11-07T15:30:00+01:00'
    WHEN 'origami-1100' THEN '2026-11-07T11:30:00+01:00'
    WHEN 'origami-1145' THEN '2026-11-07T12:15:00+01:00'
    WHEN 'origami-1230' THEN '2026-11-07T13:00:00+01:00'
    WHEN 'origami-1315' THEN '2026-11-07T13:45:00+01:00'
    WHEN 'origami-1400' THEN '2026-11-07T14:30:00+01:00'
    WHEN 'shodo-1100' THEN '2026-11-07T11:30:00+01:00'
    WHEN 'shodo-1330' THEN '2026-11-07T14:00:00+01:00'
    WHEN 'shodo-1530' THEN '2026-11-07T16:00:00+01:00'
    WHEN 'tsumami-zaiku-1140' THEN '2026-11-07T12:10:00+01:00'
    WHEN 'tsumami-zaiku-1340' THEN '2026-11-07T14:10:00+01:00'
    WHEN 'ayatori-1220' THEN '2026-11-07T12:50:00+01:00'
    WHEN 'ayatori-1420' THEN '2026-11-07T14:50:00+01:00'
    WHEN 'kumihimo-1100' THEN '2026-11-07T11:30:00+01:00'
    WHEN 'kumihimo-1215' THEN '2026-11-07T12:45:00+01:00'
    WHEN 'kumihimo-1330' THEN '2026-11-07T14:00:00+01:00'
    WHEN 'kumihimo-1445' THEN '2026-11-07T15:15:00+01:00'
    WHEN 'cajova-degustacia-1245' THEN '2026-11-07T13:15:00+01:00'
    WHEN 'cajova-degustacia-1400' THEN '2026-11-07T14:30:00+01:00'
  END,
  end_at = CASE id
    WHEN 'japoncina-1100' THEN '2026-11-07T12:00:00+01:00'
    WHEN 'japoncina-1300' THEN '2026-11-07T14:00:00+01:00'
    WHEN 'japoncina-1500' THEN '2026-11-07T16:00:00+01:00'
    WHEN 'origami-1100' THEN '2026-11-07T12:00:00+01:00'
    WHEN 'origami-1145' THEN '2026-11-07T12:45:00+01:00'
    WHEN 'origami-1230' THEN '2026-11-07T13:30:00+01:00'
    WHEN 'origami-1315' THEN '2026-11-07T14:15:00+01:00'
    WHEN 'origami-1400' THEN '2026-11-07T15:00:00+01:00'
    WHEN 'shodo-1100' THEN '2026-11-07T13:00:00+01:00'
    WHEN 'shodo-1330' THEN '2026-11-07T15:30:00+01:00'
    WHEN 'shodo-1530' THEN '2026-11-07T17:30:00+01:00'
    WHEN 'tsumami-zaiku-1140' THEN '2026-11-07T12:40:00+01:00'
    WHEN 'tsumami-zaiku-1340' THEN '2026-11-07T14:40:00+01:00'
    WHEN 'ayatori-1220' THEN '2026-11-07T13:20:00+01:00'
    WHEN 'ayatori-1420' THEN '2026-11-07T15:20:00+01:00'
    WHEN 'kumihimo-1100' THEN '2026-11-07T12:15:00+01:00'
    WHEN 'kumihimo-1215' THEN '2026-11-07T13:30:00+01:00'
    WHEN 'kumihimo-1330' THEN '2026-11-07T14:45:00+01:00'
    WHEN 'kumihimo-1445' THEN '2026-11-07T16:00:00+01:00'
    WHEN 'cajova-degustacia-1245' THEN '2026-11-07T14:00:00+01:00'
    WHEN 'cajova-degustacia-1400' THEN '2026-11-07T15:15:00+01:00'
  END
WHERE id IN (
  'japoncina-1100','japoncina-1300','japoncina-1500',
  'origami-1100','origami-1145','origami-1230','origami-1315','origami-1400',
  'shodo-1100','shodo-1330','shodo-1530',
  'tsumami-zaiku-1140','tsumami-zaiku-1340','ayatori-1220','ayatori-1420',
  'kumihimo-1100','kumihimo-1215','kumihimo-1330','kumihimo-1445',
  'cajova-degustacia-1245','cajova-degustacia-1400'
);

UPDATE workshop_sessions
SET start_at = '2026-11-07T11:30:00+01:00', end_at = '2026-11-07T15:00:00+01:00'
WHERE id = 'tvorba-kombiku-drop-in';
