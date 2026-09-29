import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";

const exhibitors = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/exhibitors.json", import.meta.url), "utf8"));

test("@ui exhibitors render configured cards and assets", async ({ page }) => {
  await page.goto("/vystavovatelia");
  await expect(page.locator("main h1")).toBeVisible();
  if (exhibitors.items.length) {
    await expect(page.locator(".exhibitorCard")).toHaveCount(exhibitors.items.length);
    await expect(page.locator(".exhibitorCard img").first()).toHaveAttribute("alt");
  } else {
    await expect(page.locator(".emptyState")).toBeVisible();
    await expect(page.locator(".exhibitorCard")).toHaveCount(0);
  }
});
