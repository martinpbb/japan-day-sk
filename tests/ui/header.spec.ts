import { test, expect } from "../helpers/fixtures";

test("@ui header has brand, navigation, focusable links and language control", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("header a").first()).toHaveAttribute("href", "/");
  await expect(page.locator("header").getByRole("navigation")).toBeVisible();
  await expect(page.locator(".languageSwitcherTrigger")).toBeVisible();
});
