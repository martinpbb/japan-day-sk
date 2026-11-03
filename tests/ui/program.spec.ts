import { test, expect } from "../helpers/fixtures";

test("@ui programme shows the approved theatre order and current Nao Higano title", async ({ page }) => {
  await page.goto("/program");
  await expect(page.locator(".programVenue")).toHaveCount(2);
  const theatre = page.locator(".programVenue").nth(1).locator(".programVenueItem");
  await expect(theatre).toHaveCount(6);
  for (const [index, times] of ["11:00.*11:40", "11:50.*12:30", "12:40.*13:20", "14:10.*14:50", "15:00.*15:40", "15:40.*16:20"].entries()) await expect(theatre.nth(index)).toContainText(new RegExp(times));
  for (const [index, name] of [/Jana Michalkov/, /Martin Labud/, /Akiko Komura/, /Silvestr Prajer/, /Martin Labud/, /Hisayo Yasuda/].entries()) await expect(theatre.nth(index)).toContainText(name);
  await expect(page.locator(".programVenue").first().getByText(/Nao Higano/)).toHaveCount(4);
  await expect(page.locator(".programPending")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("@ui workshops show current lecturers, durations and session counts", async ({ page }) => {
  await page.goto("/workshopy");
  const card = (slug: string) => page.locator(`a.workshopCard[href$="/workshopy/${slug}"]`);
  const japanese = card("japoncina");
  await expect(japanese.locator(".workshopFacts")).toContainText("30 min");
  await expect(japanese.locator(".workshopFacts")).toContainText(/11:00.*11:30.*13:00.*13:30.*15:00.*15:30/);
  await expect(japanese.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  const tsumami = card("tsumami-zaiku");
  await expect(tsumami.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  await expect(tsumami.locator(".workshopFacts")).toContainText("30 min");
  await expect(tsumami.locator(".workshopFacts")).toContainText("10");
  const ayatori = card("ayatori");
  await expect(ayatori.locator(".workshopFacts")).toContainText("Hisayo Yasuda");
  await expect(ayatori.locator(".workshopFacts")).toContainText("30 min");
  const kumihimo = card("kumihimo");
  await expect(kumihimo.locator(".workshopFacts")).toContainText("45 min");
  await expect(kumihimo.locator(".workshopFacts")).toContainText("11:00");
  await expect(kumihimo.locator(".workshopFacts")).toContainText("14:45");
  const buttons = card("tvorba-kombiku");
  await expect(buttons.locator(".workshopFacts")).toContainText(/11:00.*14:30/);
  await expect(buttons.locator(".workshopFacts")).toContainText("2");
  await expect(buttons.locator(".workshopRegistrationState")).toHaveCount(0);
  const tea = card("cajova-degustacia");
  await expect(tea.locator(".workshopFacts")).toContainText("45 min");
  await page.goto("/workshopy/japoncina");
  await expect(page.locator(".workshopSessions")).toContainText(/11:00.*11:30/);
  await expect(page.locator(".workshopSessions")).toContainText(/15:00.*15:30/);
});
