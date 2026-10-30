import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { assertNoMojibake } from "../helpers/assertions";

test.describe("@smoke @ui locale roots", () => {
  for (const locale of localeCodes) test(`${locale} root`, async ({ page, runtime }) => {
    await page.goto(prefixFor(locale), { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-CN" : locale);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.getByRole("button").filter({ hasText: /SK|EN|DE|ES|ZH|VI/ }).first()).toBeVisible();
    await assertNoMojibake(page);
    expect(runtime.pageErrors).toEqual([]);
  });
});

test.describe("@smoke @ui localized Workshops routes", () => {
  for (const locale of localeCodes) test(`${locale} Workshops route and language switch`, async ({ page, runtime }) => {
    await page.goto(prefixFor(locale, "/workshopy"), { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".workshopCard")).toHaveCount(8);
    const expectedTitle = locale === "sk" ? "Japončina" : ({ en: "Japanese language", de: "Japanisch", es: "Idioma japonés", zh: "日语", vi: "Tiếng Nhật" }[locale]);
    await expect(page.locator(".workshopCard h3").filter({ hasText: new RegExp(`^${expectedTitle}$`) })).toBeVisible();
    await page.locator(".languageSwitcherTrigger").click();
    await page.getByRole("option", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/workshopy\/?$/);
    await expect(page.locator(".workshopCard h3").filter({ hasText: /^Japanese language$/ })).toBeVisible();
    expect(runtime.pageErrors).toEqual([]);
  });
});
