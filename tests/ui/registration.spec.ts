import { test, expect } from '@playwright/test';
import { registrationLimits, validateRegistration } from '../../src/lib/registration.js';
import { localeCodes } from '../helpers/locales';
import { read } from '../audit/content';
import { test as browserTest, expect as browserExpect } from '../helpers/fixtures';
import { prefixFor } from '../helpers/locales';

const mockWorkshop = (slug: string, options: { open?: boolean; remaining?: number } = {}) => ({
  ok: true,
  data: {
    slug, price_cents: 0, currency: 'EUR',
    sessions: [{ id: `${slug}-1100`, start_at: '2026-11-07T11:00:00+01:00', end_at: '2026-11-07T11:30:00+01:00', capacity: 15, remaining_capacity: options.remaining ?? 15, registration_open: options.open ?? true, location: null }],
  },
});

test('all supported locales open only fixed-session registration', () => {
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

browserTest('localized detail registration displays fields, validates, posts, and confirms success', async ({ page }) => {
  const payloads: any[] = [];
  await page.route('https://api.japanday.sk/api/workshops/**', route => route.fulfill({ json: mockWorkshop('ayatori') }));
  await page.route('https://api.japanday.sk/api/sessions/**/register', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: { ok: true, data: { registration_id: 'local-test', status: 'registered', payment: null } } });
  });
  for (const [locale, labels, submit] of [
    ['sk', ['Meno', 'Priezvisko', 'E-mail', 'Telefón'], 'Registrovať sa'],
    ['en', ['First name', 'Last name', 'Email', 'Phone'], 'Register'],
    ['ja', ['名', '姓', 'メールアドレス', '電話番号'], '予約する'],
  ] as const) {
    await page.goto(prefixFor(locale, '/workshopy/ayatori'), { waitUntil: "domcontentloaded" });
    const form = page.locator('.registrationForm');
    await browserExpect(form.getByRole('heading')).toBeVisible();
    for (const label of labels) await browserExpect(form.getByLabel(new RegExp(label))).toBeVisible();
    await form.getByRole('button', { name: submit }).click();
    await browserExpect(form.locator('.registrationError').first()).toContainText(locale === 'sk' ? 'povinné pole' : locale === 'en' ? 'required field' : '必須項目');
    await form.getByLabel(new RegExp(labels[0])).fill('Mika');
    await form.getByLabel(new RegExp(labels[1])).fill('Tanaka');
    await form.getByLabel(new RegExp(labels[2])).fill('mika@example.com');
    await form.getByLabel(new RegExp(labels[3])).fill('+81 90 1234 5678');
    await form.getByRole('button', { name: submit }).click();
    await browserExpect(form.getByRole('status')).toContainText(locale === 'sk' ? 'úspešne' : locale === 'en' ? 'successfully' : '完了');
  }
  browserExpect(payloads).toHaveLength(3);
  browserExpect(payloads[0]).toMatchObject({ first_name: 'Mika', last_name: 'Tanaka', email: 'mika@example.com', phone: '+81 90 1234 5678' });
});

