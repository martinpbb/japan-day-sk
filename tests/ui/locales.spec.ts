import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { assertNoMojibake } from "../helpers/assertions";
import { read } from "../audit/content";

test.describe("@smoke @ui locale roots", () => {
  for (const locale of localeCodes) test(`${locale} root`, async ({ page, runtime }) => {
    await page.goto(prefixFor(locale), { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.getByRole("button").filter({ hasText: /SK|EN|DE|ES|JA/ }).first()).toBeVisible();
    await assertNoMojibake(page);
    expect(runtime.pageErrors).toEqual([]);
  });
});

test.describe("@smoke @ui localized Workshops routes", () => {
  for (const locale of localeCodes) test(`${locale} Workshops route and language switch`, async ({ page, runtime }) => {
    await page.goto(prefixFor(locale, "/workshopy"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".workshopCard")).toHaveCount(8);
    const expectedTitle = locale === "sk" ? "Japončina" : ({ en: "Japanese language", de: "Japanisch", es: "Idioma japonés", ja: "日本語" }[locale]);
    await expect(page.locator(".workshopCard h3").filter({ hasText: new RegExp(`^${expectedTitle}$`) })).toBeVisible();
    await page.locator(".languageSwitcherTrigger").click();
    await page.getByRole("option", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/workshopy\/?$/);
    await expect(page.locator(".workshopCard h3").filter({ hasText: /^Japanese language$/ })).toBeVisible();
    expect(runtime.pageErrors).toEqual([]);
  });
});

test.describe("@ui workshop interface localization", () => {
  for (const locale of localeCodes) test(`${locale} workshop catalog and detail use localized UI`, async ({ page }) => {
    const copy = {
      sk: { title: "Workshopy", lecturer: "Lektor", duration: "Trvanie", price: "Cena", sessions: "Termíny", free: "Zadarmo", open: "Registrácia otvorená", register: "Registrovať sa", heading: "Termíny", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo)/ },
      en: { title: "Workshops", lecturer: "Lecturer", duration: "Duration", price: "Price", sessions: "Sessions", free: "Free", open: "Registration is open", register: "Register", heading: "Sessions", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      de: { title: "Workshops", lecturer: "Kursleitung", duration: "Dauer", price: "Preis", sessions: "Termine", free: "Kostenlos", open: "Anmeldung geöffnet", register: "Anmelden", heading: "Termine", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      es: { title: "Talleres", lecturer: "Instructor", duration: "Duración", price: "Precio", sessions: "Horarios", free: "Gratis", open: "Inscripción abierta", register: "Inscribirse", heading: "Horarios", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      ja: { title: "ワークショップ", lecturer: "講師", duration: "所要時間", price: "料金", sessions: "開催回", free: "無料", open: "予約受付中", register: "予約する", heading: "開催回", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia|Kapacita|miest)/ },
    }[locale];
    await page.route('https://api.japanday.sk/api/workshops/ayatori', route => {
      const slug = new URL(route.request().url()).pathname.split('/').at(-1);
      return route.fulfill({ json: { ok: true, data: { slug, price_cents: 0, currency: 'EUR', sessions: [
        { id: `${slug}-1100`, start_at: '2026-11-07T11:00:00+01:00', end_at: '2026-11-07T11:30:00+01:00', capacity: 15, remaining_capacity: 15, registration_open: true, location: null },
      ] } } });
    });
    await page.route('https://api.japanday.sk/api/workshops/availability', route => route.fulfill({ json: { ok: true, data: { workshops: [
      { id: 'ayatori', session_count: 3, registered_count: 6, capacity: 45 },
    ] } } }));
    await page.goto(prefixFor(locale, "/workshopy"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText(copy.title);
    const ayatoriCard = page.locator('a.workshopCard[href$="/workshopy/ayatori"]');
    const ayatoriData = read(locale, 'workshops').items.find((item: any) => item.id === 'ayatori');
    await expect(ayatoriCard).toContainText(ayatoriData.category);
    await expect(ayatoriCard.locator('h3')).toHaveText(ayatoriData.title);
    await expect(ayatoriCard.locator(".workshopFacts")).toContainText(copy.lecturer);
    await expect(ayatoriCard.locator(".workshopFacts")).toContainText(copy.duration);
    await expect(ayatoriCard.locator(".workshopFacts")).toContainText(copy.price);
    await expect(ayatoriCard.locator(".workshopFacts")).toContainText(copy.free);
    await expect(ayatoriCard.locator(".workshopOverviewSessions dt")).toHaveText(`${copy.sessions}:`);
    await expect(ayatoriCard.locator(".workshopOccupancy")).toContainText(read(locale, 'site').ui.workshops.aggregateSummary.replace('{count}', '3').replace('{registered}', '6').replace('{capacity}', '45'));
    await expect(ayatoriCard).not.toContainText(copy.open);
    await expect(ayatoriCard).not.toContainText(read(locale, 'site').ui.workshops.availableCount.replace('{count}', '39'));
    await expect(page.locator('.workshopCard[href$="/workshopy/tvorba-kombiku"]')).not.toContainText(copy.register);
    if (locale !== "sk") await expect(page.locator(".workshopGrid")).not.toContainText(copy.forbidden);
    await page.goto(prefixFor(locale, "/workshopy/ayatori"), { waitUntil: "domcontentloaded" });
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.lecturer);
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.duration);
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.price);
    await expect(page.locator(".workshopSessions h2")).toHaveText(copy.heading);
    await expect(page.locator(".registrationForm .workshopRegistrationState")).toContainText(copy.open);
    await expect(page.locator('.registrationForm button[type="submit"]')).toHaveText(copy.register);
    if (locale !== "sk") await expect(page.locator(".workshopDescription")).not.toContainText(copy.forbidden);
  });
});
