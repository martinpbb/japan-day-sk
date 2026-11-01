import { test, expect } from "../helpers/fixtures";

test("@ui programme displays both venue schedules with start and end times", async ({ page }) => {
  await page.goto("/program");
  await expect(page.locator(".programVenue")).toHaveCount(2);
  await expect(page.getByText("Kapacita: 100 osôb")).toBeVisible();
  await expect(page.locator(".programVenue").nth(0).locator(".programVenueItem")).toHaveCount(11);
  await expect(page.locator(".programVenue").nth(1).locator(".programVenueItem")).toHaveCount(6);
  await expect(page.getByText("Tameshigiri – ukážka sekania japonským mečom")).toBeVisible();
  await expect(page.getByText("16:20–16:50")).toBeVisible();
  await expect(page.getByText("Záverečné poďakovanie")).toBeVisible();
  await expect(page.locator(".programVenue").nth(1).locator(".programVenueItem").nth(0).getByRole("link", { name: "Hisayo Yasuda" })).toBeVisible();
  await expect(page.getByText("Ako japonský čaj prospieva ľudskému telu")).toBeVisible();
  await expect(page.getByText("Shodō: japonská kaligrafia")).toBeVisible();
  await expect(page.getByText("Japonský čaj a jeho rozdelenie")).toBeVisible();
  await expect(page.getByText("Sengoku jidai: obdobie bojujúcich štátov")).toBeVisible();
  await expect(page.getByText("Bez pódiového programu")).toHaveCount(0);
  await expect(page.locator(".programPending")).toHaveCount(0);
  await expect(page.locator("main h1")).toBeVisible();

  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("@ui workshops show the corrected instructors and paid Tsumami zaiku price", async ({ page }) => {
  await page.goto("/workshopy");
  const japanese = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: "Japončina", exact: true }) });
  const origami = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: "Origami", exact: true }) });
  const tsumami = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: "Tsumami zaiku つまみ細工", exact: true }) });
  const ayatori = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: "Ayatori あやとり", exact: true }) });
  const buttons = page.locator("a.workshopCard[href$='/workshopy/tvorba-kombiku']");
  const tea = page.locator("a.workshopCard[href$='/workshopy/cajova-degustacia']");

  await expect(japanese.locator(".workshopFacts")).toContainText("45 min");
  await expect(japanese.locator(".workshopFacts")).toContainText("11:00 – 11:45, 12:15 – 13:00, 13:30 – 14:15");
  await expect(origami.getByText("Asuka Emura (hlavná lektorka)")).toBeVisible();
  await expect(origami.getByText("Hisayo Yasuda (podpora)")).toBeVisible();
  await expect(origami.locator(".workshopFacts")).toContainText("11:00 – 12:30, 13:00 – 14:30");
  await expect(origami.getByText("Aiko Bosák", { exact: true })).toHaveCount(0);
  await expect(tsumami.getByText("Aiko Bosák", { exact: true })).toBeVisible();
  await expect(tsumami.locator(".workshopFacts")).toContainText("10,00");
  await expect(buttons.locator(".workshopFacts")).toContainText("11:00");
  await expect(buttons.locator(".workshopFacts")).toContainText("12:30");
  await expect(buttons.locator(".workshopFacts")).toContainText("13:00");
  await expect(buttons.locator(".workshopFacts")).toContainText("14:30");
  await expect(buttons.getByText(/Aiko Bos/)).toBeVisible();
  await expect(tsumami.locator(".workshopFacts")).toContainText("11:00 – 12:30, 13:00 – 14:30");
  await expect(ayatori.getByText("Aiko Bosák", { exact: true })).toBeVisible();
  await expect(ayatori.locator(".workshopFacts")).toContainText("11:00");
  await expect(ayatori.locator(".workshopFacts")).toContainText("12:00");
  await expect(ayatori.locator(".workshopFacts")).toContainText("13:00");
  await expect(ayatori.locator(".workshopFacts")).toContainText("14:00");
  await expect(tea.locator(".workshopFacts")).toContainText("13:30");
  await expect(tea.locator(".workshopFacts")).toContainText("14:15");
  const shodo = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: /Shodō/ }) });
  const kumihimo = page.locator(".workshopCard").filter({ has: page.getByRole("heading", { name: "Kumihimo", exact: true }) });
  await expect(shodo.locator(".workshopFacts")).toContainText("11:00 – 12:30, 13:00 – 14:30");
  await expect(kumihimo.locator(".workshopFacts")).toContainText("11:00 – 12:30, 13:00 – 14:30, 15:00 – 16:30");

  for (const [slug, times] of [
    ["origami", ["11:00", "12:30", "13:00", "14:30"]],
    ["tvorba-kombiku", ["11:00", "12:30", "13:00", "14:30"]],
    ["tsumami-zaiku", ["11:00", "12:30", "13:00", "14:30"]],
    ["ayatori", ["11:00", "12:00", "13:00", "14:00"]],
    ["cajova-degustacia", ["13:30", "14:15"]],
  ] as const) {
    await page.goto(`/workshopy/${slug}`);
    for (const time of times) await expect(page.locator(".workshopSessions")).toContainText(time);
  }
});
