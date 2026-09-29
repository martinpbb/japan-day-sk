import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";

const program = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/program.json", import.meta.url), "utf8"));

test("@ui programme shows draft placeholder while schedule is empty", async ({ page }) => {
  await page.goto("/program");
  if (program.items.length) {
    await expect(page.locator(".programItem")).toHaveCount(program.items.length);
  } else {
    await expect(page.locator(".programPending")).toBeVisible();
    await expect(page.locator(".programItem")).toHaveCount(0);
  }
  await expect(page.locator("main h1")).toBeVisible();
});
