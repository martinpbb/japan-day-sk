import { test, expect } from "../helpers/fixtures";
import { readFileSync } from "node:fs";
const children = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/children.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
test("@ui children page renders configured content", async ({ page }) => {
  await page.goto("/pre-deti", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main h1")).toBeVisible();
  if (children.activities.length) await expect(page.locator(".childrenCard")).toHaveCount(children.activities.length);
  else await expect(page.locator(".emptyState")).toBeVisible();
  if (children.competition) {
    await expect(page.locator(".childrenCompetition")).toBeVisible();
    await expect(page.locator(".childrenCompetitionCard")).toHaveCount(children.competition.categories.length);
    await expect(page.locator(".childrenPrize")).toBeVisible();
  }
  await expect(page.locator(".childrenSafety")).toBeVisible();
});

test("@ui homepage shows the children's competition poster", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".childrenIntro")).toContainText("Príďte si s deťmi užiť Japonský deň trochu inak. Čaká ich tvorenie, tradičné japonské hry, origami, ayatori aj súťaž vo vyfarbovaní.");
  await expect(page.locator(".childrenCompetitionCallout")).toContainText("Súťaž pre deti");
  await expect(page.locator(".childrenCompetitionCallout")).toContainText("balíček japonských sladkostí");
  await expect(page.locator(".childrenCard")).toHaveCount(3);
  const poster = page.locator(".childrenCompetitionImage");
  await expect(poster).toHaveAttribute("src", "/images/gallery/sutaz-pre-deti.png");
  await expect(poster).toHaveAttribute("alt", "Súťaž pre deti – Japonský deň čaju a kultúry v Považskej Bystrici");
  await expect(poster).toHaveAttribute("loading", "lazy");
  await poster.scrollIntoViewIfNeeded();
  await expect(poster).toBeVisible();
});

test("@responsive homepage children's section fits desktop and stacks on mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.locator(".childrenSection");
  const intro = section.locator(".childrenIntro");
  const callout = section.locator(".childrenCompetitionCallout");
  const poster = section.locator(".childrenCompetitionImage");
  const cards = section.locator(".childrenCard");

  await page.setViewportSize({ width: 1280, height: 900 });
  const desktopIntro = await intro.boundingBox();
  const desktopPoster = await poster.boundingBox();
  expect(desktopIntro.x).toBeLessThan(desktopPoster.x);
  expect(desktopIntro.y).toBeCloseTo(desktopPoster.y, 0);
  await expect(cards.nth(0)).toBeVisible();
  const desktopCards = await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()));
  expect(desktopCards.every(Boolean)).toBe(true);
  expect(desktopCards[0].y).toBeCloseTo(desktopCards[1].y, 0);
  expect(desktopCards[1].y).toBeCloseTo(desktopCards[2].y, 0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileIntro = await intro.boundingBox();
  const mobileCallout = await callout.boundingBox();
  const mobilePoster = await poster.boundingBox();
  const mobileFirstCard = await cards.first().boundingBox();
  expect(mobileIntro.y).toBeLessThan(mobileCallout.y);
  expect(mobileCallout.y).toBeLessThan(mobilePoster.y);
  expect(mobilePoster.y).toBeLessThan(mobileFirstCard.y);
  const mobileCards = await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()));
  expect(mobileCards[0].y).toBeLessThan(mobileCards[1].y);
  expect(mobileCards[1].y).toBeLessThan(mobileCards[2].y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