browserTest('localized workshop overview shows compact aggregate availability and keeps drop-in workshops registration-free', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/workshops/**', route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1)!;
    if (slug === 'availability') return route.fulfill({ json: { ok: true, data: { workshops: [
      {
        id: 'ayatori', title: 'Ayatori', session_count: 1, registered_count: 11, waitlist_count: 0, capacity: 15, available_count: 4,
        sessions: [{ id: 'ayatori-1220', start_at: '2026-11-07T12:20:00+01:00', end_at: '2026-11-07T12:35:00+01:00', capacity: 15, registered_count: 11, waitlist_count: 0, available_count: 4 }],
      },
      { id: 'japoncina', session_count: undefined, registered_count: null, capacity: Number.NaN },
    ] } } });
    const data = mockWorkshop(slug, { open: slug !== 'ayatori', remaining: slug === 'ayatori' ? 0 : 15 });
    if (slug === 'ayatori') data.data.sessions[0].id = 'ayatori-1220';
    return route.fulfill({ json: data });
  });
  for (const locale of localeCodes) {
    const copy = read(locale, 'site').ui.workshops;
    await page.goto(prefixFor(locale, '/workshopy'), { waitUntil: 'domcontentloaded' });
    const ayatori = page.locator('a.workshopCard[href$="/workshopy/ayatori"]');
    await browserExpect(ayatori).toContainText(copy.aggregateSummary.replace('{count}', '1').replace('{registered}', '11').replace('{capacity}', '15'));
    await browserExpect(ayatori.locator('.workshopOccupancy')).not.toContainText(/undefined|null|NaN/);
    await browserExpect(ayatori.locator('.workshopOccupancy')).not.toContainText(copy.availableCount.replace('{count}', '4'));
    await browserExpect(ayatori.locator('.workshopOccupancy')).not.toContainText(copy.lastPlaces.replace('{count}', '4'));
    await browserExpect(ayatori.locator('.workshopOverviewSessions dt')).toHaveText(`${copy.sessions}:`);
    await browserExpect(ayatori.locator('.workshopFacts dt').first()).toContainText(':');
    await browserExpect(ayatori).not.toContainText('12:20');
    const incomplete = page.locator('a.workshopCard[href$="/workshopy/japoncina"] .workshopOccupancy');
    await browserExpect(incomplete).toContainText(copy.sessionPending);
    await browserExpect(incomplete).not.toContainText(/undefined|null|NaN/);
    const dropIn = page.locator('a.workshopCard[href$="/workshopy/tvorba-kombiku"]');
    await browserExpect(dropIn).not.toContainText(/Registro|Register|Anmelden|Inscribirse/);
    await browserExpect(dropIn.locator('.workshopOccupancy')).toHaveCount(0);
    await page.goto(prefixFor(locale, '/workshopy/tvorba-kombiku'), { waitUntil: 'domcontentloaded' });
    await browserExpect(page.locator('.registrationForm')).toHaveCount(0);
    await browserExpect(page.locator('.workshopRegistrationState')).toHaveCount(0);
    await browserExpect(page.locator('.workshopSessions')).toContainText(read(locale, 'workshops').items.find((item: any) => item.id === 'tvorba-kombiku').availabilityWindow);
  }
});

browserTest('full workshop sessions show localized full labels and disable registration', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/workshops/**', route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1)!;
    if (slug === 'availability') return route.fulfill({ json: { ok: true, data: { workshops: [{
      id: 'ayatori', title: 'Ayatori', session_count: 1, registered_count: 15, waitlist_count: 0, capacity: 15, available_count: 0,
      sessions: [{ id: 'ayatori-1100', start_at: '2026-11-07T11:00:00+01:00', end_at: '2026-11-07T11:30:00+01:00', capacity: 15, registered_count: 15, waitlist_count: 0, available_count: 0 }],
    }] } } });
    return route.fulfill({ json: mockWorkshop(slug, { open: false, remaining: 0 }) });
  });
  for (const locale of localeCodes) {
    const fullLabel = read(locale, 'site').ui.workshops.full;
    await page.goto(prefixFor(locale, '/workshopy'), { waitUntil: 'domcontentloaded' });
    await browserExpect(page.locator('a.workshopCard[href$="/workshopy/ayatori"] .workshopOccupancy')).toContainText(
      read(locale, 'site').ui.workshops.aggregateSummary.replace('{count}', '1').replace('{registered}', '15').replace('{capacity}', '15'),
    );
    await page.goto(prefixFor(locale, '/workshopy/ayatori'), { waitUntil: 'domcontentloaded' });
    await browserExpect(page.locator('.workshopSession').filter({ hasText: fullLabel }).first()).toBeVisible();
    await browserExpect(page.locator('.registrationForm button[type="submit"]')).toBeDisabled();
  }
});

browserTest('workshop occupancy uses one shared D1 request across overview and detail navigation', async ({ page }) => {
  let requests = 0;
  await page.route('https://api.japanday.sk/api/workshops/**', route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1)!;
    if (slug === 'availability') {
      requests++;
      return route.fulfill({ json: { ok: true, data: { workshops: [
        { id: 'japoncina', title: 'Japončina', session_count: 3, registered_count: 5, waitlist_count: 1, capacity: 45, available_count: 40, sessions: [
          { id: 'japoncina-1100', start_at: '2026-11-07T11:30:00+01:00', end_at: '2026-11-07T12:00:00+01:00', capacity: 15, registered_count: 15, waitlist_count: 1, available_count: 0 },
        ] },
        { id: 'origami', title: 'Origami', session_count: 5, registered_count: 16, waitlist_count: 0, capacity: 75, available_count: 59, sessions: [
          { id: 'origami-1100', start_at: '2026-11-07T11:30:00+01:00', end_at: '2026-11-07T12:00:00+01:00', capacity: 15, registered_count: 5, waitlist_count: 0, available_count: 10 },
          { id: 'origami-1145', start_at: '2026-11-07T12:15:00+01:00', end_at: '2026-11-07T12:45:00+01:00', capacity: 15, registered_count: 15, waitlist_count: 2, available_count: 0 },
        ] },
      ] } } });
    }
    const data = mockWorkshop(slug, { remaining: 0 });
    if (slug === 'origami') {
      data.data.sessions.push({ id: 'origami-1145', start_at: '2026-11-07T12:15:00+01:00', end_at: '2026-11-07T12:45:00+01:00', capacity: 15, remaining_capacity: 0, registration_open: true, location: null });
    }
    return route.fulfill({ json: data });
  });
  await page.goto('/workshopy/', { waitUntil: 'domcontentloaded' });
  await browserExpect(page.locator('.workshopCard[href$="/workshopy/origami"]')).toContainText('16 / 75 registrovaných');
  await browserExpect.poll(() => requests).toBe(1);
  const origamiCard = page.locator('.workshopCard[href$="/workshopy/origami"]');
  await browserExpect(origamiCard).not.toContainText(/undefined|null|NaN|voľných miest/);
  await page.locator('.workshopCard[href$="/workshopy/origami"]').click();
  const availableSession = page.locator('.workshopSession').filter({ hasText: '11:30' });
  await browserExpect(availableSession).toContainText('11:30 – 12:00');
  await browserExpect(availableSession).toContainText('5 / 15 registrovaných');
  await browserExpect(availableSession).toContainText('10 voľných miest');
  const fullSession = page.locator('.workshopSession').filter({ hasText: '12:15' });
  await browserExpect(fullSession).toContainText('15 / 15 registrovaných');
  await browserExpect(fullSession).toContainText('Obsadené');
  await browserExpect(fullSession).toContainText('2 čakateľov');
  await browserExpect.poll(() => requests).toBe(1);
  await page.locator('.backLink').click();
  await browserExpect(page.locator('.workshopCard[href$="/workshopy/origami"]')).toContainText('16 / 75 registrovaných');
  await browserExpect.poll(() => requests).toBe(1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await browserExpect.poll(() => requests).toBe(2);
});

browserTest('availability failure leaves descriptive workshop details without static occupancy claims', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/workshops/availability', route => route.fulfill({ status: 503, json: { ok: false } }));
  await page.route('https://api.japanday.sk/api/workshops/**', route => route.fulfill({ status: 503, json: { ok: false } }));
  await page.goto('/workshopy/', { waitUntil: 'domcontentloaded' });
  const origamiCard = page.locator('.workshopCard[href$="/workshopy/origami"]');
  await browserExpect(origamiCard).toContainText('Aktuálna obsadenosť nie je dostupná.');
  await origamiCard.click();
  await browserExpect(page.locator('.workshopDescription')).toContainText('Origami');
  await browserExpect(page.locator('.workshopSession').first()).toContainText('Aktuálna obsadenosť nie je dostupná.');
  await browserExpect(page.locator('.workshopFacts')).not.toContainText('Kapacita: 15');
});
