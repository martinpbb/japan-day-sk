import { test, expect } from "../helpers/fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/program", "/ucinkujuci", "/pre-deti", "/gastronomia", "/galeria", "/kontakt"]) test(`@a11y ${route} has no serious violations`, async ({ page }) => {
  await page.goto(route);
  const result = await new AxeBuilder({ page }).analyze();
  const violations = result.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""));
  const summary = violations.flatMap((item) => item.nodes.map((node) => [
    `${item.id} (${item.impact || "unknown"})`,
    (node.target || []).join(" "),
    node.failureSummary || item.description,
    item.helpUrl,
  ].join(" | "))).join("\n");
  expect(violations, summary).toEqual([]);
});
