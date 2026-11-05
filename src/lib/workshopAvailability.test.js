import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkshopAvailability } from './workshopAvailability.js';

test('availability retries failures and shares successful data across consumers', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return requests === 1
      ? new Response('{}', { status: 503 })
      : new Response(JSON.stringify({ ok: true, data: { workshops: [{ id: 'test', session_count: 1, registered_count: 2, waitlist_count: 0, capacity: 5, sessions: [{ id: 's1', registered_count: 2, capacity: 5, waitlist_count: 0, available_count: 3 }] }] } }));
  };
  try {
    await assert.rejects(getWorkshopAvailability(), /availability request failed/);
    const [first, second] = await Promise.all([getWorkshopAvailability(), getWorkshopAvailability()]);
    assert.deepEqual(first, second);
    assert.deepEqual(await getWorkshopAvailability(), first);
    assert.equal(requests, 2);
  } finally { globalThis.fetch = originalFetch; }
});
