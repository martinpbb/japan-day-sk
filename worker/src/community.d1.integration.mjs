import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPlatformProxy } from 'wrangler';
import worker from './worker.js';

test('feedback inserts against actual isolated local D1/workerd binding', async t => {
  const persist = mkdtempSync(join(tmpdir(), 'japanday-d1-phase3-'));
  const proxy = await getPlatformProxy({ configPath: 'worker/wrangler.toml', persist: { path: persist } });
  t.after(async () => { await proxy.dispose(); rmSync(persist, { recursive: true, force: true }); });
  const sql = readFileSync(new URL('../migrations/0007_feedback_newsletter.sql', import.meta.url), 'utf8').replace(/^--.*$/gm, '');
  // Only this new migration, against an empty isolated local D1; no production connection.
  for (const statement of sql.split(';').filter(s => s.trim())) await proxy.env.DB.prepare(statement).run();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, hostname: 'japanday.sk', action: 'feedback', challenge_ts: new Date().toISOString() }));
  const env = { ...proxy.env, FEEDBACK_ENABLED: 'true', ABUSE_HMAC_SECRET: 'local-only-test-secret-'.repeat(3),
    TURNSTILE_SECRET_KEY: 'mock-secret', TURNSTILE_HOSTNAME: 'japanday.sk', SUBMISSION_LIMITER: { async limit() { return { success: true }; } } };
  const response = await worker.fetch(new Request('https://api.japanday.sk/api/feedback', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10' },
    body: JSON.stringify({ edition: 2026, locale: 'ja', favourite_food_drink: '抹茶', turnstileToken: 'mock-local-d1-token' }),
  }), env);
  assert.equal(response.status, 201, await response.text());
  const row = await proxy.env.DB.prepare('SELECT * FROM event_feedback').first();
  assert.equal(row.favourite_food_drink, '抹茶'); assert.equal(row.rating, null);
});
