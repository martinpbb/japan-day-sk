import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from './worker.js';
import { testD1 } from './test-d1.js';
import { digest, feedbackFields } from './community.js';

const directory = new URL('../migrations/', import.meta.url);
const migrations = readdirSync(directory).filter(name => name.endsWith('.sql')).sort();
const migration = readFileSync(new URL(migrations.at(-1), directory), 'utf8');
function install(sqlite, files = migrations) {
  for (const file of files) {
    sqlite.exec('BEGIN');
    try { sqlite.exec(readFileSync(new URL(file, directory), 'utf8')); sqlite.exec('COMMIT'); }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }
}
function setup(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  sqlite.exec('PRAGMA foreign_keys=ON');
  install(sqlite);
  const messages = [];
  const env = { DB: testD1(sqlite), FEEDBACK_ENABLED: 'true', NEWSLETTER_ENABLED: 'true',
    ABUSE_HMAC_SECRET: 'local-test-only-'.repeat(4), TURNSTILE_SECRET_KEY: 'mock-secret', TURNSTILE_HOSTNAME: 'japanday.sk',
    NEWSLETTER_CONSENT_VERSION: '2026-01', NEWSLETTER_LINK_ORIGIN: 'https://api.japanday.sk',
    SUBMISSION_LIMITER: { async limit() { return { success: true }; } },
    NEWSLETTER_MAILER: { async fetch(request) { messages.push(await request.json()); return new Response(null, { status: 202 }); } },
  };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.body.get('secret'), 'mock-secret');
    return Response.json({ success: true, hostname: 'japanday.sk', action: options.body.get('response').startsWith('feedback') ? 'feedback' : 'newsletter', challenge_ts: new Date().toISOString() });
  });
  const call = (path, body, options = {}) => worker.fetch(new Request(`https://api.japanday.sk/api/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://japanday.sk', 'CF-Connecting-IP': '192.0.2.1', ...options.headers },
    body: JSON.stringify(body), ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'headers')),
  }), env);
  const feedback = (extra = {}) => call('feedback', { edition: 2026, locale: 'sk', rating: 3, turnstileToken: `feedback-${crypto.randomUUID()}`, ...extra });
  const subscribe = (extra = {}) => call('newsletter/subscribe', { email: ' Person@Example.com ', consent: true, consentVersion: '2026-01', locale: 'en', turnstileToken: `newsletter-${crypto.randomUUID()}`, ...extra });
  const token = (index = 0, purpose = 'confirmationUrl') => messages[index][purpose].split('#token=')[1];
  return { sqlite, env, messages, call, feedback, subscribe, token };
}

test('0007 preserves all historical rows, schema, indexes, FKs and rollback/replay', async t => {
  const { sqlite } = setup(t);
  // Populate a separate pre-0007 database using the actual registration API.
  const old = new DatabaseSync(':memory:'); t.after(() => old.close());
  old.exec('PRAGMA foreign_keys=ON'); install(old, migrations.slice(0, -1));
  const session = old.prepare('SELECT s.id FROM workshop_sessions s JOIN workshops w ON w.id=s.workshop_id WHERE s.registration_open=1 AND w.price_cents>0 LIMIT 1').get();
  const response = await worker.fetch(new Request(`https://api.japanday.sk/api/sessions/${session.id}/register`, {
    method: 'POST', body: JSON.stringify({ first_name: '歴史', last_name: 'User', email: 'history@example.com', phone: '123' }),
  }), { DB: testD1(old), PAYMENT_IBAN: 'SK7700000000000000000000', PAYMENT_BENEFICIARY_NAME: 'Japan Day' });
  assert.equal(response.status, 201);
  old.exec("INSERT INTO admin_users VALUES ('admin@example.com','admin',1); INSERT INTO lecturer_workshops SELECT 'admin@example.com',id FROM workshops LIMIT 1");
  const tables = ['workshops','workshop_sessions','registrations','registration_payments','admin_users','lecturer_workshops'];
  const snapshot = () => JSON.stringify(tables.map(table => old.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()));
  const schema = old.prepare("SELECT * FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
  const before = snapshot();
  old.exec('BEGIN');
  assert.throws(() => old.exec(`${migration}\nINSERT INTO event_feedback(id,edition,locale,submitted_at,rating) VALUES ('bad',2026,'sk',1,0)`), /CHECK/);
  old.exec('ROLLBACK');
  assert.equal(snapshot(), before);
  assert.equal(old.prepare("SELECT count(*) n FROM sqlite_master WHERE name='event_feedback'").get().n, 0);
  old.exec('BEGIN'); old.exec(migration); old.exec('COMMIT');
  assert.equal(snapshot(), before);
  for (const object of schema) assert.deepEqual(old.prepare('SELECT * FROM sqlite_master WHERE name=?').get(object.name), object);
  assert.deepEqual(old.prepare('PRAGMA foreign_key_check').all(), []);
  assert.throws(() => { old.exec('BEGIN'); try { old.exec(migration); old.exec('COMMIT'); } catch (e) { old.exec('ROLLBACK'); throw e; } }, /already exists/);
  assert.equal(snapshot(), before);
  assert.equal(old.prepare('SELECT count(*) n FROM registration_payments').get().n, 1);
  assert.throws(() => old.exec("INSERT INTO registrations (id,workshop_id,session_id,first_name,last_name,email,phone,status,payment_status) SELECT 'duplicate',workshop_id,session_id,first_name,last_name,email,phone,status,payment_status FROM registrations"), /UNIQUE/);
  const failure = new DatabaseSync(':memory:'); t.after(() => failure.close()); install(failure, migrations.slice(0,-1));
  failure.exec('BEGIN');
  assert.throws(() => failure.exec(`${migration}\nINSERT INTO event_feedback(id,edition,locale,submitted_at,rating) VALUES ('bad',2026,'sk',1,0)`), /CHECK/);
  failure.exec('ROLLBACK');
  assert.equal(failure.prepare("SELECT count(*) n FROM sqlite_master WHERE name='event_feedback'").get().n, 0);
  assert.ok(sqlite.prepare("SELECT name FROM sqlite_master WHERE name='newsletter_tokens'").get());
});

