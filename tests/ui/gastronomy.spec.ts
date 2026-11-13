import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";

const gastronomy = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/gastronomy.json", import.meta.url), "utf8"));

test("@ui gastronomy renders categories and detail content", async ({ page }) => {
  await page.goto("/archiv/2026/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#gastronomie")).toBeVisible();
  await page.goto("/gastronomia", { waitUntil: "domcontentloaded" });
  if (gastronomy.items.length) {
    await expect(page.locator("#gastronomie .featureCard")).toHaveCount(gastronomy.items.length);
    await expect(page.locator("#gastronomie .gastronomyCategory")).toHaveCount(gastronomy.items.length);
  } else {
    await expect(page.locator("#gastronomie .featureCard")).toHaveCount(0);
    await expect(page.locator("#gastronomie .gastronomyCategory")).toHaveCount(0);
  }
  await expect(page.locator("main h1")).toBeVisible();
});
