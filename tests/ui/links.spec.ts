import { test, expect } from "../helpers/fixtures";

test("@ui links have valid hrefs and safe external targets", async ({ page }) => {
  await page.goto("/");
  for (const link of await page.locator("a").all()) {
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).not.toMatch(/^javascript:/i);
    if (await link.getAttribute("target") === "_blank") expect(await link.getAttribute("rel") || "").toMatch(/noopener|noreferrer/);
  }
});
