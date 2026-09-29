import { test, expect } from "../helpers/fixtures";

test("@ui video preview is accessible", async ({ page }) => {
  await page.goto("/");
  const video = page.locator(".videoWrap");
  await expect(video).toBeVisible();
  const poster = video.locator("button");
  if (await poster.count()) await expect(poster).toHaveAttribute("aria-label", /\S+/);
});
