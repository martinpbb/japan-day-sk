import { test, expect } from "../helpers/fixtures";
import { gotoApp } from "../helpers/navigation";

test("@ui partners expose accessible logos and links", async ({ page }) => {
  await gotoApp(page, "/");
  const images = page.locator("img:visible");
  await expect(images).not.toHaveCount(0);
  for (const image of await images.all()) await expect(image).toHaveAttribute("alt");
});
