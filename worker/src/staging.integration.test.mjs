import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPlatformProxy } from 'wrangler';
import staging from './staging.js';

const origin = 'https://japanday-sk-web-staging.marzo2k.workers.dev';
const token = prefix => `${prefix}-${crypto.randomUUID()}`;

test('isolated staging feedback lifecycle uses local D1, exact origin and mocked Turnstile only', { timeout: 30000 }, async t => {
  const persist = mkdtempSync(join(tmpdir(), 'japanday-feedback-staging-'));
  const previousXdg = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = join(persist, 'xdg-config');
  mkdirSync(process.env.XDG_CONFIG_HOME);
  const proxy = await getPlatformProxy({ configPath: 'worker/wrangler.staging.local.toml', persist: { path: persist } });
  t.after(async () => {
    await proxy.dispose();
    if (previousXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = previousXdg;
    rmSync(persist, { recursive: true, force: true });
  });
  const migration = readFileSync(new URL('../migrations/0007_feedback_newsletter.sql', import.meta.url), 'utf8').replace(/^--.*$/gm, '');
  for (const statement of migration.split(';').filter(value => value.trim())) await proxy.env.DB.prepare(statement).run();

  let verify = async submitted => Response.json({ success: true, hostname: proxy.env.TURNSTILE_HOSTNAME,
    action: 'feedback', challenge_ts: new Date().toISOString(), submitted });
  let edgeAllowed = true;
  const env = { ...proxy.env, FEEDBACK_ENABLED: 'true', NEWSLETTER_SIGNUP_ENABLED: 'false',
    ABUSE_HMAC_SECRET: 'local-feedback-staging-only-secret-000000', TURNSTILE_SECRET_KEY: 'mock-local-only',
    SUBMISSION_LIMITER: { async limit() { return { success: edgeAllowed }; } } };
  t.mock.method(globalThis, 'fetch', async (_url, options) => verify(options.body.get('response')));
  const request = (data, requestOrigin = origin) => staging.fetch(new Request('https://api-staging.example.workers.dev/api/feedback', {
    method: 'POST', headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}), 'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.87' }, body: JSON.stringify(data),
  }), env);
  const submission = (locale, challenge = token(locale), extra = {}) => ({ edition: 2026, locale,
    favourite_food_drink: 'Matcha', turnstileToken: challenge, ...extra });

  assert.equal((await request(submission('sk'), 'https://attacker.example')).status, 403);
  assert.equal((await request(submission('sk'), null)).status, 403);
  assert.equal((await request({ edition: 2026, locale: 'sk', turnstileToken: token('empty') })).status, 400);

  for (const locale of ['sk', 'en', 'de', 'es', 'ja']) {
    const response = await request(submission(locale));
    assert.equal(response.status, 201, await response.text());
  }
  const rows = await proxy.env.DB.prepare('SELECT locale,favourite_food_drink FROM event_feedback ORDER BY locale').all();
  assert.deepEqual(rows.results.map(row => row.locale), ['de', 'en', 'es', 'ja', 'sk']);
  assert.ok(rows.results.every(row => row.favourite_food_drink === 'Matcha'));

  verify = async () => Response.json({ success: false });
  assert.equal((await request(submission('sk'))).status, 403, 'incorrect Turnstile token');
  verify = async submitted => Response.json({ success: true, hostname: 'some-other-host.example', action: 'feedback', challenge_ts: new Date().toISOString(), submitted });
  assert.equal((await request(submission('sk'))).status, 403, 'Turnstile hostname must match staging web hostname');
  verify = async () => Response.json({ success: true, hostname: env.TURNSTILE_HOSTNAME, action: 'feedback', challenge_ts: new Date(0).toISOString() });
  assert.equal((await request(submission('sk'))).status, 403, 'expired Turnstile token');
  verify = async submitted => Response.json({ success: true, hostname: env.TURNSTILE_HOSTNAME, action: 'feedback', challenge_ts: new Date().toISOString(), submitted });
  const replay = token('replay');
  assert.equal((await request(submission('sk', replay))).status, 201);
  assert.equal((await request(submission('sk', replay))).status, 403, 'replayed Turnstile token');

  edgeAllowed = false;
  assert.equal((await request(submission('sk'))).status, 429);
  edgeAllowed = true;
  verify = async () => { throw new Error('network unavailable'); };
  assert.equal((await request(submission('sk'))).status, 503, 'Siteverify network error');
  verify = async submitted => Response.json({ success: true, hostname: env.TURNSTILE_HOSTNAME, action: 'feedback', challenge_ts: new Date().toISOString(), submitted });
  const newsletter = await staging.fetch(new Request('https://api-staging.example.workers.dev/api/newsletter/subscribe', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}',
  }), env);
  assert.equal(newsletter.status, 503, 'newsletter stays disabled and no mailer binding exists');

  env.DB = { prepare() { throw new Error('local database failure: private detail'); } };
  const dbError = await request(submission('sk'));
  assert.equal(dbError.status, 500);
  assert.doesNotMatch(await dbError.text(), /private detail|database failure/);
});
