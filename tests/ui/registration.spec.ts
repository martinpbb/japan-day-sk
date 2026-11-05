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

browserTest('localized list, open state, full state and drop-in exception use live availability', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/workshops/**', route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const data = mockWorkshop(slug, { open: slug !== 'ayatori', remaining: slug === 'ayatori' ? 0 : 15 });
    return route.fulfill({ json: data });
  });
  for (const [locale, openText] of [['sk', 'Registrácia otvorená'], ['en', 'Registration is open'], ['de', 'Anmeldung geöffnet'], ['es', 'Inscripción abierta'], ['ja', '予約受付中']] as const) {
    await page.goto(prefixFor(locale, '/workshopy'), { waitUntil: "domcontentloaded" });
    const list = page.locator('.workshopCard');
    await browserExpect(list.filter({ has: page.getByText(openText) }).first()).toBeVisible();
    await browserExpect(page.locator('a.workshopCard[href$="/workshopy/tvorba-kombiku"]')).not.toContainText(/Registro|Register|Anmelden|Inscribirse|予約する/);
  }
  await page.goto('/workshopy/ayatori/', { waitUntil: "domcontentloaded" });
  await browserExpect(page.locator('.registrationForm button[type="submit"]')).toBeDisabled();
  await browserExpect(page.locator('.workshopSession')).toContainText('Obsadené');
});

browserTest('workshop occupancy uses one public request, shows full sessions, and degrades gracefully', async ({ page }) => {
  let requests = 0;
  await page.route('https://api.japanday.sk/api/workshops/availability', async route => {
    requests++;
    await route.fulfill({ json: { ok: true, data: [
      { sessionId: 'japoncina-1100', registered: 15, capacity: 15, available: 0 },
      { sessionId: 'origami-1100', registered: 5, capacity: 15, available: 10 },
      { sessionId: 'ayatori-1220', registered: 15, capacity: 15, available: 0 },
    ] } });
  });
  await page.route('https://api.japanday.sk/api/workshops/**', route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1)!;
    return route.fulfill({ json: mockWorkshop(slug, { remaining: 0 }) });
  });
  await page.goto('/workshopy/', { waitUntil: 'domcontentloaded' });
  await browserExpect(page.locator('.workshopCard[href$="/workshopy/origami"]')).toContainText('5 / 15 obsadenÃ½ch');
  await browserExpect(page.locator('.workshopCard[href$="/workshopy/japoncina"]')).toContainText('ObsadenÃ©');
  await browserExpect.poll(() => requests).toBe(1);
  await page.goto('/workshopy/ayatori/', { waitUntil: 'domcontentloaded' });
  await browserExpect(page.locator('.workshopSession')).toContainText('15 / 15 obsadených');
  await browserExpect.poll(() => requests).toBe(1);

  await page.unroute('https://api.japanday.sk/api/workshops/availability');
  await page.route('https://api.japanday.sk/api/workshops/availability', route => route.abort());
  await page.goto('/workshopy/', { waitUntil: 'domcontentloaded' });
  await browserExpect(page.locator('.workshopCard[href$="/workshopy/origami"]')).toContainText('11:00');
});
