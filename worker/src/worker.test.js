import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decode } from 'bysquare/pay';
import worker from './worker.js';
import workshopData from '../../src/data/locales/sk/workshops.json' with { type: 'json' };
import workshopDataEn from '../../src/data/locales/en/workshops.json' with { type: 'json' };
import workshopDataEs from '../../src/data/locales/es/workshops.json' with { type: 'json' };
import workshopDataDe from '../../src/data/locales/de/workshops.json' with { type: 'json' };
import workshopDataJa from '../../src/data/locales/ja/workshops.json' with { type: 'json' };

const localizedWorkshopData = [workshopData, workshopDataEn, workshopDataEs, workshopDataDe, workshopDataJa];

function registrationStructure(data) {
  return data.items.map(workshop => ({
    id: workshop.id,
    slug: workshop.slug,
    registrationRequired: workshop.registrationRequired ?? false,
    registrationOpen: workshop.registrationOpen ?? false,
    waitlistEnabled: workshop.waitlistEnabled ?? false,
    durationMinutes: workshop.durationMinutes,
    sessions: (workshop.sessions || []).map(({ id, start, capacity }) => ({ id, start, capacity }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  })).sort((a, b) => a.id.localeCompare(b.id));
}

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_tea_tasting_sessions.sql', import.meta.url), 'utf8'));
  sqlite.exec(`INSERT INTO workshops (id,slug,title,lecturer,short_description,description,start_at,end_at,location,capacity,price_cents,registration_open)
    VALUES ('test-workshop','test','Test','Test','Test','Test','2027-01-01','2027-01-01','Test',99,1250,1);
    INSERT INTO workshop_sessions (id,workshop_id,start_at,capacity) VALUES ('s1','test-workshop','2027-01-01',1), ('s2','test-workshop','2027-01-01',2);`);
  function prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...args) }; },
    };
  }
  const env = { DB: { prepare, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const results = []; for (const statement of statements) results.push(await statement.all()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } }, PAYMENT_IBAN: 'SK7700000000000000000000', PAYMENT_BENEFICIARY_NAME: 'Japan Day' };
  const call = (path, options = {}) => worker.fetch(new Request(`https://api.japanday.sk${path}`, options), env);
  const register = (email = 'test@example.com', session = 's1', extra = {}) => call(`/api/sessions/${session}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://japanday.sk' },
    body: JSON.stringify({ first_name: ' Test ', last_name: ' User ', email, phone: '+421900000000', ...extra }),
  });
  return { sqlite, env, call, register };
}
test('paid snapshot, authoritative price, decoded payload, protected SVG and immutable config', async () => {
  const { sqlite, env, call, register } = setup();
  const response = await register(' TEST@example.com ', 's1', { price_cents: 1, payment_reference: '123' });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true');
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  const { data } = await response.json();
  assert.match(data.registration_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(data.payment_status, 'pending');
  assert.equal(sqlite.prepare('SELECT id, typeof(id) type, payment_status FROM registrations').get().type, 'text');
  assert.equal(sqlite.prepare('SELECT payment_status FROM registrations').get().payment_status, 'pending');
  assert.equal(data.payment.amount_cents, 1250);
  assert.match(data.payment.payment_reference, /^\d{1,10}$/);
  const snapshot = sqlite.prepare('SELECT * FROM registration_payments').get();
  const decoded = decode(snapshot.pay_by_square_payload).payments[0];
  assert.equal(decoded.amount, 12.5);
  assert.equal(decoded.variableSymbol, data.payment.payment_reference);
  assert.equal(sqlite.prepare('SELECT email, first_name FROM registrations').get().email, 'test@example.com');
  assert.notEqual(sqlite.prepare('SELECT registration_access_token_hash FROM registrations').get().registration_access_token_hash, cookie.split(';')[0].split('=')[1]);
  assert.equal((await call(data.payment.qr_url)).status, 404);
  assert.equal((await call(data.payment.qr_url, { headers: { Cookie: `registration_access=${'a'.repeat(64)}` } })).status, 404);
  env.PAYMENT_IBAN = 'invalid';
  sqlite.exec('UPDATE workshops SET price_cents = 9999');
  const svg = await call(data.payment.qr_url, { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal(svg.status, 200);
  assert.equal(svg.headers.get('Content-Type'), 'image/svg+xml');
  assert.equal(svg.headers.get('Cache-Control'), 'private, max-age=300');
  assert.match(await svg.text(), /<svg/);
  assert.equal(sqlite.prepare('SELECT * FROM registration_payments').get().pay_by_square_payload, snapshot.pay_by_square_payload);
});
test('free registration has no payment and requires phone', async () => {
  const { sqlite, register } = setup();
  sqlite.exec('UPDATE workshops SET price_cents = 0');
  assert.equal((await register('a@example.com', 's1', { phone: '' })).status, 400);
  const { data } = await (await register()).json();
  assert.equal(data.payment_status, 'free');
  assert.equal(data.payment, null);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n, 0);
});
test('session capacity, waitlist, duplicates, cancelled re-registration and unique references', async () => {
  const { sqlite, register, call } = setup();
  const first = await (await register()).json();
  assert.equal((await register(' TEST@EXAMPLE.COM ')).status, 409);
  const second = await (await register('second@example.com')).json();
  assert.equal(second.data.status, 'waitlist');
  assert.equal(second.data.payment, null);
  assert.equal(second.data.payment_status, 'not_due');
  assert.equal(sqlite.prepare('SELECT payment_status FROM registrations WHERE id = ?').get(second.data.registration_id).payment_status, 'not_due');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registration_payments WHERE registration_id = ?').get(second.data.registration_id).n, 0);
  const other = await (await register('test@example.com', 's2')).json();
  assert.equal(other.data.status, 'registered');
  assert.notEqual(other.data.payment.payment_reference, first.data.payment.payment_reference);
  const publicData = await (await call('/api/workshops/test')).json();
  assert.equal(publicData.data.sessions[0].registered_count, 1);
  assert.equal(publicData.data.sessions[0].remaining_capacity, 0);
  sqlite.prepare("UPDATE registrations SET status = 'cancelled', payment_status = 'cancelled' WHERE id = ?").run(first.data.registration_id);
  assert.equal((await register()).status, 201);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n, 3);
});
test('missing configuration fails without reservation; inactive sessions and CORS denied', async () => {
  const { env, sqlite, register, call } = setup();
  delete env.PAYMENT_IBAN;
  assert.equal((await register()).status, 503);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registrations').get().n, 0);
  sqlite.exec('UPDATE workshop_sessions SET registration_open = 0');
  assert.equal((await register()).status, 404);
  assert.equal((await call('/api/workshops', { headers: { Origin: 'https://evil.example' } })).status, 403);
  const preflight = await call('/api/sessions/s1/register', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
  assert.equal(preflight.headers.get('Access-Control-Allow-Credentials'), 'true');
});

test('migration preserves historical data, indexes and foreign keys', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  db.exec(`INSERT INTO workshops (id,slug,title,lecturer,short_description,description,start_at,end_at,location,capacity)
    VALUES ('legacy-workshop','legacy','Legacy','Legacy','Legacy','Legacy','2027','2027','Legacy',1);
    INSERT INTO registrations (id,workshop_id,first_name,last_name,email) VALUES ('legacy-registration','legacy-workshop','Legacy','User','legacy@example.com');`);
  db.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  assert.equal(db.prepare('SELECT email FROM registrations').get().email, 'legacy@example.com');
  assert.equal(db.prepare('SELECT session_id FROM registrations').get().session_id, null);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  assert.throws(() => db.exec(`INSERT INTO registrations (workshop_id,first_name,last_name,email) VALUES ('legacy-workshop','New','User','new@example.com')`), /session_id/);
  assert.throws(() => db.exec(`INSERT INTO registrations (id,workshop_id,session_id,first_name,last_name,email,phone) VALUES ('new','legacy-workshop','missing','New','User','new@example.com','123')`), /FOREIGN KEY/);
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map(row => row.name);
  assert.ok(indexes.includes('idx_registrations_payment_status'));
});
test('simultaneous registrations cannot overbook the session', async () => {
  const { sqlite, register } = setup();
  const results = await Promise.all(Array.from({ length: 6 }, (_, i) => register(`person${i}@example.com`)));
  assert.ok(results.every(response => response.status === 201));
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM registrations WHERE status = 'registered'").get().n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n, 1);
});

test('invalid input is rejected without writes', async () => {
  const { sqlite, call, register } = setup();
  for (const body of ['{', 'null', '[]']) {
    assert.equal((await call('/api/sessions/s1/register', { method: 'POST', body })).status, 400);
  }
  for (const extra of [{ email: 'invalid' }, { phone: ' '.repeat(3) }, { first_name: 'a'.repeat(101) }, { last_name: null }]) {
    assert.equal((await register('test@example.com', 's1', extra)).status, 400);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registrations').get().n, 0);
});

test('missing beneficiary fails safely and full paid sessions need no payment config', async () => {
  const { sqlite, env, register } = setup();
  delete env.PAYMENT_BENEFICIARY_NAME;
  assert.equal((await register()).status, 503);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registrations').get().n, 0);
  env.PAYMENT_BENEFICIARY_NAME = 'Test';
  assert.equal((await register()).status, 201);
  delete env.PAYMENT_IBAN;
  const { data } = await (await register('wait@example.com')).json();
  assert.equal(data.status, 'waitlist');
  assert.equal(data.payment, null);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM registration_payments').get().n, 1);
});

test('public capacity excludes waitlist and cancelled registrations, including empty sessions', async () => {
  const { sqlite, register, call } = setup();
  sqlite.exec('UPDATE workshops SET price_cents = 0');
  await register();
  await register('wait@example.com');
  sqlite.exec("UPDATE registrations SET status = 'cancelled' WHERE status = 'registered'");
  let result = await (await call('/api/workshops/test')).json();
  assert.equal(result.data.sessions[0].registered_count, 0);
  assert.equal(result.data.sessions[0].remaining_capacity, 1);
  sqlite.exec('UPDATE workshop_sessions SET active = 0');
  result = await (await call('/api/workshops/test')).json();
  assert.deepEqual(result.data.sessions, []);
});

test('canonical tea tasting sessions register and appear in public availability', async () => {
  const { sqlite, call, register } = setup();
  const tea = workshopData.items.find(workshop => workshop.id === 'cajova-degustacia');
  assert.deepEqual(tea.sessions.map(session => [session.id, session.start, session.capacity, session.location]), [
    ['cajova-degustacia-1245','2026-11-07T12:45:00+01:00',15,null],
    ['cajova-degustacia-1400','2026-11-07T14:00:00+01:00',15,null],
  ]);
  sqlite.exec(`INSERT INTO workshops (id,slug,title,lecturer,short_description,description,start_at,end_at,location,capacity,price_cents,registration_open)
    VALUES ('cajova-degustacia','cajova-degustacia','Tea tasting','Martin Labudik','Tea','Tea tasting','2026-11-07T12:45:00+01:00','2026-11-07T14:45:00+01:00','Tea room',15,0,1)`);
  sqlite.prepare("UPDATE workshops SET price_cents = 0 WHERE slug = 'cajova-degustacia'").run();
  const teaWorkshopId = String(sqlite.prepare("SELECT id FROM workshops WHERE slug = 'cajova-degustacia'").get().id);
  sqlite.prepare('INSERT INTO workshop_sessions (id,workshop_id,start_at,end_at,location,capacity,active,registration_open) VALUES (?,?,?,?,NULL,?,1,1)')
    .run('cajova-degustacia-1245',teaWorkshopId,'2026-11-07T12:45:00+01:00','2026-11-07T13:30:00+01:00',15);
  sqlite.prepare('INSERT INTO workshop_sessions (id,workshop_id,start_at,end_at,location,capacity,active,registration_open) VALUES (?,?,?,?,NULL,?,1,1)')
    .run('cajova-degustacia-1400',teaWorkshopId,'2026-11-07T14:00:00+01:00','2026-11-07T14:45:00+01:00',15);
  for (const [index, id] of ['cajova-degustacia-1245','cajova-degustacia-1400'].entries()) {
    const response = await register(`tea${index}@example.com`, id);
    assert.equal(response.status, 201);
    const { data } = await response.json();
    assert.equal(data.status, 'registered');
    assert.equal(data.payment, null);
  }
  const invalid = await register('invalid@example.com', 'cajova-degustacia-invalid');
  assert.equal(invalid.status, 404);
  assert.deepEqual((await invalid.json()).error.code, 'SESSION_NOT_FOUND');
  const availability = await (await call('/api/workshops/cajova-degustacia')).json();
  assert.deepEqual(availability.data.sessions.map(({id,start_at,capacity,registered_count,remaining_capacity}) =>
    ({id,start_at,capacity,registered_count,remaining_capacity})), [
    {id:'cajova-degustacia-1245',start_at:'2026-11-07T12:45:00+01:00',capacity:15,registered_count:1,remaining_capacity:14},
    {id:'cajova-degustacia-1400',start_at:'2026-11-07T14:00:00+01:00',capacity:15,registered_count:1,remaining_capacity:14},
  ]);
});

test('all locale registration structures match and the production repair seeds every canonical workshop and session', async () => {
  const structures = localizedWorkshopData.map(registrationStructure);
  for (const localized of structures.slice(1)) assert.deepEqual(localized, structures[0]);

  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_tea_tasting_sessions.sql', import.meta.url), 'utf8'));
  const repair = readFileSync(new URL('../migrations/0004_seed_registerable_workshops.sql', import.meta.url), 'utf8');
  const apply = () => {
    sqlite.exec('BEGIN');
    try { sqlite.exec(repair); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  };
  try {
    apply();
    apply();
    const expected = workshopData.items.filter(workshop => workshop.registrationRequired !== false);
    const parents = sqlite.prepare('SELECT id, slug, registration_open FROM workshops ORDER BY slug').all();
    const sessions = sqlite.prepare(`SELECT s.id, s.start_at, s.capacity, s.registration_open, w.slug
      FROM workshop_sessions s JOIN workshops w ON w.id = s.workshop_id ORDER BY s.id`).all();
    assert.equal(parents.length, expected.length);
    assert.equal(sessions.length, expected.reduce((count, workshop) => count + workshop.sessions.length, 0));
    for (const workshop of expected) {
      assert.ok(parents.some(parent => parent.slug === workshop.slug && parent.registration_open === 1), `missing or closed workshop ${workshop.id}`);
      for (const session of workshop.sessions) {
        assert.ok(sessions.some(row => row.id === session.id && row.slug === workshop.slug
          && row.start_at === session.start && row.capacity === session.capacity && row.registration_open === 1),
        `missing or mismatched session ${session.id}`);
      }
    }
    const env = { DB: { prepare(sql) { let args = []; return {
      bind(...values) { args = values; return this; },
      async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...args) }; },
    }; }, async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    } }, PAYMENT_IBAN: 'SK7700000000000000000000', PAYMENT_BENEFICIARY_NAME: 'Japan Day' };
    const missingWorkshop = await worker.fetch(new Request('https://api.japanday.sk/api/workshops/not-a-workshop'), env);
    assert.equal(missingWorkshop.status, 404);
    assert.equal((await missingWorkshop.json()).error.code, 'WORKSHOP_NOT_FOUND');
    const invalidSession = await worker.fetch(new Request('https://api.japanday.sk/api/sessions/not-a-session/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://japanday.sk' },
      body: JSON.stringify({ first_name: 'Test', last_name: 'User', email: 'test@example.com', phone: '123' }),
    }), env);
    assert.equal(invalidSession.status, 404);
    assert.equal((await invalidSession.json()).error.code, 'SESSION_NOT_FOUND');
    const canonicalSessionIds = [
      'japoncina-1100', 'origami-1100', 'shodo-1100', 'tsumami-zaiku-1140',
      'ayatori-1220', 'kumihimo-1100', 'cajova-degustacia-1245', 'cajova-degustacia-1400',
    ];
    for (const [index, sessionId] of canonicalSessionIds.entries()) {
      const response = await worker.fetch(new Request(`https://api.japanday.sk/api/sessions/${sessionId}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://japanday.sk' },
        body: JSON.stringify({ first_name: 'Test', last_name: 'User', email: `session-${index}@example.com`, phone: '123' }),
      }), env);
      assert.equal(response.status, 201, `${sessionId} should be found`);
    }
  } finally {
    sqlite.close();
  }
});


