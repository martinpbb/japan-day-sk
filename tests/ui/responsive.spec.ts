import { test, expect } from "../helpers/fixtures";

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1600, height: 900 }]) test(`@responsive homepage ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
});
