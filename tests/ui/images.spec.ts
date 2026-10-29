import { test } from "../helpers/fixtures";
import { assertImages } from "../helpers/assertions";

test("@ui all visible first-party images load", async ({ page }) => { await page.goto("/"); await assertImages(page); });
