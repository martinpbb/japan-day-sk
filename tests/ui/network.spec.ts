import { test, expect } from "../helpers/fixtures";
import { gotoApp } from "../helpers/navigation";

test("@ui first-party resources do not return errors", async ({ page, runtime }) => {
  await gotoApp(page, "/"); await expect(page.locator("main")).toBeVisible();
  expect(runtime.firstPartyFailures).toEqual([]);
});
