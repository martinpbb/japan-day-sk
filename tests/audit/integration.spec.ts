import { test, expect } from '../helpers/fixtures';
import { localeCodes, read, routePath } from './content';

for (const locale of localeCodes) test(`@audit @integration ${locale} archived workshops do not depend on the live API`, async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://api.japanday.sk/**', route => {
    requests.push(route.request().url());
    return route.fulfill({ status: 503, json: { ok: false } });
  });
  await page.goto(routePath(locale, '/workshopy/japoncina'), { waitUntil: 'domcontentloaded' });
  const local = read(locale, 'workshops').items.find((workshop: any) => workshop.id === 'japoncina');
  await expect(page.locator('.workshopSessions')).toContainText(read(locale, 'site').archive.registrationsClosed);
  for (const session of local.sessions) await expect(page.locator(`time[datetime="${session.start}"]`)).toBeVisible();
  await expect(page.locator('.registrationForm, .registrationFields, .workshopOccupancy')).toHaveCount(0);
  expect(requests).toEqual([]);
});
