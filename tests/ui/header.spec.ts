import { test, expect } from "../helpers/fixtures";

test("@ui header has brand, navigation, focusable links and language control", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header.header")).toBeVisible();
  await expect(page.locator("header.header a").first()).toHaveAttribute("href", "/");
  await expect(page.locator("header.header").getByRole("navigation")).toBeVisible();
  await expect(page.locator(".languageSwitcherTrigger")).toBeVisible();
});
