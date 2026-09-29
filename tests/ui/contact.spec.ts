import { test, expect } from "../helpers/fixtures";

test("@ui contact form validates without sending", async ({ page }) => {
  await page.goto("/kontakt");
  await expect(page.locator("form")).toBeVisible();
  await page.getByRole("button", { name: /odoslať/i }).click();
  await expect(page.locator("input:invalid, textarea:invalid").first()).toBeVisible();
});

test("@ui contact form mocks Formspree success", async ({ page }) => {
  await page.route("https://formspree.io/f/xeajdqer", (route) => route.fulfill({ status: 200, body: "{}", contentType: "application/json" }));
  await page.goto("/kontakt");
  await page.getByLabel("Meno").fill("Playwright Test");
  await page.getByLabel("E-mail").fill("test@example.com");
  await page.getByLabel("Správa").fill("Automated test");
  await page.getByRole("button", { name: /odoslať/i }).click();
});
