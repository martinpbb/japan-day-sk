import type { Page } from "@playwright/test";

/** Navigate once the document and the application shell are ready, without waiting on third-party load events. */
export async function gotoApp(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
}

export async function reloadApp(page: Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
}
