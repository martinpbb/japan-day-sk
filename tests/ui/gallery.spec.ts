import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";

const gallery = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/gallery.json", import.meta.url), "utf8"));

test("@ui gallery renders placeholder while photos are pending", async ({ page }) => {
  await page.goto("/galeria");
  await expect(page.locator("main h1")).toBeVisible();
  if (gallery.items.length) {
    await expect(page.locator(".galleryItem")).toHaveCount(gallery.items.length);
    await expect(page.locator(".galleryItem img").first()).toHaveAttribute("alt");
  } else {
    await expect(page.locator(".emptyState")).toBeVisible();
    await expect(page.locator(".galleryItem")).toHaveCount(0);
  }
});
