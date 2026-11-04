import { test, expect } from '../helpers/fixtures';
import { readFileSync } from 'node:fs';

const workshopData = JSON.parse(readFileSync(new URL('../../src/data/locales/sk/workshops.json', import.meta.url), 'utf8'));
const adminWorkshop = workshopData.items.find((workshop: any) => workshop.sessions?.length);
const adminRoutes = ['/admin/', '/admin/workshops/', `/admin/workshops/${adminWorkshop.slug || adminWorkshop.id}/`, `/admin/sessions/${adminWorkshop.sessions[0].id}/`];

test('@ui admin routes are public shells and offer Access sign-in when unauthenticated', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    const storageKey = 'admin-fetches';
    window.__adminFetches = JSON.parse(window.sessionStorage.getItem(storageKey) || '[]');
    window.fetch = (input, init) => {
      window.__adminFetches.push({ url: String(input), credentials: init?.credentials });
      window.sessionStorage.setItem(storageKey, JSON.stringify(window.__adminFetches));
      return nativeFetch(input, init);
    };
  });
  await page.route('https://api.japanday.sk/api/admin/**', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, error: { code: 'UNAUTHENTICATED' } }),
  }));

  for (const path of adminRoutes) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Workshop dashboard' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Na prístup k údajom workshopov sa prihláste.');
    await expect(page.getByRole('link', { name: 'Prihlásiť sa' })).toHaveAttribute('href', 'https://api.japanday.sk/api/admin/summary');
    expect(await page.locator('body').innerText()).not.toContain('attendee@example.com');
  }

  const requests = (await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('admin-fetches') || '[]')))
    .filter(request => request.url.startsWith('https://api.japanday.sk/api/admin/'));
  expect(requests).toHaveLength(adminRoutes.length);
  expect(requests.map(request => request.credentials)).toEqual(Array(adminRoutes.length).fill('include'));
  expect(requests.map(request => new URL(request.url).pathname)).toEqual([
    '/api/admin/summary',
    '/api/admin/workshops',
    `/api/admin/workshops/${adminWorkshop.slug || adminWorkshop.id}`,
    `/api/admin/sessions/${adminWorkshop.sessions[0].id}/registrations`,
  ]);
});

test('@ui admin distinguishes authorization denial and API/Access fetch failure', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', route => route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, error: { code: 'FORBIDDEN' } }),
  }));
  await page.goto('/admin/');
  await expect(page.getByRole('alert')).toContainText('Váš účet nemá oprávnenie');
  await expect(page.getByRole('link', { name: 'Prihlásiť sa' })).toHaveCount(0);

  await page.unrouteAll();
  await page.route('https://api.japanday.sk/api/admin/**', route => route.abort('failed'));
  await page.goto('/admin/');
  await expect(page.getByRole('alert')).toContainText('Administračné rozhranie sa nepodarilo načítať');
  await expect(page.getByRole('link', { name: 'Prihlásiť sa' })).toHaveAttribute('href', 'https://api.japanday.sk/api/admin/summary');
});

test('@ui admin workshop and session details render protected data', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', async route => {
    const url = new URL(route.request().url());
    const data = url.pathname.endsWith('/registrations')
      ? { session: { id: 'japoncina-1100', workshop_id: 'japoncina', start_at: '2026-11-07 11:30', end_at: '2026-11-07 12:00', capacity: 15, registered_count: 4, waitlist_count: 0, available: 11 }, registrations: [{ first_name: 'Test', last_name: 'Person', email: 'person@example.com', phone: '+421 900 000 000', status: 'registered', payment_status: 'free', created_at: '2026-11-03 08:56:38' }] }
      : { workshop: { id: 'japoncina', title: 'Shodō – japonská kaligrafia', lecturer: 'Lecturer', location: 'Hall', short_description: 'Description' }, sessions: [{ id: 'japoncina-1100', start_at: '2026-11-07 11:30', end_at: '2026-11-07 12:00', capacity: 15, registered_count: 4, waitlist_count: 0, available: 11 }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data }) });
  });
  await page.goto('/admin/workshops/japoncina/');
  await expect(page.getByRole('heading', { name: 'Shodō – japonská kaligrafia' })).toBeVisible();
  await expect(page.getByRole('link', { name: '← Späť na workshopy' })).toHaveAttribute('href', '/admin/workshops/');
  await expect(page.getByRole('link', { name: /7\. 11\. 2026/ })).toHaveAttribute('href', '/admin/sessions/japoncina-1100/');
  await expect(page.getByText('11 voľných miest')).toBeVisible();
  await page.goto('/admin/sessions/japoncina-1100/');
  await expect(page.getByRole('heading', { name: /Shodō – japonská kaligrafia.*7\. 11\. 2026/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '← Späť na Shodō – japonská kaligrafia' })).toHaveAttribute('href', '/admin/workshops/japoncina/');
  await expect(page.getByText('11:30–12:00')).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/2026-11-07T/);
  await expect(page.getByText('4 / 15 registrovaných')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Meno' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Priezvisko' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'E-mail' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Telefón' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Stav' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Platba' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Registrovaný' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Registrovaný' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bezplatné' })).toBeVisible();
  await expect(page.getByText('3. 11. 2026, 08:56')).toBeVisible();
  await expect(page.getByRole('link', { name: 'person@example.com' })).toHaveAttribute('href', 'mailto:person@example.com');
  await expect(page.getByRole('link', { name: '+421 900 000 000' })).toHaveAttribute('href', 'tel:+421 900 000 000');
  await expect(page.getByRole('link', { name: 'Stiahnuť CSV' })).toHaveAttribute('href', 'https://api.japanday.sk/api/admin/sessions/japoncina-1100/export.csv');
});
