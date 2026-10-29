import { test, expect } from "../helpers/fixtures";

test("@seo GTM markup has one container", async ({ page }) => {
  await page.goto("/");
  const gtm = await page.evaluate(() => ({
    scripts: [...document.scripts].filter((script) => script.textContent?.includes("GTM-N5S65NK8")).length,
    ga4Script: [...document.scripts].filter((script) => script.src === "https://www.googletagmanager.com/gtag/js?id=G-ZPT8F3EETE").length,
    ga4Config: [...document.scripts].filter((script) => script.textContent?.match(/gtag\('config', 'G-ZPT8F3EETE'\)/g)).length,
    dataLayer: Array.isArray((window as Window & { dataLayer?: unknown[] }).dataLayer),
  }));
  expect(gtm).toEqual({ scripts: 1, ga4Script: 1, ga4Config: 1, dataLayer: true });
});
