import { expect, type Page } from "@playwright/test";
import { localeCodes, prefixFor, type Locale } from "./locales";

export async function assertCommonPage(page: Page, locale: Locale, route = "/") {
  await expect(page).toHaveURL(new RegExp(`${prefixFor(locale, route).replaceAll("/", "\\/")}\\/?$`));
  await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-CN" : locale);
  await expect(page).toHaveTitle(/\S+/);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
}

export async function assertRenderedDetail(page: Page, expectedH1: string | RegExp) {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("main")).not.toHaveText(/^\s*$/);
  await expect(page.locator("h1")).toHaveText(expectedH1);
  await expect(page.locator("main")).toContainText(/\S/);
}

export async function assertImages(page: Page) {
  for (const image of await page.locator("img:visible").all()) {
    await expect(image).toHaveAttribute("alt");
    await image.scrollIntoViewIfNeeded();
    const details = await image.evaluate((element) => new Promise((resolve) => {
      const img = element as HTMLImageElement;
      const report = () => resolve({
        src: img.getAttribute("src"),
        currentSrc: img.currentSrc,
        alt: img.alt,
        loading: img.getAttribute("loading"),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      if (img.complete) {
        report();
        return;
      }
      img.addEventListener("load", report, { once: true });
      img.addEventListener("error", report, { once: true });
    }));
    expect((details as { naturalWidth: number }).naturalWidth, JSON.stringify(details)).toBeGreaterThan(0);
  }
}

export async function assertNoMojibake(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/Ãƒ|Ã‚|Ã„|Ã¦â€”|Ã¡Âº|ï¿½/);
}

export { localeCodes };
