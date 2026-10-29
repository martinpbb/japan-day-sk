import { test } from "@playwright/test";

for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) test(`@visual homepage ${name}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto("/"); await page.screenshot({ path: `test-results/home-${name}.png`, fullPage: true });
});
