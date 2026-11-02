import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { assertNoMojibake } from "../helpers/assertions";

test.describe("@smoke @ui locale roots", () => {
  for (const locale of localeCodes) test(`${locale} root`, async ({ page, runtime }) => {
    await page.goto(prefixFor(locale), { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("header")).toBeVisible();
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
      sk: { title: "Workshopy", lecturer: "Lektor", duration: "Trvanie", price: "Cena", time: "Termín", free: "Zadarmo", closed: "Registrácia zatiaľ nie je otvorená", heading: "Termíny", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia zatiaľ nie je otvorená)/ },
      en: { title: "Workshops", lecturer: "Lecturer", duration: "Duration", price: "Price", time: "Time", free: "Free", closed: "Registration is not open yet", heading: "Sessions", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      de: { title: "Workshops", lecturer: "Kursleitung", duration: "Dauer", price: "Preis", time: "Termin", free: "Kostenlos", closed: "Anmeldung ist noch nicht geöffnet", heading: "Termine", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      es: { title: "Talleres", lecturer: "Instructor", duration: "Duración", price: "Precio", time: "Horario", free: "Gratis", closed: "La inscripción aún no está abierta", heading: "Horarios", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia)/ },
      ja: { title: "ワークショップ", lecturer: "講師", duration: "所要時間", price: "料金", time: "開催時間", free: "無料", closed: "現在、事前予約はまだ開始していません", heading: "開催回", forbidden: /(?:Workshopy|Lektori?|Trvanie|Cena|Termín|Zadarmo|Registrácia|Kapacita|miest)/ },
    }[locale];
    await page.goto(prefixFor(locale, "/workshopy"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toHaveText(copy.title);
    await expect(page.locator(".workshopCard").first()).toContainText(copy.lecturer);
    await expect(page.locator(".workshopCard").first()).toContainText(copy.duration);
    await expect(page.locator(".workshopCard").first()).toContainText(copy.price);
    await expect(page.locator(".workshopCard").first()).toContainText(copy.time);
    await expect(page.locator(".workshopCard").filter({ hasText: "Ayatori あやとり" }).locator(".workshopFacts")).toContainText(copy.free);
    if (locale !== "sk") await expect(page.locator(".workshopGrid")).not.toContainText(copy.forbidden);
    await page.goto(prefixFor(locale, "/workshopy/ayatori"), { waitUntil: "domcontentloaded" });
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.lecturer);
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.duration);
    await expect(page.locator(".workshopDetailFacts")).toContainText(copy.price);
    await expect(page.locator(".workshopSessions h2")).toHaveText(copy.heading);
    await expect(page.locator(".workshopRegistrationState")).toContainText(copy.closed);
    if (locale !== "sk") await expect(page.locator(".workshopDetail")).not.toContainText(copy.forbidden);
  });
});
