import { test, expect } from '@playwright/test';
import { registrationLimits, validateRegistration } from '../../src/lib/registration.js';
import { localeCodes } from '../helpers/locales';
import { read } from '../audit/content';
import { test as browserTest, expect as browserExpect } from '../helpers/fixtures';
import { prefixFor } from '../helpers/locales';

test('historical registration settings remain intact in every locale', () => {
  for (const locale of localeCodes) {
    const workshops = read(locale, 'workshops').items;
    for (const id of ['japoncina', 'origami', 'shodo', 'tsumami-zaiku', 'ayatori', 'kumihimo', 'cajova-degustacia']) {
      expect(workshops.find((workshop: any) => workshop.id === id)).toMatchObject({ registrationRequired: true, registrationOpen: true });
    }
    expect(workshops.find((workshop: any) => workshop.id === 'tvorba-kombiku')).toMatchObject({ registrationRequired: false, registrationOpen: false });
  }
});

test('all registration form translations are complete and non-Slovak locales contain no Slovak labels or messages', () => {
  const expected = {
    sk: ['Meno', 'Priezvisko', 'E-mail', 'Telefón'], en: ['First name', 'Last name', 'Email', 'Phone'],
    de: ['Vorname', 'Nachname', 'E-Mail', 'Telefon'], es: ['Nombre', 'Apellidos', 'Correo electrónico', 'Teléfono'],
    ja: ['名', '姓', 'メールアドレス', '電話番号'],
  };
  for (const locale of localeCodes) {
    const site = read(locale, 'site');
    expect(Object.values(site.ui.registration.fields)).toEqual(expected[locale as keyof typeof expected]);
    const messages = [site.ui.registration.submit, ...Object.values(site.ui.registration).filter((value: any) => typeof value === 'string')];
    if (locale !== 'sk') expect(messages.join(' ')).not.toMatch(/Meno|Priezvisko|Telefón|Registrácia|Vyplňte toto povinné pole/);
  }
});

test('registration validates required fields after trimming', () => {
  expect(validateRegistration({ firstName: ' ', lastName: '\t', email: '', phone: '\n' }).errors)
    .toEqual({ firstName: 'required', lastName: 'required', email: 'required', phone: 'required' });
});

test('registration accepts international contact details and trims every field', () => {
  for (const phone of ['+421 905 123 456', '+420 777 123 456', '+44 (0)20 7946 0958']) {
    const result = validateRegistration({ firstName: ' Anna ', lastName: ' Nováková ', email: ' anna@example.com ', phone: ` ${phone} ` });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ firstName: 'Anna', lastName: 'Nováková', email: 'anna@example.com', phone });
  }
});

test('registration rejects malformed email and excessive lengths', () => {
  const valid = { firstName: 'Anna', lastName: 'Nováková', email: 'anna@example.com', phone: '+420 777 123 456' };
  for (const email of ['anna', 'anna@', 'anna@example', 'anna @example.com']) {
    expect(validateRegistration({ ...valid, email }).errors.email).toBe('emailInvalid');
  }
  for (const [field, max] of Object.entries(registrationLimits)) {
    expect(validateRegistration({ ...valid, [field]: 'a'.repeat(max + 1) }).errors[field]).toBe('tooLong');
  }
});

// Historical pages must stay closed even if a backend would still advertise
// open registration, available seats, a full session or a waiting list.
for (const state of ['open', 'full', 'unavailable'] as const) {
  browserTest(`archived registration remains closed when API state would be ${state}`, async ({ page }) => {
    const calls: string[] = [];
    await page.route('https://api.japanday.sk/**', route => {
      calls.push(route.request().url());
      return state === 'unavailable'
        ? route.fulfill({ status: 503, json: { ok: false } })
        : route.fulfill({ json: { ok: true, data: {
          registration_open: true, waitlist_enabled: true,
          sessions: [{ id: 'ayatori-1220', start_at: '2026-11-07T12:20:00+01:00', capacity: 10, remaining_capacity: state === 'full' ? 0 : 10, registration_open: true }],
        } } });
    });
    for (const locale of localeCodes) {
      await page.goto(prefixFor(locale, '/workshopy/ayatori'), { waitUntil: 'domcontentloaded' });
      await browserExpect(page.locator('.archiveNotice')).toContainText(read(locale, 'site').archive.ended);
      await browserExpect(page.locator('.workshopSessions')).toContainText(read(locale, 'site').archive.registrationsClosed);
      await browserExpect(page.locator('.registrationForm, .registrationFields, .workshopOccupancy, main input')).toHaveCount(0);
      await browserExpect(page.locator('.archiveSession')).toHaveCount(read(locale, 'workshops').items.find((item: any) => item.id === 'ayatori').sessions.length);
    }
    browserExpect(calls).toEqual([]);
  });
}

browserTest('localized archive catalog preserves all workshops without occupancy or waiting lists', async ({ page }) => {
  for (const locale of localeCodes) {
    await page.goto(prefixFor(locale, '/workshopy'), { waitUntil: 'domcontentloaded' });
    await browserExpect(page.locator('.workshopCard')).toHaveCount(read(locale, 'workshops').items.length);
    await browserExpect(page.locator('.workshopInfoNote')).toHaveText(read(locale, 'site').archive.registrationsClosed);
    await browserExpect(page.locator('.workshopOccupancy, .workshopOverviewSessions, .registrationForm')).toHaveCount(0);
    await page.locator('.workshopCard[href$="/workshopy/tvorba-kombiku"]').click();
    const workshop = read(locale, 'workshops').items.find((item: any) => item.id === 'tvorba-kombiku');
    await browserExpect(page.locator('.workshopSessions')).toContainText(workshop.availabilityWindow);
    await browserExpect(page.locator('.workshopSessions')).toContainText(workshop.availabilityNote);
    await browserExpect(page.locator('.registrationForm, main input')).toHaveCount(0);
  }
});

browserTest('archive overview and detail navigation never requests live D1 availability', async ({ page }) => {
  const calls: string[] = [];
  await page.route('https://api.japanday.sk/**', route => { calls.push(route.request().url()); return route.fulfill({ status: 503, json: { ok: false } }); });
  await page.goto('/workshopy/', { waitUntil: 'domcontentloaded' });
  await page.locator('.workshopCard[href$="/workshopy/origami"]').click();
  await browserExpect(page.locator('.workshopDescription')).toContainText('Origami');
  await page.locator('.backLink').click();
  await browserExpect(page.locator('.workshopGrid')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await browserExpect(page.locator('.workshopGrid')).toBeVisible();
  browserExpect(calls).toEqual([]);
});
