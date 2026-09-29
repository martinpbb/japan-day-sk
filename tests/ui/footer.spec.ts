import { test, expect } from "../helpers/fixtures";

test("@ui footer is visible and keyboard reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("footer a").first()).toHaveAttribute("href", /\S+/);
  await page.locator("footer a").first().focus();
  await expect(page.locator("footer a").first()).toBeFocused();
});
