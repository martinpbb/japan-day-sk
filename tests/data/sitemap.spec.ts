import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { localeCodes, prefixFor } from "../helpers/locales";
import { expectedArchiveRoutes, sections } from "../helpers/archive";

test("@data sitemap is valid when build output exists", () => {
  const file = path.resolve(process.cwd(), "dist/sitemap.xml");
  test.skip(!fs.existsSync(file), "Run npm run build first");
  const xml = fs.readFileSync(file, "utf8");
  const urls = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((match) => match[1]);
  expect(urls.length).toBeGreaterThan(0);
  expect(urls).toContain("https://japanday.sk/");
  expect(new Set(urls).size).toBe(urls.length);
  for (const url of urls) expect(url).toMatch(/^https:\/\/japanday\.sk\//);

  const expected = new Set<string>();
  for (const locale of localeCodes) {
    const dir = path.resolve(process.cwd(), "src/data/locales", locale);
    const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8").replace(/^\uFEFF/, ""));
    const seo = read("seo");
    const routes = new Set<string>([
      ...Object.keys(seo.routes).filter(route => !sections.some(section => route === `/${section}` || route.startsWith(`/${section}/`))),
      ...expectedArchiveRoutes(locale),
    ]);
    for (const route of routes) {
      const localized = prefixFor(locale, route).replace(/\/$/, "");
      expected.add(`https://japanday.sk${localized || ""}/`);
    }
  }
  expect([...urls].sort()).toEqual([...expected].sort());
});
