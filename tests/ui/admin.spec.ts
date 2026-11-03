import { test, expect } from '../helpers/fixtures';

const adminRoutes = ['/admin/', '/admin/workshops/', '/admin/workshops/w1/', '/admin/sessions/s1/'];

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
    await expect(page.getByRole('alert')).toContainText('You need to sign in to access workshop data.');
    await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', 'https://api.japanday.sk/api/admin/summary');
    expect(await page.locator('body').innerText()).not.toContain('attendee@example.com');
  }

  const requests = (await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('admin-fetches') || '[]')))
    .filter(request => request.url.startsWith('https://api.japanday.sk/api/admin/'));
  expect(requests).toHaveLength(adminRoutes.length);
  expect(requests.map(request => request.credentials)).toEqual(Array(adminRoutes.length).fill('include'));
  expect(requests.map(request => new URL(request.url).pathname)).toEqual([
    '/api/admin/summary',
    '/api/admin/workshops',
    '/api/admin/workshops/w1',
    '/api/admin/sessions/s1/registrations',
  ]);
});

test('@ui admin distinguishes authorization denial and API/Access fetch failure', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', route => route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, error: { code: 'FORBIDDEN' } }),
  }));
  await page.goto('/admin/');
  await expect(page.getByRole('alert')).toContainText('Your account is not authorized');
  await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);

  await page.unrouteAll();
  await page.route('https://api.japanday.sk/api/admin/**', route => route.abort('failed'));
  await page.goto('/admin/');
  await expect(page.getByRole('alert')).toContainText('Could not reach the admin API');
  await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', 'https://api.japanday.sk/api/admin/summary');
});

test('@ui admin workshop and session details render protected data', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', async route => {
    const url = new URL(route.request().url());
    const data = url.pathname.endsWith('/registrations')
      ? { session: { id: 'japoncina-1100', start_at: '2026-11-07 11:00', capacity: 1, registered_count: 1, waitlist_count: 0, available: 0 }, registrations: [{ first_name: 'Test', last_name: 'Person', email: 'person@example.com', phone: '123', status: 'registered', payment_status: 'free', created_at: '2026-01-01' }] }
      : { workshop: { id: 'japoncina', title: 'Workshop One', lecturer: 'Lecturer', location: 'Hall', short_description: 'Description' }, sessions: [{ id: 'japoncina-1100', start_at: '2026-11-07 11:00', capacity: 1, registered_count: 1, waitlist_count: 0, available: 0 }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data }) });
  });
  await page.goto('/admin/workshops/japoncina/');
  await expect(page.getByRole('heading', { name: 'Workshop One' })).toBeVisible();
  await expect(page.getByRole('link', { name: /2026-11-07/ })).toHaveAttribute('href', '/admin/sessions/japoncina-1100/');
  await page.goto('/admin/sessions/japoncina-1100/');
  await expect(page.getByRole('cell', { name: 'person@example.com' })).toBeVisible();
  await expect(page.getByText('Registered: 1 / 1')).toBeVisible();
});
