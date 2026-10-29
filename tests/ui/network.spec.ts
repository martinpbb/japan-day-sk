import { test, expect } from "../helpers/fixtures";

test("@ui first-party resources do not return errors", async ({ page, runtime }) => {
  await page.goto("/"); await expect(page.locator("main")).toBeVisible();
  expect(runtime.firstPartyFailures).toEqual([]);
});
