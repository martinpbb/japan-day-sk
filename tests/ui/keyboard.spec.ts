import { test, expect } from "../helpers/fixtures";
import { gotoApp } from "../helpers/navigation";

test("@ui keyboard can operate menu and FAQ", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await gotoApp(page, "/");
  await page.getByRole("button", { name: /menu/i }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator("nav.open")).toBeVisible();
});
