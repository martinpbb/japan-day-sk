import { test, expect } from "../helpers/fixtures";
import AxeBuilder from "@axe-core/playwright";

const consentKey = "japanday_cookie_consent";

async function dataLayer(page) {
  return page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer || []).map((entry) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return Object.values(entry as Record<string, unknown>);
    return entry;
  }));
}

test.describe("@ui cookie consent", () => {
  test("shows banner and stores necessary consent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Iba nevyhnutné" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("necessary");
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const calls = await dataLayer(page);
    expect(calls).toContainEqual(["consent", "update", expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" })]);
  });

  test("grants analytics only and can be changed from the footer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Povoliť štatistiky" }).click();
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("analytics");
    let calls = await dataLayer(page);
    expect(calls).toContainEqual(["consent", "update", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" })]);

    await page.getByRole("button", { name: "Nastavenie cookies" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Iba nevyhnutné" }).click();
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("necessary");
    calls = await dataLayer(page);
    expect(calls.at(-1)).toEqual(["consent", "update", expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" })]);
  });

  for (const [locale, title] of Object.entries({
    sk: "Používame analytické cookies",
    en: "We use analytics cookies",
    de: "Wir verwenden Analyse-Cookies",
    es: "Usamos cookies analíticas",
    zh: "我们使用分析 Cookie",
    vi: "Chúng tôi sử dụng cookie phân tích",
  })) {
    test(`${locale} renders translated consent copy`, async ({ page }) => {
      await page.goto(locale === "sk" ? "/" : `/${locale}/`);
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(title);
    });
  }
});

test("@responsive cookie consent fits on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("@a11y cookie consent is keyboard usable", async ({ page }) => {
  await page.goto("/");
  const necessary = page.getByRole("button", { name: "Iba nevyhnutné" });
  await necessary.focus();
  await expect(necessary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("@a11y cookie consent has no serious violations", async ({ page }) => {
  await page.goto("/");
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});
