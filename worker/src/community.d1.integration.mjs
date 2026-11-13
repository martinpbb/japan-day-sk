import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPlatformProxy } from 'wrangler';
import { chromium } from '@playwright/test';
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

test('browser signup, API-origin confirmation and unsubscribe use actual Worker routes and isolated D1', { timeout: 30000 }, async t => {
  const persist = mkdtempSync(join(tmpdir(), 'japanday-newsletter-d1-'));
  const proxy = await getPlatformProxy({ configPath: 'worker/wrangler.toml', persist: { path: persist } });
  const browser = await chromium.launch({ headless: true });
  t.after(async () => { await browser.close(); await proxy.dispose(); rmSync(persist, { recursive: true, force: true }); });
  const sql = readFileSync(new URL('../migrations/0007_feedback_newsletter.sql', import.meta.url), 'utf8').replace(/^--.*$/gm, '');
  for (const statement of sql.split(';').filter(s => s.trim())) await proxy.env.DB.prepare(statement).run();
  const messages = [];
  const env = { ...proxy.env, NEWSLETTER_SIGNUP_ENABLED: 'true', NEWSLETTER_TOKEN_ACTIONS_ENABLED: 'true',
    NEWSLETTER_CONSENT_VERSION: 'test-v1', NEWSLETTER_LINK_ORIGIN: 'https://api.japanday.sk',
    ABUSE_HMAC_SECRET: 'local-only-newsletter-test-secret-000000', TURNSTILE_SECRET_KEY: 'mock-secret',
    TURNSTILE_HOSTNAME: 'japanday.sk', SUBMISSION_LIMITER: { async limit() { return { success: true }; } },
    NEWSLETTER_MAILER: { async fetch(request) { messages.push(await request.json()); return new Response(null, { status: 202 }); } } };
  t.mock.method(globalThis, 'fetch', async (_url, options) => Response.json({ success: true, hostname: 'japanday.sk',
    action: options.body.get('response').startsWith('newsletter') ? 'newsletter' : 'feedback', challenge_ts: new Date().toISOString() }));
  const context = await browser.newContext();
  await context.route('https://japanday.sk/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Signup test</title>' }));
  await context.route('https://api.japanday.sk/**', async route => {
    const request = route.request();
    const incoming = request.headers();
    const headers = new Headers({ 'CF-Connecting-IP': '192.0.2.44' });
    if (incoming.origin) headers.set('Origin', incoming.origin);
    if (incoming['content-type']) headers.set('Content-Type', incoming['content-type']);
    const init = { method: request.method(), headers };
    if (!['GET', 'HEAD'].includes(request.method())) init.body = request.postDataBuffer();
    const response = await worker.fetch(new Request(request.url(), init), env);
    const body = await response.text();
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(8000);
  await page.goto('https://japanday.sk/signup');
  const signup = await page.evaluate(async () => {
    const response = await fetch('https://api.japanday.sk/api/newsletter/subscribe', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'browser@example.com', consent: true,
        consentVersion: 'test-v1', locale: 'en', turnstileToken: `newsletter-${crypto.randomUUID()}` }) });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(signup.status, 202, JSON.stringify(signup));
  assert.equal(messages.length, 1);
  assert.match(messages[0].confirmationUrl, /^https:\/\/api\.japanday\.sk\/newsletter\/confirm/);
  assert.match(messages[0].unsubscribeUrl, /^https:\/\/api\.japanday\.sk\/newsletter\/unsubscribe/);
  const postToken = (token, purpose = 'confirm') => worker.fetch(new Request(`https://api.japanday.sk/api/newsletter/${purpose}`, { method: 'POST',
    headers: { Origin: 'https://api.japanday.sk', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.44' },
    body: JSON.stringify({ token }) }), env);
  const emailClick = async link => {
    await page.goto(link);
    await page.getByRole('button').click();
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent.length > 0);
    return page.locator('[role=status]').textContent();
  };
  assert.ok(await emailClick(messages[0].confirmationUrl));
  let row = await proxy.env.DB.prepare('SELECT status FROM newsletter_subscribers WHERE email=?').bind('browser@example.com').first();
  assert.equal(row.status, 'confirmed');
  const firstToken = new URL(messages[0].confirmationUrl).hash.slice('#token='.length);
  assert.equal((await postToken(firstToken)).status, 400); // Reused confirmation token is rejected.
  row = await proxy.env.DB.prepare('SELECT status FROM newsletter_subscribers WHERE email=?').bind('browser@example.com').first();
  assert.equal(row.status, 'confirmed');

  // Confirm two concurrent transitions against the real local D1 binding.
  await page.goto('https://japanday.sk/signup');
  const second = await page.evaluate(async () => {
    const response = await fetch('https://api.japanday.sk/api/newsletter/subscribe', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'concurrent@example.com', consent: true,
        consentVersion: 'test-v1', locale: 'en', turnstileToken: `newsletter-${crypto.randomUUID()}` }) });
    return response.status;
  });
  assert.equal(second, 202);
  const secondToken = new URL(messages[1].confirmationUrl).hash.slice('#token='.length);
  const concurrent = await Promise.all([postToken(secondToken), postToken(secondToken)]);
  assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 400]);

  // Expire a third confirmation token in local D1 and verify it cannot confirm.
  await page.goto('https://japanday.sk/signup');
  const third = await page.evaluate(async () => {
    const response = await fetch('https://api.japanday.sk/api/newsletter/subscribe', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'stale@example.com', consent: true,
        consentVersion: 'test-v1', locale: 'en', turnstileToken: `newsletter-${crypto.randomUUID()}` }) });
    return response.status;
  });
  assert.equal(third, 202);
  const staleToken = new URL(messages[2].confirmationUrl).hash.slice('#token='.length);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(staleToken))), byte => byte.toString(16).padStart(2, '0')).join('');
  await proxy.env.DB.prepare('UPDATE newsletter_tokens SET created_at=1, expires_at=2 WHERE token_hash=?').bind(hash).run();
  assert.equal((await postToken(staleToken)).status, 400);

  env.NEWSLETTER_SIGNUP_ENABLED = 'false';
  delete env.NEWSLETTER_MAILER;
  await page.goto('https://japanday.sk/signup');
  const paused = await page.evaluate(async () => (await fetch('https://api.japanday.sk/api/newsletter/subscribe', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
  assert.equal(paused, 503);
  assert.ok(await emailClick(messages[0].unsubscribeUrl)); // No signup flag or mailer required.
  row = await proxy.env.DB.prepare('SELECT status FROM newsletter_subscribers WHERE email=?').bind('browser@example.com').first();
  assert.equal(row.status, 'unsubscribed');
  const unsubscribeToken = new URL(messages[0].unsubscribeUrl).hash.slice('#token='.length);
  assert.equal((await postToken(unsubscribeToken, 'unsubscribe')).status, 400); // Replayed withdrawal cannot change state.
  row = await proxy.env.DB.prepare('SELECT status FROM newsletter_subscribers WHERE email=?').bind('browser@example.com').first();
  assert.equal(row.status, 'unsubscribed');
  await context.close();
});
