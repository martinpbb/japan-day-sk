import test from 'node:test';
import assert from 'node:assert/strict';
import { createMailer, renderEmail } from './index.js';

const urls = { confirmationUrl: 'https://api.japanday.sk/newsletter/confirm?locale=sk#token=' + 'a'.repeat(64), unsubscribeUrl: 'https://api.japanday.sk/newsletter/unsubscribe?locale=sk#token=' + 'b'.repeat(64) };
function setup() {
  const rows = new Map();
  const db = { prepare(sql) { return { bind(...args) { return { async first() {
    if (sql.startsWith('INSERT')) { if (rows.has(args[0])) return null; rows.set(args[0], args[1]); return { idempotency_key: args[0] }; }
    return rows.has(args[0]) ? { state: rows.get(args[0]) } : null;
  }, async run() { if (sql.startsWith('UPDATE')) rows.set(args[1], sql.includes("state='sent'") ? 'sent' : 'failed'); } }; } }; } };
  return { rows, env: { DELIVERY_DB: db, BREVO_API_KEY: 'mock-only', MAIL_FROM_EMAIL: 'hello@example.test', MAIL_FROM_NAME: 'Japan Day' } };
}
function req(id = 'a'.repeat(64)) { return new Request('https://newsletter-mailer.internal/confirmation', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': id }, body: JSON.stringify({ id, email: 'person@example.test', locale: 'en', ...urls }) }); }

test('renders all five localized templates with unchanged token URLs', () => {
  for (const locale of ['sk','en','de','es','ja']) {
    const result = renderEmail({ id: 'a'.repeat(64), locale, ...urls });
    assert.ok(result.subject);
    assert.ok(result.text.includes(urls.confirmationUrl));
    assert.ok(result.html.includes(urls.unsubscribeUrl));
  }
});

test('rejects links outside the API origin before provider call', () => {
  assert.throws(() => renderEmail({ id: 'a'.repeat(64), locale: 'en', ...urls, confirmationUrl: 'https://evil.example/#token=x' }));
});

test('mailer rejects direct public requests and only accepts its service binding hostname', async () => {
  const { env } = setup(); let calls = 0;
  const mailer = createMailer({ fetcher: async () => { calls++; return new Response('', { status: 201 }); } });
  const publicRequest = new Request('https://japanday-newsletter-mailer-staging.workers.dev/confirmation', { method: 'POST', body: JSON.stringify({ id: 'a'.repeat(64), locale: 'en', email: 'person@example.test', ...urls }), headers: { 'Idempotency-Key': 'a'.repeat(64) } });
  assert.equal((await mailer.fetch(publicRequest, env)).status, 404);
  assert.equal(calls, 0);
});

test('sends one Brevo request and persists idempotent duplicate result', async () => {
  const { env, rows } = setup(); let calls = 0;
  const mailer = createMailer({ fetcher: async (_url, options) => { calls++; assert.equal(options.headers['api-key'], 'mock-only'); return new Response('{}', { status: 201 }); } });
  assert.equal((await mailer.fetch(req(), env)).status, 202);
  assert.equal((await mailer.fetch(req(), env)).status, 202);
  assert.equal(calls, 1); assert.equal(rows.get('a'.repeat(64)), 'sent');
});

test('provider timeout fails closed and duplicate retry never resends ambiguous mail', async () => {
  const { env, rows } = setup(); let calls = 0;
  const mailer = createMailer({ fetcher: async () => { calls++; throw new Error('timeout'); } });
  assert.equal((await mailer.fetch(req(), env)).status, 503);
  assert.equal((await mailer.fetch(req(), env)).status, 503);
  assert.equal(calls, 1); assert.equal(rows.get('a'.repeat(64)), 'failed');
});

test('provider rejection is sanitized and cannot expose response body', async () => {
  const { env, rows } = setup();
  const mailer = createMailer({ fetcher: async () => new Response('contains private provider diagnostics', { status: 400 }) });
  const response = await mailer.fetch(req(), env);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(rows.get('a'.repeat(64)), 'failed');
});

test('provider 5xx is treated as ambiguous and never retried', async () => {
  const { env } = setup(); let calls = 0;
  const mailer = createMailer({ fetcher: async () => { calls++; return new Response('', { status: 502 }); } });
  assert.equal((await mailer.fetch(req(), env)).status, 503);
  assert.equal(calls, 1);
});

test('explicit 429 retries once after a bounded Retry-After', async () => {
  const { env } = setup(); let calls = 0;
  const mailer = createMailer({ fetcher: async () => ++calls === 1 ? new Response('', { status: 429, headers: { 'Retry-After': '0' } }) : new Response('', { status: 201 }) });
  assert.equal((await mailer.fetch(req(), env)).status, 202); assert.equal(calls, 2);
});

test('mock provider is injectable for local service binding flows', async () => {
  const { env } = setup(); let delivered = 0;
  const mailer = createMailer({ mockProvider: async (message, content) => { delivered++; assert.equal(message.locale, 'en'); assert.ok(content.html); } });
  assert.equal((await mailer.fetch(req(), env)).status, 202); assert.equal(delivered, 1);
});
