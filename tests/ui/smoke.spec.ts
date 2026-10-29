import { test, expect } from "../helpers/fixtures";
import { assertCommonPage, assertNoMojibake } from "../helpers/assertions";
import { collectRuntime, assertHealthyPage } from "../helpers/network";

test.describe("@smoke @ui core routes", () => {
  for (const route of ["/", "/program", "/ucinkujuci", "/pre-deti", "/kontakt"]) {
    test(`${route} loads without first-party runtime failures`, async ({ page, runtime }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await assertHealthyPage(page, runtime);
      await assertCommonPage(page, "sk", route);
      await assertNoMojibake(page);
    });
  }
});
