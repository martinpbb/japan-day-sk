import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

test("@data sitemap contains all generated localized routes", () => {
  const file = path.resolve(process.cwd(), "dist/sitemap.xml");
  const xml = fs.readFileSync(file, "utf8");
  expect(xml).toContain("https://japanday.sk/");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toHaveLength(84);
  expect(new Set(urls).size).toBe(urls.length);
});
