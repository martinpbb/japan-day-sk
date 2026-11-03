import { test, expect } from "../helpers/fixtures";
import { gotoApp } from "../helpers/navigation";

test("@ui organizers and patronage render", async ({ page }) => {
  await gotoApp(page, "/o-podujati");
  await expect(page.locator("main")).toContainText(/Považská Bystrica|Japan|日本/);
});
