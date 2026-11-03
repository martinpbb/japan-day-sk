import { test, expect } from "../helpers/fixtures";

test("@seo GTM markup has one container", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const gtm = await page.evaluate(() => ({
    scripts: [...document.scripts].filter((script) => script.src.includes("googletagmanager.com/gtm.js?id=GTM-MGF62FC3")).length,
    ga4Script: [...document.scripts].filter((script) => script.src === "https://www.googletagmanager.com/gtag/js?id=G-80MZ8NGTCN").length,
    ga4Config: [...document.scripts].filter((script) => script.textContent?.match(/gtag\('config', 'G-80MZ8NGTCN'\)/g)).length,
    dataLayer: Array.isArray((window as Window & { dataLayer?: unknown[] }).dataLayer),
  }));
  expect(gtm).toEqual({ scripts: 1, ga4Script: 1, ga4Config: 1, dataLayer: true });
});
