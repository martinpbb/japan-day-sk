import { test, expect } from "../helpers/fixtures";
import { headerRoutes } from "../helpers/routes";

test("@ui navigation exposes current routes", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("header a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs).toEqual(["/", ...headerRoutes]);
});

test("@ui mobile navigation opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: /menu/i });
  await expect(menu).toBeVisible();
  await menu.click();
  const navigation = page.locator("header nav");
  await expect(navigation).toHaveClass(/open/);
  await menu.click();
  await expect(navigation).not.toHaveClass(/open/);
});
