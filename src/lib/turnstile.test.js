import test from 'node:test';
import assert from 'node:assert/strict';
import { createTurnstileTokenProvider } from './turnstile.js';

test('explicit Turnstile uses distinct supported actions and issues fresh tokens after reset', async t => {
  let options; let resets = 0; let executions = 0;
  globalThis.turnstile = {
    render(_container, config) { options = config; return 'widget-1'; },
    execute() { executions++; queueMicrotask(() => options.callback(`token-${executions}`)); },
    reset() { resets++; }, remove() {},
  };
  globalThis.document = { createElement() { throw new Error('Existing mock API should prevent script insertion'); }, getElementById() { return null; } };
  t.after(() => { delete globalThis.turnstile; delete globalThis.document; });
  for (const [index, action] of ['feedback', 'newsletter'].entries()) {
    const provider = createTurnstileTokenProvider({ action, sitekey: 'public-staging-site-key', container: {} });
    assert.equal(await provider.getToken(), `token-${index * 2 + 1}`);
    assert.equal(options.action, action);
    await provider.reset();
    assert.equal(await provider.getToken(), `token-${index * 2 + 2}`);
    options['expired-callback']();
    assert.ok(resets >= 2);
    provider.destroy();
  }
});

test('Turnstile rejects unsupported action names', () => {
  assert.throws(() => createTurnstileTokenProvider({ action: 'other', sitekey: 'x', container: {} }));
});
