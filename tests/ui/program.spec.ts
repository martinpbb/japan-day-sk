import { test, expect } from "../helpers/fixtures";

test("@ui programme shows the approved theatre order and current Nao Higano title", async ({ page }) => {
  await page.goto("/program", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".programVenue")).toHaveCount(2);
  const theatre = page.locator(".programVenue").nth(1).locator(".programVenueItem");
  await expect(theatre).toHaveCount(6);
  for (const [index, times] of ["11:30.*12:10", "12:20.*13:00", "13:10.*13:50", "14:40.*15:20", "15:30.*16:10", "16:10.*16:50"].entries()) await expect(theatre.nth(index)).toContainText(new RegExp(times));
  for (const [index, name] of [/Jana Michalkov/, /Martin Labud/, /Akiko Komura/, /Silvestr Prajer/, /Martin Labud/, /Hisayo Yasuda/].entries()) await expect(theatre.nth(index)).toContainText(name);
  await expect(page.locator(".programVenue").first().getByText(/Nao Higano/)).toHaveCount(4);
  await expect(page.locator(".programPending")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("@ui workshop archive shows lecturers and durations without live registration", async ({ page }) => {
  await page.route("https://api.japanday.sk/api/workshops/availability", route => route.fulfill({ json: { ok: true, data: { workshops: [
    { id: "japoncina", session_count: 3, registered_count: 6, capacity: 45 },
  ] } } }));
  await page.goto("/workshopy", { waitUntil: "domcontentloaded" });
  const card = (slug: string) => page.locator(`a.workshopCard[href$="/workshopy/${slug}"]`);
  const japanese = card("japoncina");
  await expect(japanese.locator(".workshopFacts")).toContainText("30 min");
  await expect(japanese.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  await expect(japanese.locator(".workshopOverviewSessions, .workshopOccupancy")).toHaveCount(0);
  await expect(page.locator(".workshopInfoNote")).toContainText("Registrácie na workshopy aj zoznamy náhradníkov sú uzavreté.");
  const tsumami = card("tsumami-zaiku");
  await expect(tsumami.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  await expect(tsumami.locator(".workshopFacts")).toContainText("30 min");
  const ayatori = card("ayatori");
  await expect(ayatori.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  await expect(ayatori.locator(".workshopFacts")).toContainText("30 min");
  const kumihimo = card("kumihimo");
  await expect(kumihimo.locator(".workshopFacts")).toContainText("45 min");
  const buttons = card("tvorba-kombiku");
  await expect(buttons.locator(".workshopRegistrationState")).toHaveCount(0);
  await expect(buttons.locator(".workshopOccupancy")).toHaveCount(0);
  const tea = card("cajova-degustacia");
  await expect(tea.locator(".workshopFacts")).toContainText("45 min");
  await page.goto("/workshopy/japoncina", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".workshopSessions")).toContainText(/11:30.*12:00/);
  await expect(page.locator(".workshopSessions")).toContainText(/15:30.*16:00/);
});
