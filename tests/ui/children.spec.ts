import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";
const children = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/children.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
test("@ui children page renders configured content", async ({ page }) => {
  await page.goto("/pre-deti", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main h1")).toBeVisible();
  if (children.activities.length) await expect(page.locator(".childrenCard")).toHaveCount(children.activities.length);
  else await expect(page.locator(".emptyState")).toBeVisible();
  if (children.competition) {
    await expect(page.locator(".childrenCompetition")).toBeVisible();
    await expect(page.locator(".childrenCompetitionCard")).toHaveCount(children.competition.categories.length);
    await expect(page.locator(".childrenPrize")).toBeVisible();
  }
  await expect(page.locator(".childrenSafety")).toBeVisible();
});

test("@ui homepage shows the children's competition poster", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const poster = page.locator(".childrenCompetitionImage");
  await expect(poster).toHaveAttribute("src", "/images/gallery/sutaz-pre-deti.png");
  await expect(poster).toHaveAttribute("alt", "Súťaž pre deti – Japonský deň čaju a kultúry v Považskej Bystrici");
  await expect(poster).toHaveAttribute("loading", "lazy");
  await poster.scrollIntoViewIfNeeded();
  await expect(poster).toBeVisible();
});
