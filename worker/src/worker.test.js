import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { decode } from 'bysquare/pay';
import worker from './worker.js';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  sqlite.exec(`INSERT INTO workshops (slug,title,lecturer,short_description,description,start_at,end_at,location,capacity,price_cents,registration_open)
    VALUES ('test','Test','Test','Test','Test','2027-01-01','2027-01-01','Test',99,1250,1);
    INSERT INTO workshop_sessions (id,workshop_id,start_at,capacity) VALUES ('s1','1','2027-01-01',1), ('s2','1','2027-01-01',2);`);
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
  assert.equal(data.payment.amount_cents, 1250);
  assert.match(data.payment.payment_reference, /^\d{1,10}$/);
  const snapshot = sqlite.prepare('SELECT * FROM registration_payments').get();
  const decoded = decode(snapshot.pay_by_square_payload).payments[0];
  assert.equal(decoded.amount, 12.5);
  assert.equal(decoded.variableSymbol, data.payment.payment_reference);
  assert.equal(sqlite.prepare('SELECT email, first_name FROM registrations').get().email, 'test@example.com');
  assert.notEqual(sqlite.prepare('SELECT access_token_hash FROM registrations').get().access_token_hash, cookie.split(';')[0].split('=')[1]);
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
  assert.equal((await register()).status, 409);
  const second = await (await register('second@example.com')).json();
  assert.equal(second.data.status, 'waitlist');
  assert.equal(second.data.payment, null);
  assert.equal(second.data.payment_status, 'not_due');
  const other = await (await register('test@example.com', 's2')).json();
  assert.equal(other.data.status, 'registered');
  assert.notEqual(other.data.payment.payment_reference, first.data.payment.payment_reference);
  const publicData = await (await call('/api/workshops/test')).json();
  assert.equal(publicData.data.sessions[0].registered_count, 1);
  assert.equal(publicData.data.sessions[0].remaining_capacity, 0);
  sqlite.exec(`UPDATE registrations SET status = 'cancelled' WHERE id = ${first.data.registration_id}`);
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
  db.exec(`INSERT INTO workshops (slug,title,lecturer,short_description,description,start_at,end_at,location,capacity)
    VALUES ('legacy','Legacy','Legacy','Legacy','Legacy','2027','2027','Legacy',1);
    INSERT INTO registrations (workshop_id,first_name,last_name,email) VALUES (1,'Legacy','User','legacy@example.com');`);
  db.exec(readFileSync(new URL('../migrations/0002_workshop_sessions_and_payments.sql', import.meta.url), 'utf8'));
  assert.equal(db.prepare('SELECT email FROM registrations').get().email, 'legacy@example.com');
  assert.equal(db.prepare('SELECT session_id FROM registrations').get().session_id, null);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  assert.throws(() => db.exec(`INSERT INTO registrations (workshop_id,first_name,last_name,email) VALUES (1,'New','User','new@example.com')`), /session_id/);
  assert.throws(() => db.exec(`INSERT INTO registrations (workshop_id,session_id,first_name,last_name,email) VALUES (1,'missing','New','User','new@example.com')`), /FOREIGN KEY/);
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
