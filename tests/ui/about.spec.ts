import { test, expect } from "../helpers/fixtures";

test("@ui about content and patronage render", async ({ page }) => {
  await page.goto("/o-podujati");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main")).toContainText(/Japons|Japan|茶|茶文化/i);
});
