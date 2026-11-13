import { test, expect } from "@playwright/test";
import { archiveLocales, archiveRoot, sections, expectedArchiveRoutes, localized, readArchiveContent } from "../helpers/archive";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  // No production API or external services are needed to review historical data.
  await page.route(/^https:\/\//, route => route.abort());
  await page.addInitScript(() => {
    if (window.top === window && window.location.protocol === "http:") localStorage.setItem("japanday_sk_cookie_consent", "necessary");
  });
});

for (const locale of archiveLocales) {
  const content = readArchiveContent(locale);
  for (const route of expectedArchiveRoutes(locale)) {
    test(`@archive @routing ${locale} ${route} direct load, refresh and hydrated SEO`, async ({ page }) => {
      const errors: string[] = [], apiRequests: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("request", request => { if (request.url().includes("api.japanday.sk")) apiRequests.push(request.url()); });
      const publicPath = localized(locale, route);
      expect((await page.goto(publicPath))?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator(".archiveNotice")).toContainText(content.site.archive.ended);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://japanday.sk${publicPath}`);
      await expect(page.locator('link[rel="alternate"]')).toHaveCount(6);
      for (const lang of archiveLocales) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveAttribute("href", `https://japanday.sk${localized(lang, route)}`);
      expect((await page.reload())?.status()).toBe(200);
      await expect(page.locator(".archiveNotice")).toContainText(content.site.archive.ended);
      await expect(page.locator('.registrationForm, .registrationFields, main input[type="radio"], .workshopOccupancy')).toHaveCount(0);
      expect(apiRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test(`@archive @ui ${locale} index cards, historical homepage, sections and detail links`, async ({ page }) => {
    await page.goto(localized(locale, archiveRoot));
    await expect(page.locator(".heroCardPb")).toContainText("POVAŽSKÁ");
    await expect(page.locator(".verticalText")).toHaveText("日本の茶と文化");
    await expect(page.locator(".archiveGrid a")).toHaveCount(sections.length);
    for (const section of sections) {
      const card = page.locator(`.archiveGrid a[href="${localized(locale, `${archiveRoot}/${section}`)}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator("h3")).toHaveText(content.site.archive.cards[`/${section}`].title);
      await expect(card.locator("p")).toHaveText(content.site.archive.cards[`/${section}`].description);
    }
    await expect(page.locator("main #program")).toBeVisible();
    await expect(page.locator("main #astronomicky-klub")).toContainText(content.astronomy.speaker);
    for (const selector of [".heroActions a", ".performerCardLink", ".exhibitorCardLink", ".childrenCta"]) {
      for (const href of await page.locator(`main ${selector}`).evaluateAll(links => links.map(link => link.getAttribute("href") || ""))) {
        if (href.startsWith("/")) expect(href).toContain(archiveRoot);
        else expect(href).toMatch(/^https:\/\//);
      }
    }
    const notice = page.locator(".archiveNotice");
    await page.locator(`.archiveGrid a[href="${localized(locale, `${archiveRoot}/workshopy`)}"]`).click();
    await expect(page.locator(".workshopGrid .workshopCard")).toHaveCount(content.workshops.items.length);
    await page.locator(".workshopGrid .workshopCard").first().click();
    await expect(page.locator(".workshopDescription")).toContainText(content.workshops.items[0].description.split(/\n\n+/)[0]);
    await expect(notice).toContainText(content.site.archive.registrationsClosed);
    await page.locator(".backLink").click();
    await expect(page).toHaveURL(new RegExp(`${archiveRoot}/workshopy/?$`));
  });

  test(`@archive @ui ${locale} every workshop preserves descriptions, lecturers and saved sessions`, async ({ page }) => {
    for (const workshop of content.workshops.items) {
      await page.goto(localized(locale, `${archiveRoot}/workshopy/${workshop.slug || workshop.id}`));
      await expect(page.locator("main h1")).toHaveText(workshop.title);
      await expect(page.locator(".workshopDescription")).toContainText(workshop.description.split(/\n\n+/)[0]);
      for (const lecturer of workshop.lecturers || (workshop.lecturerId ? [{ performerId: workshop.lecturerId }] : [])) {
        const name = lecturer.name || content.performers.items.find((item: { id: string }) => item.id === lecturer.performerId)?.name;
        if (name) await expect(page.locator(".workshopDetailFacts")).toContainText(name);
      }
      await expect(page.locator(".workshopSessions")).toContainText(content.site.event.date);
      for (const session of workshop.sessions || []) {
        if (workshop.registrationRequired !== false) {
          const time = (session.start || "").match(/T(\d{2}:\d{2})/)?.[1];
          if (time) await expect(page.locator(".workshopSessions")).toContainText(time);
          await expect(page.locator(`time[datetime="${session.start}"]`)).toHaveCount(1);
        }
      }
      await expect(page.locator(".workshopSessions")).toContainText(content.site.archive.registrationsClosed);
      await expect(page.locator("main form, main input, .workshopOccupancy")).toHaveCount(0);
    }
  });

  test(`@archive @routing ${locale} legacy links keep queries and fragments and unknown routes return 404`, async ({ page, request }) => {
    for (const route of expectedArchiveRoutes(locale).filter(route => route !== archiveRoot && !route.endsWith("/astronomia"))) {
      const legacy = localized(locale, route.slice(archiveRoot.length));
      const response = await request.get(legacy, { maxRedirects: 0 });
      expect(response.status(), legacy).toBe(301);
      expect(new URL(response.headers().location, "http://127.0.0.1:4175").pathname).toBe(localized(locale, route));
    }
    await page.goto(`${localized(locale, "/gastronomia")}?review=2026#caj`);
    await expect(page).toHaveURL(new RegExp(`${archiveRoot}/gastronomia/\\?review=2026#caj$`));
    await expect(page.locator(".archiveNotice")).toBeVisible();
    await page.goto(localized(locale, "/workshopy/japonstina"));
    await expect(page).toHaveURL(new RegExp(`${archiveRoot}/workshopy/japoncina/$`));
    for (const invalid of ["/does-not-exist", `${archiveRoot}/does-not-exist`, `${archiveRoot}/ucinkujuci/unknown`, `${archiveRoot}/workshopy/unknown`, "/ucinkujuci/unknown", "/ucinkujuci/%E0%A4%A"]) {
      expect((await page.goto(localized(locale, invalid)))?.status()).toBe(404);
      await expect(page.locator("main h1")).toHaveText(content.site.archive.notFoundTitle);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
  });

  test(`@archive @responsive ${locale} mobile cards fit and remain keyboard accessible`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localized(locale, archiveRoot));
    const cards = page.locator(".archiveGrid a");
    for (let index = 0; index < sections.length; index++) {
      const box = await cards.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).include(".archiveGrid").analyze();
    expect(accessibility.violations).toEqual([]);
    await page.locator(".archiveGrid").screenshot({ path: info.outputPath(`archive-${locale}-mobile-cards.png`) });
    await cards.first().focus();
    await expect(cards.first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${archiveRoot}/o-podujati/$`));
    await page.screenshot({ path: info.outputPath(`archive-${locale}-mobile.png`), fullPage: true });
  });

  test(`@archive @routing ${locale} GitHub Pages redirect document preserves deep-link state`, async ({ page }) => {
    const legacy = localized(locale, "/gastronomia");
    const html = fs.readFileSync(path.join("dist", legacy, "index.html"), "utf8");
    // Serve the generated document instead of the Cloudflare 301 rule.
    await page.route(`http://127.0.0.1:4175${legacy}*`, route => route.fulfill({ contentType: "text/html", body: html }));
    await page.goto(`${legacy}?review=2026#caj`);
    await expect(page).toHaveURL(new RegExp(`${archiveRoot}/gastronomia/\\?review=2026#caj$`));
    await expect(page.locator(".archiveNotice")).toContainText(content.site.archive.ended);
  });
}

for (const locale of archiveLocales) {
  const content = readArchiveContent(locale);
  test(`@archive @ui ${locale} children's competition uses historical copy and keeps its poster`, async ({ page }) => {
    await page.goto(localized(locale, `${archiveRoot}/pre-deti`));
    const competition = content.children.competition.archive;
    await expect(page.locator("#children-competition-title")).toHaveText(competition.title);
    await expect(page.locator(".childrenCompetitionIntro")).toHaveText(competition.intro);
    await expect(page.locator(".childrenCompetitionImage")).toHaveAttribute("src", "/images/gallery/sutaz-pre-deti.png");
    await expect(page.locator(".childrenCompetitionImage")).toHaveAttribute("alt", competition.posterAlt);
    await expect(page.locator(".childrenCompetitionCard")).toHaveCount(competition.categories.length);
    await expect(page.locator(".childrenPrize")).toContainText(competition.prize.title);
    await expect(page.locator(".childrenPrize")).toContainText(competition.prize.text);
  });
}

for (const route of [archiveRoot, `${archiveRoot}/program`, `${archiveRoot}/workshopy/japoncina`, `${archiveRoot}/ucinkujuci/hisayo-yasuda`]) {
  test(`@archive @ui language switch and browser history on ${route}`, async ({ page }) => {
    await page.goto(localized("sk", route));
    for (const locale of ["en", "de", "es", "ja", "sk"]) {
      await page.locator(".languageSwitcherTrigger").click();
      await page.getByRole("option").filter({ hasText: { en: "English", de: "Deutsch", es: "Español", ja: "日本語", sk: "Slovenčina" }[locale] }).click();
      await expect(page).toHaveURL(new RegExp(`${localized(locale, route)}$`));
      await expect(page.locator(".archiveNotice")).toContainText(readArchiveContent(locale).site.archive.ended);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://japanday.sk${localized(locale, route)}`);
    }
    await page.goBack();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.locator(".archiveNotice")).toContainText(readArchiveContent("ja").site.archive.ended);
  });
}

test("@archive @ui production homepage composition, hero and navigation are preserved", async ({ page }) => {
  const content = readArchiveContent("sk");
  await page.goto("/");
  await expect(page.locator(".archiveNotice, .archiveGrid")).toHaveCount(0);
  await expect(page.locator("main h1")).toHaveText(content.site.hero.title);
  await expect(page.locator(".heroCardPb")).toContainText("POVAŽSKÁ");
  await expect(page.locator(".header .nav > a")).toHaveCount(content.site.navigation.length);
  for (const item of content.site.navigation) await expect(page.locator(`.header .nav > a[href="${item.path}"]`)).toHaveText(item.label);
  await expect(page.locator(`footer a[href="${archiveRoot}/"]`)).toBeVisible();
});
