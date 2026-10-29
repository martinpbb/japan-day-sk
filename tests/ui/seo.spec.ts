import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { routes } from "../helpers/routes";

test.describe("@seo route metadata", () => {
  for (const locale of localeCodes) {
    for (const route of routes.slice(0, 4)) {
      test(`${locale} ${route}`, async ({ page }) => {
        await page.goto(prefixFor(locale, route));
        await expect(page.locator("meta[name=description]")).toHaveCount(1);
        await expect(page.locator("link[rel=canonical]")).toHaveCount(1);
        await expect(page.locator("meta[property='og:title']")).toHaveCount(1);
        await expect(page.locator("link[rel=alternate]")).toHaveCount(7);
        await expect(page.locator("script[type='application/ld+json']").first()).toBeAttached();
      });
    }
  }
});

test.describe("@seo Event JSON-LD", () => {
  const expectedLanguage: Record<string, string> = {
    sk: "sk",
    en: "en",
    de: "de",
    es: "es",
    zh: "zh-CN",
    vi: "vi"
  };

  for (const locale of localeCodes) {
    test(`${locale} homepage has complete Event schema`, async ({ page }) => {
      await page.goto(prefixFor(locale, "/"));
      const events = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts
        .map((script) => JSON.parse(script.textContent || "{}"))
        .filter((schema) => schema["@type"] === "Event"));

      expect(events).toHaveLength(1);
      const event = events[0];
      expect(event.startDate).toBe("2026-11-07");
      expect(event).not.toHaveProperty("endDate");
      expect(event.eventStatus).toBe("https://schema.org/EventScheduled");
      expect(event.organizer).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Rada mládeže Trenčianskeho kraja" }),
        expect.objectContaining({ name: "Mesto Považská Bystrica" }),
        expect.objectContaining({ name: "Mladí pre Považskú" })
      ]));
      expect(event.performer).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "Marek Hora" }),
        expect.objectContaining({ name: "Gorin" }),
        expect.objectContaining({ name: "Noriko Komiyama" }),
        expect.objectContaining({ name: "Martin Labudík" })
      ]));
      expect(event.performer.length).toBe(4);
      expect(event.isAccessibleForFree).toBe(true);
      expect(event.offers).toMatchObject({ price: 0, priceCurrency: "EUR" });
      expect(event.inLanguage).toBe(expectedLanguage[locale]);
      expect(event.url).toContain("https://japanday.sk");
    });
  }
});
