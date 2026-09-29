import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";

const children = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/children.json", import.meta.url), "utf8"));

test("@ui children page renders preparation message", async ({ page }) => {
  await page.goto("/pre-deti");
  await expect(page.locator("main h1")).toBeVisible();
  if (children.activities.length) {
    await expect(page.locator(".childrenCard")).toHaveCount(children.activities.length);
  } else {
    await expect(page.locator(".emptyState")).toBeVisible();
    await expect(page.locator(".childrenCard")).toHaveCount(0);
  }
});