test('production tea seed creates the missing parent and sessions, preserves legacy registrations and is repeatable', async () => {
  const { sqlite, call, register } = setup();
  const seed = readFileSync(new URL('../migrations/0004_seed_registerable_workshops.sql', import.meta.url), 'utf8');
  const apply = () => {
    sqlite.exec('BEGIN');
    try { sqlite.exec(seed); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  };
  apply();
  const tea = sqlite.prepare("SELECT id FROM workshops WHERE slug = 'cajova-degustacia'").get();
  sqlite.exec("DELETE FROM workshop_sessions WHERE id = 'cajova-degustacia-1400'");
  sqlite.prepare('INSERT INTO workshop_sessions (id,workshop_id,start_at,capacity) VALUES (?,?,?,?)')
    .run('cajova-degustacia-1330', String(tea.id), '2026-11-07T13:30:00+01:00', 15);
  const legacy = await (await register('legacy@example.com', 'cajova-degustacia-1330')).json();
  apply();
  apply();
  assert.equal(sqlite.prepare('SELECT session_id FROM registrations WHERE id = ?').get(legacy.data.registration_id).session_id, 'cajova-degustacia-1400');
  assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  for (const id of ['cajova-degustacia-1245', 'cajova-degustacia-1400']) {
    assert.equal((await register('seed@example.com', id)).status, 201);
  }
  const invalid = await register('invalid@example.com', 'cajova-degustacia-invalid');
  assert.equal(invalid.status, 404);
  assert.equal((await invalid.json()).error.code, 'SESSION_NOT_FOUND');
  const { data } = await (await call('/api/workshops/cajova-degustacia')).json();
  assert.deepEqual(data.sessions.map(s => [s.id, s.start_at, s.capacity]), [
    ['cajova-degustacia-1245', '2026-11-07T12:45:00+01:00', 15],
    ['cajova-degustacia-1400', '2026-11-07T14:00:00+01:00', 15],
  ]);
});

test('repair aborts and preserves registrations attached to an unmapped stale session', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  const repair = readFileSync(new URL('../migrations/0004_seed_registerable_workshops.sql', import.meta.url), 'utf8');
  const apply = () => {
    sqlite.exec('BEGIN');
    try { sqlite.exec(repair); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  };
  try {
    apply();
    const parentId = sqlite.prepare("SELECT id FROM workshops WHERE slug = 'japoncina'").get().id;
    sqlite.prepare('INSERT INTO workshop_sessions (id,workshop_id,start_at,capacity) VALUES (?,?,?,?)')
      .run('japoncina-1000', String(parentId), '2026-11-07T10:00:00+01:00', 15);
    sqlite.prepare(`INSERT INTO registrations
      (id,workshop_id,session_id,first_name,last_name,email,phone,status,payment_status)
      VALUES ('preserve-me',?,'japoncina-1000','Test','User','preserve@example.com','123','registered','free')`)
      .run(String(parentId));
    assert.throws(apply, /CHECK constraint failed/);
    assert.equal(sqlite.prepare("SELECT session_id FROM registrations WHERE id = 'preserve-me'").get().session_id, 'japoncina-1000');
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM workshop_sessions WHERE id = 'japoncina-1000'").get().count, 1);
  } finally {
    sqlite.close();
  }
});

test('fresh on-disk migrations enforce canonical schema and constraints', () => {
  const directory = mkdtempSync(join(tmpdir(), 'workshop-migrations-'));
  const db = new DatabaseSync(join(directory, 'fresh.sqlite'));
  try {
    db.exec('PRAGMA foreign_keys = ON');
    for (const migration of ['0001_initial.sql', '0002_workshop_sessions_and_payments.sql']) {
      db.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
    }
    const columns = db.prepare('PRAGMA table_info(registrations)').all();
    const column = name => columns.find(row => row.name === name);
    assert.equal(column('id').type, 'TEXT');
    assert.equal(column('id').pk, 1);
    assert.equal(column('id').dflt_value, null);
    assert.equal(column('id').notnull, 1);
    assert.equal(column('workshop_id').type, 'TEXT');
    assert.equal(column('phone').notnull, 1);
    assert.equal(column('registration_access_token_hash').type, 'TEXT');
    for (const name of ['created_at', 'updated_at']) assert.equal(column(name).dflt_value, 'CURRENT_TIMESTAMP');
    const foreignKeys = db.prepare('PRAGMA foreign_key_list(registrations)').all();
    assert.deepEqual(foreignKeys.map(row => [row.from, row.table, row.to]).sort(),
      [['session_id', 'workshop_sessions', 'id'], ['workshop_id', 'workshops', 'id']]);
    const indexes = db.prepare('PRAGMA index_list(registrations)').all();
    const unique = indexes.find(row => row.name === 'idx_registrations_session_email');
    assert.equal(unique.unique, 1);
    assert.equal(unique.partial, 1);
    assert.deepEqual(db.prepare('PRAGMA index_info(idx_registrations_session_email)').all().map(row => row.name), ['session_id', 'email']);
    assert.ok(!indexes.some(row => row.name === 'idx_registrations_workshop_email'));
    assert.equal(db.prepare('PRAGMA table_info(registration_payments)').all().find(row => row.name === 'registration_id').type, 'TEXT');
    assert.ok(db.prepare('PRAGMA foreign_key_list(registration_payments)').all().some(row => row.from === 'registration_id' && row.table === 'registrations'));
    db.exec(`INSERT INTO workshops (id,slug,title,lecturer,short_description,description,start_at,end_at,location,capacity)
      VALUES ('schema-workshop','schema','Test','Test','Test','Test','2027','2027','Test',2);
      INSERT INTO workshop_sessions (id,workshop_id,start_at,capacity) VALUES ('schema','schema-workshop','2027',2);`);
    const insert = db.prepare(`INSERT INTO registrations
      (id,workshop_id,session_id,first_name,last_name,email,phone,status,payment_status,registration_access_token_hash)
      VALUES (?, 'schema-workshop', 'schema', 'Test', 'User', ?, ?, ?, ?, 'hash')`);
    for (const status of ['free', 'not_due', 'pending', 'paid', 'cancelled']) {
      insert.run(status, `${status}@example.com`, '123', 'registered', status);
    }
    assert.throws(() => insert.run('invalid', 'invalid@example.com', '123', 'registered', 'arbitrary'), /CHECK/);
    assert.throws(() => insert.run('invalid-status', 'invalid@example.com', '123', 'other', 'free'), /CHECK/);
    assert.throws(() => insert.run('no-phone', 'phone@example.com', null, 'registered', 'free'), /NOT NULL/);
    assert.throws(() => insert.run(null, 'no-id@example.com', '123', 'registered', 'free'), /NOT NULL/);
    assert.throws(() => insert.run('duplicate', 'free@example.com', '123', 'registered', 'free'), /UNIQUE/);
    db.exec("UPDATE registrations SET status = 'cancelled', payment_status = 'cancelled' WHERE id = 'free'");
    insert.run('again', 'free@example.com', '123', 'registered', 'free');
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally {
    db.close();
    rmSync(directory, { recursive: true });
  }
});

test('QR treats registration IDs as opaque text and keeps token ownership', async () => {
  const { sqlite, register, call } = setup();
  const response = await register();
  const cookie = response.headers.get('Set-Cookie').split(';')[0];
  const { data } = await response.json();
  const opaque = 'reservation_alpha-xyz';
  sqlite.exec('BEGIN; PRAGMA defer_foreign_keys = ON');
  sqlite.prepare('UPDATE registrations SET id = ? WHERE id = ?').run(opaque, data.registration_id);
  sqlite.prepare('UPDATE registration_payments SET registration_id = ? WHERE registration_id = ?').run(opaque, data.registration_id);
  sqlite.exec('COMMIT');
  const path = `/api/registrations/${opaque}/payment/qr.svg`;
  assert.equal((await call(path, { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await call(path)).status, 404);
});