for (const rating of [1, 3, 5]) test(`feedback rating ${rating}, all questions stored as untrusted text`, async t => {
  const { feedback, sqlite } = setup(t);
  const answers = Object.fromEntries(feedbackFields.map(field => [field, `<script>alert('x')</script> ${field} '; DROP TABLE workshops; --`]));
  const response = await feedback({ rating, ...answers });
  assert.equal(response.status, 201); assert.doesNotMatch(await response.text(), /script|DROP/);
  const row = sqlite.prepare('SELECT * FROM event_feedback').get();
  for (const field of feedbackFields) assert.equal(row[field], answers[field]);
  assert.equal(row.rating, rating); assert.equal(row.edition, 2026);
  assert.ok(!('email' in row)); assert.ok(!('ip' in row));
});
test('minimal anonymous feedback, all optional questions and locales', async t => {
  const { feedback, sqlite } = setup(t);
  for (const locale of ['sk','en','de','es','ja']) assert.equal((await feedback({ locale, rating: undefined, organiser_message: 'Thanks' })).status, 201);
  assert.equal(sqlite.prepare('SELECT rating FROM event_feedback').get().rating, null);
});
const invalidFeedback = [
  ...[0,6,-1,1.5,'3',false].map(rating => ({ rating })),
  { locale: 'fr' }, { locale: null }, { edition: 2027 }, { edition: '2026' },
  { rating: null }, { rating: undefined, enjoyed_most: ' \n\t ' }, { unexpected: true },
  ...feedbackFields.flatMap(field => [{ [field]: 2 }, { [field]: null }, { [field]: 'a'.repeat(2001) }]),
];
for (const [index, payload] of invalidFeedback.entries()) test(`reject invalid feedback ${index}`, async t => {
  const { feedback } = setup(t); assert.equal((await feedback(payload)).status, 400);
});
test('JSON parsing, byte limit and content type', async t => {
  const { call } = setup(t);
  for (const body of ['{', 'null', '[]', '"hello"', '{}']) assert.equal((await call('feedback', null, { body })).status, 400);
  assert.equal((await call('feedback', {}, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await call('feedback', {}, { body: 'a'.repeat(20001) })).status, 413);
  assert.equal((await call('feedback', {}, { headers: { 'Content-Length': '20001' } })).status, 413);
});

test('double opt in, hash-only storage, events, unsubscribe ownership and replay', async t => {
  const { subscribe, call, token, sqlite, messages } = setup(t);
  assert.equal((await subscribe()).status, 202);
  const subscriber = sqlite.prepare('SELECT * FROM newsletter_subscribers').get();
  assert.equal(subscriber.email, 'person@example.com'); assert.equal(subscriber.name, null); assert.equal(subscriber.status, 'pending');
  assert.equal((await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') })).status, 400);
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 200);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'confirmed');
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 400);
  assert.equal((await call('newsletter/unsubscribe', { email: subscriber.email })).status, 400);
  assert.equal((await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') })).status, 200);
  assert.equal((await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') })).status, 400);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'unsubscribed');
  assert.deepEqual(sqlite.prepare('SELECT event FROM newsletter_consent_events ORDER BY rowid').all().map(row => row.event), ['requested','confirmed','withdrawn']);
  const storage = JSON.stringify(sqlite.prepare('SELECT * FROM newsletter_tokens').all());
  assert.ok(!storage.includes(token())); assert.ok(!storage.includes(token(0,'unsubscribeUrl')));
  assert.ok(messages[0].confirmationUrl.includes('#token='));
});
test('signup pause and missing mailer never disable confirmation or token-based unsubscribe', async t => {
  const { subscribe, call, token, env, sqlite } = setup(t);
  await subscribe();
  env.NEWSLETTER_SIGNUP_ENABLED = 'false';
  delete env.NEWSLETTER_MAILER;
  assert.equal((await subscribe()).status, 503);
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 200);
  assert.equal((await call('newsletter/unsubscribe', { token: token(0, 'unsubscribeUrl') })).status, 200);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'unsubscribed');
});
test('email links require the exact Worker origin that owns both landing routes', async t => {
  const { subscribe, env, messages } = setup(t);
  env.NEWSLETTER_LINK_ORIGIN = 'https://japanday.sk';
  assert.equal((await subscribe()).status, 503);
  assert.equal(messages.length, 0);
});
for (const [index, extra] of [
  { consent: undefined }, { consent: false }, { consent: 'true' }, { consentVersion: 'old' },
  { email: undefined }, { email: 'bad' }, { email: 'x\r\n@example.com' }, { email: 'x'.repeat(255) },
  { name: 'x'.repeat(101) }, { name: false }, { locale: 'fr' }, { unknown: 1 },
].entries()) test(`newsletter strict validation ${index}`, async t => {
  const { subscribe, messages } = setup(t); assert.equal((await subscribe(extra)).status, 400); assert.equal(messages.length, 0);
});
test('concurrent duplicate requests do not enumerate or flood, confirmed and resubscribe', async t => {
  const { subscribe, call, token, messages, sqlite } = setup(t);
  const responses = await Promise.all(Array.from({ length: 6 }, () => subscribe({ name: 'Optional name' })));
  const bodies = await Promise.all(responses.map(r => r.text()));
  assert.equal(new Set(bodies).size, 1); assert.equal(messages.length, 1);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM newsletter_subscribers').get().n, 1);
  assert.equal(sqlite.prepare('SELECT name FROM newsletter_subscribers').get().name, 'Optional name');
  assert.equal((await subscribe({ email: 'PERSON@example.COM' })).status, 202);
  await call('newsletter/confirm', { token: token() });
  sqlite.exec('DELETE FROM submission_limits');
  assert.equal(await (await subscribe()).text(), bodies[0]); assert.equal(messages.length, 1);
  await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') });
  sqlite.exec('DELETE FROM submission_limits');
  assert.equal((await subscribe()).status, 202); assert.equal(messages.length, 2);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'pending');
  assert.equal((await call('newsletter/confirm', { token: token(1) })).status, 200);
  assert.equal((await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') })).status, 400);
});
test('invalid, wrong-purpose, expired and concurrent confirmation', async t => {
  const { subscribe, call, token, sqlite } = setup(t); await subscribe();
  assert.equal((await call('newsletter/confirm', { token: 'a'.repeat(64) })).status, 400);
  assert.equal((await call('newsletter/confirm', { token: token(0,'unsubscribeUrl') })).status, 400);
  sqlite.exec("UPDATE newsletter_tokens SET expires_at=created_at+1,created_at=created_at-90000 WHERE purpose='confirm'");
  // Explicit expiry without violating the creation/expiration constraint.
  sqlite.exec("UPDATE newsletter_tokens SET expires_at=created_at+1 WHERE purpose='confirm'");
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 400);
  sqlite.exec("UPDATE newsletter_tokens SET expires_at=unixepoch()+1000 WHERE purpose='confirm'");
  const concurrent = await Promise.all([call('newsletter/confirm', { token: token() }), call('newsletter/confirm', { token: token() })]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200,400]);
  assert.equal(sqlite.prepare("SELECT count(*) n FROM newsletter_consent_events WHERE event='confirmed'").get().n, 1);
});
test('pending renewal invalidates old confirmation; old unused unsubscribe works much later', async t => {
  const { subscribe, call, token, sqlite } = setup(t); await subscribe();
  sqlite.exec('DELETE FROM submission_limits'); await subscribe();
  assert.equal((await call('newsletter/confirm', { token: token(0) })).status, 400);
  assert.equal((await call('newsletter/confirm', { token: token(1) })).status, 200);
  sqlite.exec("UPDATE newsletter_tokens SET created_at=1 WHERE purpose='unsubscribe'");
  assert.equal((await call('newsletter/unsubscribe', { token: token(0,'unsubscribeUrl') })).status, 200);
});

test('feature switches, mandatory dependencies, delivery failures and safe errors', async t => {
  const { feedback, subscribe, env, sqlite, call } = setup(t);
  for (const key of ['FEEDBACK_ENABLED','DB','SUBMISSION_LIMITER','ABUSE_HMAC_SECRET','TURNSTILE_SECRET_KEY','TURNSTILE_HOSTNAME']) {
    const old = env[key]; delete env[key]; assert.equal((await feedback()).status, 503, key); env[key] = old;
  }
  for (const key of ['NEWSLETTER_ENABLED','NEWSLETTER_MAILER','NEWSLETTER_LINK_ORIGIN','NEWSLETTER_CONSENT_VERSION']) {
    const old = env[key]; delete env[key]; assert.equal((await subscribe()).status, 503, key); env[key] = old;
  }
  assert.equal(sqlite.prepare('SELECT count(*) n FROM newsletter_subscribers').get().n, 0);
  env.NEWSLETTER_MAILER.fetch = async () => { throw new Error('secret provider detail'); };
  assert.equal((await subscribe()).status, 202);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'pending');
  assert.equal(sqlite.prepare("SELECT count(*) n FROM newsletter_tokens WHERE purpose='confirm' AND consumed_at IS NULL").get().n, 0);
  env.DB = { prepare() { throw new Error('SQL secret@example.com password'); } };
  const response = await feedback(); assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /SQL|secret|password/);
  assert.equal((await call('newsletter/unsubscribe', { token: 'a'.repeat(64) })).status, 500);
});
test('Turnstile failures, hostname, action, age, replay and outage', async t => {
  const { feedback } = setup(t);
  assert.equal((await feedback({ turnstileToken: undefined })).status, 400);
  for (const extra of [{ success: false }, { hostname: 'evil.example' }, { action: 'wrong' }, { challenge_ts: 'bad' }, { challenge_ts: new Date(0).toISOString() }]) {
    globalThis.fetch = async () => Response.json({ success: true, hostname: 'japanday.sk', action: 'feedback', challenge_ts: new Date().toISOString(), ...extra });
    assert.equal((await feedback()).status, 403);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal((await feedback()).status, 503);
  globalThis.fetch = async () => Response.json({ success: true, hostname: 'japanday.sk', action: 'feedback', challenge_ts: new Date().toISOString() });
  assert.equal((await feedback({ turnstileToken: 'feedback-replay' })).status, 201);
  assert.equal((await feedback({ turnstileToken: 'feedback-replay' })).status, 403);
});
test('rate limiting binding and durable global IP allowance', async t => {
  const { feedback, env, sqlite } = setup(t);
  env.SUBMISSION_LIMITER.limit = async () => ({ success: false }); assert.equal((await feedback()).status, 429);
  env.SUBMISSION_LIMITER.limit = async () => ({ success: true });
  await feedback(); sqlite.exec('UPDATE submission_limits SET count=60');
  assert.equal((await feedback()).status, 429);
  assert.doesNotMatch(JSON.stringify(sqlite.prepare('SELECT * FROM submission_limits').all()), /192\.0\.2\.1/);
});
test('token bursts use their own edge limit and avoid D1 work after rejection', async t => {
  const { call, env } = setup(t);
  let tokenAttempts = 0, dbPrepares = 0;
  const prepare = env.DB.prepare.bind(env.DB);
  env.DB.prepare = (...args) => { dbPrepares++; return prepare(...args); };
  env.SUBMISSION_LIMITER.limit = async ({ key }) => {
    if (key.startsWith('newsletter-token:')) return { success: ++tokenAttempts <= 4 };
    return { success: true };
  };
  const responses = await Promise.all(Array.from({ length: 20 }, () => call('newsletter/unsubscribe', { token: 'a'.repeat(64) })));
  assert.equal(responses.filter(response => response.status === 400).length, 4);
  assert.equal(responses.filter(response => response.status === 429).length, 16);
  assert.equal(dbPrepares, 16); // Four admitted attempts each execute the atomic token batch.
});
test('scheduled abuse cleanup deletes at most 500 expired rows per table', async t => {
  const { env, sqlite } = setup(t);
  sqlite.exec(`WITH RECURSIVE rows(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM rows WHERE n<501)
    INSERT INTO submission_limits(key_hash,count,expires_at) SELECT printf('%064d',n),1,1 FROM rows;
    WITH RECURSIVE rows(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM rows WHERE n<501)
    INSERT INTO submission_challenges(token_hash,expires_at) SELECT printf('%064d',n),1 FROM rows;`);
  await worker.scheduled({}, env);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM submission_limits').get().n, 1);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM submission_challenges').get().n, 1);
});
test('CORS, preflight, no GET mutations, no personal-data endpoints or unsafe admin access', async t => {
  const { call, subscribe, sqlite, token, env } = setup(t); await subscribe();
  for (const path of ['feedback','newsletter/subscribe','newsletter/confirm','newsletter/unsubscribe']) {
    for (const method of ['GET','PUT','DELETE','HEAD']) assert.equal((await call(path, null, { method, body: undefined })).status, 405);
    assert.equal((await call(path, {}, { headers: { Origin: 'https://evil.example' } })).status, 403);
    for (const origin of ['https://japanday.sk','https://www.japanday.sk','http://localhost:5173']) {
      const response = await call(path, null, { method: 'OPTIONS', body: undefined, headers: { Origin: origin } });
      assert.equal(response.status, 204); assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    }
  }
  assert.equal((await call(`newsletter/confirm?token=${token()}`, null, { method: 'GET', body: undefined })).status, 405);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'pending');
  const apiOrigin = await worker.fetch(new Request('https://api.japanday.sk/api/newsletter/confirm', {
    method: 'POST', headers: { Origin: 'https://api.japanday.sk', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify({ token: token() }),
  }), env);
  assert.equal(apiOrigin.status, 200);
  for (const path of ['/api/health', '/api/newsletter/subscribe']) {
    assert.equal((await worker.fetch(new Request(`https://api.japanday.sk${path}`, { method: 'POST', headers: { Origin: 'https://api.japanday.sk' }, body: '{}' }), {})).status, 403);
  }
  for (const path of ['newsletter/subscribers', 'feedback/export', 'admin/newsletter', 'admin/feedback']) {
    const response = await call(path, null, { method: 'GET', body: undefined });
    assert.ok([401,404].includes(response.status)); assert.doesNotMatch(await response.text(), /person@example.com/);
  }
});
test('database constraints independently enforce feedback, token, email uniqueness and foreign keys', async t => {
  const { sqlite, subscribe } = setup(t); await subscribe();
  for (const [column, value] of [['rating', 0], ['edition', 2027], ['locale', 'fr'], ['rating', 2.5]]) {
    assert.throws(() => sqlite.prepare(`INSERT INTO event_feedback(id,edition,locale,submitted_at,rating) VALUES ('bad',2026,'sk',1,3)`).run() && sqlite.prepare(`UPDATE event_feedback SET ${column}=?`).run(value));
    sqlite.exec("DELETE FROM event_feedback WHERE id='bad'");
  }
  assert.throws(() => sqlite.exec("INSERT INTO event_feedback(id,edition,locale,submitted_at) VALUES ('empty',2026,'sk',1)"), /CHECK/);
  assert.throws(() => sqlite.exec("UPDATE newsletter_subscribers SET status='confirmed'"), /CHECK/);
  assert.throws(() => sqlite.exec("UPDATE newsletter_subscribers SET email='PERSON@example.com'"), /CHECK/);
  assert.throws(() => sqlite.exec("INSERT INTO newsletter_subscribers SELECT 'other',email,name,status,consent_version,consent_accepted_at,confirmed_at,unsubscribed_at,source_locale,created_at,updated_at FROM newsletter_subscribers"), /UNIQUE/);
  assert.throws(() => sqlite.prepare('INSERT INTO newsletter_tokens(token_hash,subscriber_id,purpose,created_at,expires_at) VALUES (?,?,?,?,?)').run('a'.repeat(64),'missing','confirm',1,2), /FOREIGN KEY/);
  assert.throws(() => sqlite.exec("UPDATE newsletter_tokens SET purpose='other'"), /CHECK/);
  assert.equal(await digest('test'), '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
});

test('confirmation batch failure rolls back token, subscriber and consent event atomically', async t => {
  const { env, sqlite, subscribe, call, token } = setup(t); await subscribe();
  const original = env.DB.batch.bind(env.DB);
  env.DB.batch = statements => original([...statements, env.DB.prepare("INSERT INTO newsletter_consent_events(id,subscriber_id,event,consent_version,occurred_at) VALUES ('bad','missing','invalid','v1',1)")]);
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 500);
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'pending');
  assert.equal(sqlite.prepare("SELECT consumed_at FROM newsletter_tokens WHERE purpose='confirm'").get().consumed_at, null);
  assert.equal(sqlite.prepare('SELECT count(*) n FROM newsletter_consent_events').get().n, 1);
  env.DB.batch = original;
  assert.equal((await call('newsletter/confirm', { token: token() })).status, 200);
});

test('feedback database insert failure never returns success or leaks answers', async t => {
  const { sqlite, feedback } = setup(t);
  sqlite.exec('DROP TABLE event_feedback'); // Isolated fixture only; never a migration.
  const response = await feedback({ organiser_message: 'private <script>' });
  assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /private|script|table|SQL/);
});

test('email landing GET has CSP, no-referrer and never mutates subscriptions', async t => {
  const { call, subscribe, sqlite } = setup(t); await subscribe();
  for (const purpose of ['confirm', 'unsubscribe']) {
    const response = await call(`../newsletter/${purpose}?locale=ja`, null, { method: 'GET', body: undefined });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.match(await response.text(), /<html lang="ja">/);
  }
  assert.equal(sqlite.prepare('SELECT status FROM newsletter_subscribers').get().status, 'pending');
});
