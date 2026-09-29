import { test, expect } from "../helpers/fixtures";

test("@ui FAQ details support keyboard interaction", async ({ page }) => {
  await page.goto("/prakticke-informacie");
  const details = page.locator("details").first();
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
});
