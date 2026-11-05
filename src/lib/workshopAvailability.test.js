import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkshopAvailability } from './workshopAvailability.js';

test('availability store shares concurrent requests and cached data within a runtime', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ ok: true, data: [{ sessionId: 's1', registered: 2, capacity: 5, available: 3 }] }));
  };
  try {
    const [first, second] = await Promise.all([getWorkshopAvailability(), getWorkshopAvailability()]);
    assert.deepEqual(first, second);
    assert.deepEqual(await getWorkshopAvailability(), first);
    assert.equal(requests, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('availability store clears failed requests and permits retry', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return requests === 1 ? new Response('{}', { status: 503 }) : new Response(JSON.stringify({ ok: true, data: [] }));
  };
  try {
    await assert.rejects(getWorkshopAvailability(), /availability request failed/);
    assert.deepEqual(await getWorkshopAvailability(), []);
    assert.equal(requests, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('a fresh module runtime starts with an empty in-memory cache', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ ok: true, data: [] }));
  };
  try {
    await getWorkshopAvailability();
    const freshRuntime = await import(`./workshopAvailability.js?fresh=${Date.now()}`);
    await freshRuntime.getWorkshopAvailability();
    assert.equal(requests, 2);
  } finally { globalThis.fetch = originalFetch; }
});
