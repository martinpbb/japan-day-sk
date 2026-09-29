import { test, expect } from "../helpers/fixtures";

test("@ui practical information contains venue, admission, map and FAQ", async ({ page }) => {
  await page.goto("/prakticke-informacie");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText(/Kč|CZK|admission|vstup|entrada/i);
  await expect(page.locator("details").first()).toBeVisible();
});
