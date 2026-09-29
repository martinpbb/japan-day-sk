import { test, expect } from "../helpers/fixtures";
import { localeCodes, prefixFor } from "../helpers/locales";
import { readFileSync } from "node:fs";

const performersData = JSON.parse(readFileSync(new URL("../../src/data/locales/sk/performers.json", import.meta.url), "utf8"));

const performers = performersData.items;

test("@ui performer cards link to working detail pages", async ({ page }) => {
  test.skip(!performers.length, "No performer data is configured yet.");
  for (const id of performers) {
    await page.goto("/ucinkujuci");
    const link = page.locator(`#host-${id.id}`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/ucinkujuci/${id.id}/?$`));
    await expect(page.locator("main h1")).toBeVisible();
  }
});

test("@ui performer direct routes render", async ({ page }) => {
  test.skip(!performers.length, "No performer data is configured yet.");
  for (const id of performers) {
    await page.goto(`/ucinkujuci/${id.id}`);
    await expect(page.locator("main h1")).toBeVisible();
  }
});

for (const locale of localeCodes) {
  test(`@ui performer locale flow ${locale}`, async ({ page }) => {
    test.skip(!performers.length, "No performer data is configured yet.");
    await page.goto(prefixFor(locale, "/ucinkujuci"));
    const link = page.locator(`#host-${performers[0].id}`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(prefixFor(locale, `/ucinkujuci/${performers[0].id}`).replaceAll("/", "\\/") + "/?$"));
    await expect(page.locator("main h1")).toBeVisible();
  });
}
