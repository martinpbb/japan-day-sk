import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { read } from "../audit/content";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.addInitScript(() => {
    if (window.top === window && window.location.protocol === "http:") localStorage.setItem("japanday_sk_cookie_consent", "necessary");
  });
});

for (const locale of localeCodes) {
  const site = read(locale, "site"), copy = site.postEvent, seo = read(locale, "seo").routes["/"];
  test(`@ui @seo ${locale} post-event structure, placeholders and archive links`, async ({ page }) => {
    await page.goto(prefixFor(locale));
    await expect(page.locator("main > section")).toHaveCount(7);
    expect(await page.locator("main > section").evaluateAll(sections => sections.map(section => section.id))).toEqual([
      "top", "spatna-vazba", "detska-sutaz", "fotky-videa", "nase-plany", "podakovanie", "archiv"
    ]);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main h1 span")).toHaveText(copy.hero.lines);
    await expect(page.locator(".heroCardPb")).toContainText("POVAŽSKÁ");
    await expect(page.locator(".verticalText")).toHaveText("日本の茶と文化");
    await expect(page.locator(".heroCardPb img")).toHaveCount(0);
    await expect(page.locator(".heroActions a")).toHaveText(copy.hero.cta);
    await page.locator(".heroActions a").click();
    await expect(page).toHaveURL(/#spatna-vazba$/);
    await expect(page.locator(".postArtworkGrid .postStatus")).toHaveText(Array(3).fill(copy.pending));
    await expect(page.locator(".postMemory .postStatus")).toHaveText(Array(4).fill(copy.pending));
    await expect(page.locator(".postCompetition img, .postMemories img, .postMemories iframe")).toHaveCount(0);
    await expect(page.locator(".postPlans .postStatus")).toHaveText(Array(3).fill(copy.plans.status));
    await expect(page.locator(".postAcknowledgements .partnerCard")).toHaveCount(read(locale, "partners").organizers.length + read(locale, "partners").partners.length);
    await expect(page.locator(".postArchiveGrid a")).toHaveCount(10);
    await expect(page.locator("#archiv .button")).toHaveAttribute("href", prefixFor(locale, "/archiv/2026/"));
    await expect(page).toHaveTitle(seo.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", seo.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://japanday.sk${prefixFor(locale)}`);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(6);
    const html = fs.readFileSync(path.join("dist", locale === "sk" ? "" : locale, "index.html"), "utf8");
    expect(html).toContain(`<title>${seo.title}</title>`);
    expect(html).not.toMatch(/EventScheduled|InStock|"@type":"Event"/);
    await page.locator("#archiv .button").click();
    await expect(page.locator(".archiveNotice")).toContainText(site.archive.ended);
    await page.locator('.archiveGrid a[href$="/workshopy/"]').click();
    await expect(page.locator(".workshopCard")).toHaveCount(8);
    await expect(page.locator(".registrationForm, .workshopOccupancy")).toHaveCount(0);
  });

  test(`@ui ${locale} anonymous feedback and separate newsletter never submit`, async ({ page }) => {
    const sent: string[] = [];
    page.on("request", request => {
      if (request.method() !== "GET" || request.url().includes("api.japanday.sk")) sent.push(`${request.method()} ${request.url()}`);
    });
    await page.goto(prefixFor(locale));
    const feedback = page.locator(".feedbackForm"), newsletter = page.locator(".newsletterCard form");
    await expect(feedback.locator("textarea")).toHaveCount(6);
    await expect(feedback.locator("input[type=radio]")).toHaveCount(5);
    await expect(feedback.locator("[required], input[type=email], input[name=name], input[type=checkbox]")).toHaveCount(0);
    expect(await feedback.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
    await expect(feedback.locator("legend")).toHaveText(copy.feedback.rating);
    await expect(page.locator("#rating-scale")).toHaveText(copy.feedback.scale);
    await feedback.locator("textarea").first().fill("A private draft");
    await feedback.locator("input[value='4']").check();
    await feedback.locator("input[value='5']").check();
    await expect(feedback.locator("input:checked")).toHaveCount(1);
    await expect(feedback.locator("input:checked")).toHaveValue("5");
    await expect(page.locator("#feedback-unavailable")).toHaveText(copy.forms.unavailable);
    await expect(feedback.locator("button[type=submit]")).toBeDisabled();
    await expect(newsletter.locator("input[name=name]")).not.toHaveAttribute("required");
    await expect(newsletter.locator("input[type=email]")).toHaveAttribute("required", "");
    const consent = newsletter.locator("input[type=checkbox]");
    await expect(consent).not.toBeChecked();
    await expect(consent).toHaveAttribute("required", "");
    await newsletter.locator("input[type=email]").fill("invalid");
    expect(await newsletter.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await newsletter.locator("input[type=email]").fill("local-review@example.invalid");
    expect(await newsletter.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
    await consent.check();
    expect(await newsletter.evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
    await newsletter.getByRole("button", { name: copy.forms.validate, exact: true }).click();
    await expect(newsletter.locator("button[type=submit]")).toBeDisabled();
    await expect(page.locator("#newsletter-unavailable")).toHaveText(copy.forms.unavailable);
    await newsletter.locator("input[type=email]").press("Enter");
    // requestSubmit also exercises the guard if a browser triggers implicit submit.
    for (const form of [feedback, newsletter]) expect(await form.evaluate((element: HTMLFormElement) => {
      const event = new Event("submit", { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      element.requestSubmit();
      return event.defaultPrevented;
    })).toBe(true);
    await expect(feedback.locator("textarea").first()).toHaveValue("A private draft");
    expect(new URL(page.url()).search).toBe("");
    expect(sent).toEqual([]);
    const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(storage).not.toMatch(/A private draft|local-review@example/);
    await expect(page.locator(".postEventHome [role=status], .postEventHome .success")).toHaveCount(0);
  });

  test(`@ui @a11y ${locale} post-event accessibility and keyboard controls`, async ({ page }, info) => {
    await page.goto(prefixFor(locale));
    const result = await new AxeBuilder({ page }).analyze();
    await info.attach("axe-post-event", { body: JSON.stringify(result.violations, null, 2), contentType: "application/json" });
    expect(result.violations).toEqual([]);
    await page.locator('.feedbackForm input[value="1"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('.feedbackForm input[value="2"]')).toBeChecked();
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });

  test(`@ui @responsive ${locale} newsletter is centered below the complete feedback grid`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(prefixFor(locale));
    const layout = await page.locator(".postFeedback").evaluate(section => {
      const grid = section.querySelector(".postFeedbackGrid")!;
      const newsletter = section.querySelector(".newsletterCard")!;
      const container = newsletter.parentElement!;
      const gridBox = grid.getBoundingClientRect();
      const newsletterBox = newsletter.getBoundingClientRect();
      const containerBox = container.getBoundingClientRect();
      return {
        newsletterParent: newsletter.parentElement?.className,
        gridBottom: gridBox.bottom,
        newsletterTop: newsletterBox.top,
        newsletterCenter: newsletterBox.left + newsletterBox.width / 2,
        containerCenter: containerBox.left + containerBox.width / 2,
        newsletterWidth: newsletterBox.width,
      };
    });
    expect(layout.newsletterParent).toContain("postNewsletterContainer");
    expect(layout.newsletterTop).toBeGreaterThan(layout.gridBottom);
    expect(Math.abs(layout.newsletterCenter - layout.containerCenter)).toBeLessThanOrEqual(1);
    expect(layout.newsletterWidth).toBeLessThanOrEqual(800);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(".newsletterCard")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
      await page.screenshot({ path: `test-results/post-event-feedback-sk-${width}.png`, fullPage: true });
    }
  });
}

test("@ui homepage language switching preserves section, query and localized links", async ({ page }) => {
  await page.goto("/?review=local#fotky-videa");
  for (const locale of ["en", "de", "es", "ja", "sk"] as const) {
    await page.locator(".languageSwitcherTrigger").click();
    await page.locator(`.languageSwitcherMenu button`).filter({ hasText: { en: "English", de: "Deutsch", es: "Español", ja: "日本語", sk: "Slovenčina" }[locale] }).click();
    await expect(page).toHaveURL(`${new URL(page.url()).origin}${prefixFor(locale)}?review=local#fotky-videa`);
    await expect(page.locator(".header nav > a")).toHaveText(read(locale, "site").postEvent.navigation.map((item: { label: string }) => item.label));
    await expect(page.locator("#archiv .button")).toHaveAttribute("href", prefixFor(locale, "/archiv/2026/"));
    await expect(page.locator("main h1 span")).toHaveText(read(locale, "site").postEvent.hero.lines);
  }
});

for (const locale of localeCodes) for (const width of [360, 768, 1440]) test(`@responsive @visual ${locale} post-event ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(prefixFor(locale));
  await expect(page.locator("main h1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const menu = page.locator(".menuButton");
  if (width <= 900) await menu.click();
  await expect(page.locator("header nav > a")).toHaveCount(6);
  await expect(page.locator("header nav > a").nth(1)).toBeVisible();
  await page.locator("header nav > a").nth(1).click();
  await expect(page).toHaveURL(/#fotky-videa$/);
  if (width <= 900) await expect(menu).toHaveAttribute("aria-expanded", "false");
  for (const form of await page.locator(".postEventHome form").all()) {
    const box = await form.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); }));
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: info.outputPath(`post-event-${locale}-${width}.png`), fullPage: true });
});
