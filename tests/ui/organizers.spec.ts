import { test, expect } from "../helpers/fixtures";

test("@ui organizers and patronage render", async ({ page }) => {
  await page.goto("/o-podujati");
  await expect(page.locator("main")).toContainText(/Považská Bystrica|Japan|日本/);
});
