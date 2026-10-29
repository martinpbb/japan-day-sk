import { test, expect } from "@playwright/test";

test("@production production origin is HTTPS and has no localhost metadata", async ({ page }) => {
  test.skip(!process.env.BASE_URL?.startsWith("https://japanday.sk"), "Set BASE_URL=https://japanday.sk");
  await page.goto("/"); await expect(page).toHaveURL(/^https:\/\/japanday\.sk/);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /^https:\/\/japanday\.sk/);
  expect(await page.content()).not.toMatch(/localhost|127\.0\.0\.1|C:\\Users/i);
});
