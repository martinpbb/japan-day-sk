import { test, expect } from '../helpers/fixtures';
import { read, localeCodes } from './content';
import AxeBuilder from '@axe-core/playwright';

for (const locale of localeCodes) {
  const prefix = locale === 'sk' ? '' : `/${locale}`;
  test(`@audit @localization ${locale} published homepage and programme`, async ({ page }) => {
    await page.goto(`${prefix}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const site = read(locale, 'site');
    await expect(page.locator('.heroActions a').first()).toHaveText(site.postEvent.hero.cta);
    await expect.soft(page.locator('.heroActions a').first()).not.toHaveText(/pripravujeme|coming soon|demnächst|Vorbereitung|próximamente|preparación|近日|準備中/i);
    await expect.soft(page.locator('main')).not.toContainText(/3\. ročník|3rd edition|3[.] Ausgabe|3[.]ª edición|po tretí raz|third (?:edition|time)|dritte|tercera|第3|第３/i);
    await expect(page.locator('.feedbackForm')).toBeVisible();
    await expect(page.locator('.postArchiveGrid a')).toHaveCount(10);
    await page.goto(`${prefix}/program/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator('.programInfoNote')).toHaveText(read(locale, 'program').note);
    if (locale !== 'sk') await expect(page.locator('.programVenues')).not.toContainText(/Hlavný program|Prednášky|Kapacita|osôb/);
  });

  test(`@audit @interaction ${locale} workshop cards detail drop-in and labels`, async ({ page }) => {
    await page.route('https://api.japanday.sk/**', route => {
      const path = new URL(route.request().url()).pathname;
      const slug = path.startsWith('/api/workshops/') ? path.split('/').at(-1) : null;
      if (!slug) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' });
      return route.fulfill({ json: { ok: true, data: { slug, price_cents: 0, currency: 'EUR', sessions: [
        { id: `${slug}-1100`, start_at: '2026-11-07T11:00:00+01:00', end_at: '2026-11-07T11:30:00+01:00', capacity: 15, remaining_capacity: 15, registration_open: true, location: null },
        { id: `${slug}-1300`, start_at: '2026-11-07T13:00:00+01:00', end_at: '2026-11-07T13:30:00+01:00', capacity: 15, remaining_capacity: 15, registration_open: true, location: null },
      ] } } });
    });
    await page.goto(`${prefix}/workshopy/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator('.workshopCard')).toHaveCount(8);
    const copy = read(locale, 'site').ui.workshops;
    for (const card of await page.locator('.workshopCard').all()) {
      await expect(card.locator('h3')).not.toBeEmpty();
      await expect(card).toContainText(copy.duration); await expect(card).toContainText(copy.price);
    }
    await page.locator(`.workshopCard[href$='/workshopy/tvorba-kombiku']`).click();
    await expect(page.locator('.workshopSessions')).toContainText('11:30–15:00');
    await expect(page.locator('.workshopSession')).toHaveCount(0);
    await expect(page.locator('.workshopSessions')).toContainText(read(locale, 'workshops').items.find((w: any) => w.id === 'tvorba-kombiku').availabilityNote);
    await expect(page.locator('.workshopDetailFacts')).toContainText('2');
    await page.goto(`${prefix}/workshopy/ayatori/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator('.workshopSession')).toHaveCount(read(locale, 'workshops').items.find((w: any) => w.id === 'ayatori').sessions.length);
    await expect(page.locator('.workshopSession input, .registrationForm')).toHaveCount(0);
    await expect(page.locator('.workshopSessions')).toContainText(read(locale, 'site').archive.registrationsClosed);
    if (locale === 'ja') {
      await expect(page.locator('.workshopDetail')).not.toContainText(/Lektor|Trvanie|Cena|Termín|Zadarmo|Registrácia|Kapacita|miest/);
      await expect(page.locator('.workshopDetailFacts')).toContainText('30分');
    }
  });

  test(`@audit @interaction ${locale} Hisayo promo including missing-poster fallback`, async ({ page }) => {
    await page.goto(`${prefix}/ucinkujuci/hisayo-yasuda/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const promo = page.locator('.performerPromotion');
    await expect(promo).toBeVisible();
    await expect(promo.locator('h2')).toHaveText(read(locale, 'performers').performerPromotion.title);
    await expect(promo.locator('dl > div')).toHaveCount(7);
    const link = promo.locator('a');
    await expect(link).toHaveAttribute('href', 'https://www.j-pad.eu/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    expect(await promo.evaluate(el => !!el.previousElementSibling?.querySelector('.performerSchedule'))).toBeTruthy();
    await page.route('**/images/performers/hisayo_yasuda.jpg', route => route.fulfill({ status: 404, body: '' }));
    await page.reload();
    await expect(page.locator('.performerPromotion')).toHaveClass(/performerPromotionNoPoster/);
    await expect(page.locator('.performerPromotion h2')).toBeVisible();
    await expect(page.locator('.performerPromotion img')).toHaveCount(0);
  });
}

for (const locale of ['sk', 'ja'] as const) for (const route of ['/workshopy/', '/workshopy/ayatori/', '/ucinkujuci/hisayo-yasuda/', '/vystavovatelia/']) test(`@audit @a11y ${locale} ${route}`, async ({ page }, info) => {
  await page.goto(`${locale === 'sk' ? '' : '/ja'}${route}`, { waitUntil: 'commit', timeout: 30_000 });
  await expect(page.locator('main h1')).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  await info.attach('axe', { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
  expect(result.violations.filter(v => ['critical','serious'].includes(v.impact || ''))).toEqual([]);
});

test('@audit @interaction keyboard language and mobile navigation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.locator('.languageSwitcherTrigger').focus(); await page.keyboard.press('Enter');
  const english = page.getByRole('option').filter({ hasText: 'English' });
  await english.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.setViewportSize({ width:390, height:844 });
  await page.locator('.menuButton').click();
  await expect(page.locator('nav.nav')).toHaveClass(/open/);
  await page.locator('nav.nav a[href="/en/archiv/2026/"]').click();
  await expect(page).toHaveURL(/\/en\/archiv\/2026\/?$/);
  await expect(page.locator('main h1')).toBeVisible();
});



