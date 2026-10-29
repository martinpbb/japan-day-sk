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
