import { test, expect } from "../helpers/fixtures";

const reelId = "1067329319694945";
const reelUrl = `https://www.facebook.com/reel/${reelId}`;

test("@ui Facebook Reel is click-to-play with an accessible fallback", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const video = page.locator(".videoWrapFacebook");
  await expect(video).toBeVisible();
  await expect(video.locator("iframe")).toHaveCount(0);
  await expect(video.getByRole("button", { name: /\S+/ })).toBeVisible();
  const fallback = video.getByRole("link", { name: "Pozrieť video na Facebooku" });
  await expect(fallback).toHaveAttribute("href", reelUrl);
  await expect(fallback).toHaveAttribute("target", "_blank");
  await expect(fallback).toHaveAttribute("rel", "noopener noreferrer");

  await video.getByRole("button").click();
  await expect(video.locator("iframe")).toHaveAttribute("src", new RegExp(`plugins/video\\.php\\?href=${encodeURIComponent(reelUrl)}`));
});

test("@ui Facebook Reel is configured for English", async ({ page }) => {
  await page.goto("/en/", { waitUntil: "domcontentloaded" });
  const video = page.locator(".videoWrapFacebook");
  await expect(video).toBeVisible();
  await expect(video.locator("iframe")).toHaveCount(0);
  await expect(video.getByRole("link", { name: "Pozrieť video na Facebooku" })).toHaveAttribute("href", reelUrl);
});
