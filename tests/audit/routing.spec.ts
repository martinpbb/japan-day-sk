import { test, expect } from '../helpers/fixtures';
import { assertImages } from '../helpers/assertions';
import { localeCodes, read, publicRoutes, routePath } from './content';
import { archivePath, buildArchiveRoutes, legacyArchiveTarget } from '../../src/lib/archiveRoutes.js';

for (const locale of localeCodes) {
  for (const route of publicRoutes(locale)) test(`@audit @routing ${locale} ${route} direct and refresh`, async ({ page, runtime }, info) => {
    test.setTimeout(60_000);
    const url = routePath(locale, route);
    const response = await page.goto(url, { waitUntil: 'commit', timeout: 60_000 });
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    expect(await page.locator('main').innerText()).not.toMatch(/404|Page not found|Stránka sa nenašla/);
    await assertImages(page);
    expect((await page.reload({ waitUntil: 'commit', timeout: 60_000 }))?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toBeVisible();
    await info.attach('runtime', { body: JSON.stringify(runtime, null, 2), contentType: 'application/json' });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.firstPartyFailures).toEqual([]);
    // Third-party failures and associated console messages remain attached for classification.
    expect(runtime.consoleErrors.filter(m => !/Failed to load resource|net::|CORS|Access-Control|fetch/i.test(m))).toEqual([]);
  });

  test(`@audit @links ${locale} crawl rendered links on every public route`, async ({ page, request }, info) => {
    test.setTimeout(180_000);
    const content = Object.fromEntries(['seo', 'performers', 'workshops', 'exhibitors'].map(name => [name, read(locale, name)]));
    const archive = buildArchiveRoutes(content);
    const internal = new Set<string>(); const external = new Set<string>(); const anchors: string[] = [];
    for (const route of publicRoutes(locale)) {
      await page.goto(routePath(locale, route), { waitUntil: 'domcontentloaded' });
      for (const href of await page.locator('a[href]').evaluateAll(links => links.map(a => (a as HTMLAnchorElement).href))) {
        const url = new URL(href);
        if (url.origin === new URL(page.url()).origin) {
          internal.add(url.pathname);
          if (url.hash) {
            const target = await page.evaluate(hash => { try { return !!document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return false; } }, url.hash);
            if (url.pathname.replace(/\/$/, '') === new URL(page.url()).pathname.replace(/\/$/, '') && !target) anchors.push(href);
          }
        } else { expect(['https:', 'http:', 'mailto:', 'tel:']).toContain(url.protocol); external.add(href); }
      }
    }
    const bad: string[] = [];
    for (const pathname of internal) {
      const canonicalPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
      const response = await request.get(canonicalPath, { timeout: 30_000 });
      if (response.status() !== 200) bad.push(`${response.status()} ${pathname}`);
      const normalized = canonicalPath.replace(new RegExp(`^/${locale}(?=/|$)`), '').replace(/\/$/, '') || '/';
      if (!publicRoutes(locale).includes(normalized) && !legacyArchiveTarget(normalized, archive)) bad.push(`No generated public route or archive redirect: ${pathname}`);
    }
    await info.attach('links', { body: JSON.stringify({ internal: [...internal], external: [...external], anchors, bad }, null, 2), contentType: 'application/json' });
    expect(bad).toEqual([]); expect(anchors).toEqual([]);
  });
}

for (const route of ['/', '/program', '/ucinkujuci/hisayo-yasuda', '/workshopy', '/workshopy/japoncina', '/vystavovatelia']) test(`@audit @interaction switch every locale on ${route}`, async ({ page }) => {
  await page.goto(routePath('sk', route), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  for (const locale of ['en', 'de', 'es', 'ja', 'sk'] as const) {
    await page.locator('.languageSwitcherTrigger').click();
    await page.getByRole('option').filter({ hasText: { en: 'English', de: 'Deutsch', es: 'Español', ja: '日本語', sk: 'Slovenčina' }[locale] }).click();
    expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(routePath(locale, archivePath(route)).replace(/\/$/, ''));
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.languageSwitcherTrigger strong')).toHaveText(locale.toUpperCase());
    await expect(page.locator('main h1')).toBeVisible();
  }
});
