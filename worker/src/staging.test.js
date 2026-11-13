import test from 'node:test';
import assert from 'node:assert/strict';
import staging from './staging.js';

test('staging wrapper allows CORS only for the configured exact HTTPS origin', async () => {
  const env = { STAGING_ALLOWED_ORIGIN: 'https://preview.example.workers.dev' };
  const allowed = await staging.fetch(new Request('https://api-staging.example.workers.dev/api/health', { headers: { Origin: env.STAGING_ALLOWED_ORIGIN } }), env);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), env.STAGING_ALLOWED_ORIGIN);
  const denied = await staging.fetch(new Request('https://api-staging.example.workers.dev/api/health', { headers: { Origin: 'https://attacker.example' } }), env);
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.has('Access-Control-Allow-Origin'), false);
});

test('staging wrapper fails closed for missing or wildcard origin configuration', async () => {
  for (const env of [{}, { STAGING_ALLOWED_ORIGIN: 'https://*.workers.dev' }]) {
    const response = await staging.fetch(new Request('https://api-staging.example.workers.dev/api/health'), env);
    assert.equal(response.status, 503);
  }
});
