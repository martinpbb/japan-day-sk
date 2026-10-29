import type { Page } from "@playwright/test";

export type RuntimeReport = { pageErrors: string[]; consoleErrors: string[]; firstPartyFailures: string[]; thirdPartyFailures: string[] };

export function collectRuntime(page: Page): RuntimeReport {
  const report: RuntimeReport = { pageErrors: [], consoleErrors: [], firstPartyFailures: [], thirdPartyFailures: [] };
  const host = new URL(page.url() || "http://127.0.0.1").host;
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !/extension|smartsupp/i.test(message.text())) report.consoleErrors.push(message.text()); });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    (new URL(url).host === host ? report.firstPartyFailures : report.thirdPartyFailures).push(`${response.status()} ${url}`);
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    (new URL(url).host === host ? report.firstPartyFailures : report.thirdPartyFailures).push(`${request.failure()?.errorText || "failed"} ${url}`);
  });
  return report;
}

export async function assertHealthyPage(page: Page, report: RuntimeReport) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").filter({ visible: true }).isVisible();
  await page.locator("header").isVisible();
  await page.locator("main").isVisible();
  await page.locator("footer").isVisible();
  await page.locator("body").evaluate((body) => { if (!body.innerText.trim()) throw new Error("blank body"); });
  await page.evaluate(() => { if (document.documentElement.scrollWidth > document.documentElement.clientWidth) throw new Error("horizontal overflow"); });
  if (report.pageErrors.length || report.consoleErrors.length || report.firstPartyFailures.length) throw new Error(JSON.stringify(report));
}
