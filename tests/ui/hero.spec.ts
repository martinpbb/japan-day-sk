import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";

test.describe("@ui hero", () => {
  for (const locale of localeCodes) test(`${locale} hero`, async ({ page }) => {
    await page.goto(prefixFor(locale));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".hero")).toBeVisible();
    await expect(page.locator(".hero .facts")).toBeVisible();
    await expect(page.locator(".hero a").first()).toBeVisible();
  });
});
