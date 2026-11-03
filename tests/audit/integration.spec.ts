import { test, expect } from '../helpers/fixtures';
import { localeCodes, read } from './content';

for (const locale of localeCodes.filter(l => l !== 'sk')) test(`@audit @localization ${locale} registration fields translated`, async ({ page }) => {
  await page.route('https://api.japanday.sk/**', r => r.fulfill({ status:503,contentType:'application/json',body:'{"ok":false}' }));
  await page.goto(`/${locale}/workshopy/ayatori/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(page.locator('.registrationFields')).not.toContainText(/Meno|Priezvisko|Telefón/);
});

test('@audit @integration read-only live workshop response matches local schedule', async ({ page }, info) => {
  const responses: any[] = [];
  page.on('response', async response => {
    if (!response.url().startsWith('https://api.japanday.sk/api/workshops/')) return;
    try { responses.push({ url:response.url(),status:response.status(),body:await response.json() }); } catch { /* Body can be unavailable on a blocked response. */ }
  });
  await page.goto('/workshopy/japoncina/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await expect(page.locator('.workshopSessions')).toBeVisible();
  await expect.poll(() => responses.length, { timeout:8000 }).toBeGreaterThan(0).catch(() => {});
  await info.attach('live-response',{ body:JSON.stringify(responses,null,2), contentType:'application/json' });
  const data = responses[0]?.body?.data;
  if (!data) { test.skip(true,'Live API unavailable; local fallback is covered separately.'); return; }
  const local = read('sk','workshops').items.find((w: any) => w.id === 'japoncina');
  expect(data.sessions.map((s: any) => new Date(s.start_at).toISOString()).sort()).toEqual(local.sessions.map((s: any) => new Date(s.start).toISOString()).sort());
});

