import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src/data/locales");
const locales = ["sk", "en", "de", "es", "ja"];
const files = ["site", "seo", "program", "performers", "gastronomy", "exhibitors", "workshops", "gallery", "partners", "children"];
const read = (locale: string, file: string) => JSON.parse(fs.readFileSync(path.join(root, locale, `${file}.json`), "utf8"));

test("@data locale site files have matching top-level structure", () => {
  const reference = Object.keys(read("sk", "site")).sort();
  for (const locale of locales) expect(Object.keys(read(locale, "site")).sort(), `${locale}/site`).toEqual(reference);
});

test("@data locale sites contain Hero openingFrom and required arrays", () => {
  for (const locale of locales) {
    const site = read(locale, "site"); const content = Object.fromEntries(files.filter((file) => file !== "site").map((file) => [file, read(locale, file)]));
    expect(site.ui.openingFrom, locale).toBeTruthy();
    expect(content.program.items, locale).toEqual(expect.any(Array)); expect(content.performers.items, locale).toEqual(expect.any(Array));
  }
});

test("@data workshop content exists and is translated in every supported locale", () => {
  const workshopTitles = new Set<string>();
  for (const locale of locales) {
    const expected = read(locale, "workshops");
    expect(expected.items, locale).toEqual(expect.any(Array));
    expect(expected.items.length, locale).toBeGreaterThan(0);
    expect(expected.items.map((item: any) => item.id), locale).toEqual(read("sk", "workshops").items.map((item: any) => item.id));
    expect(expected.items.map((item: any) => item.slug), locale).toEqual(read("sk", "workshops").items.map((item: any) => item.slug));
    workshopTitles.add(expected.items.find((item: any) => item.id === "japoncina")?.title);
  }
  expect(workshopTitles.size).toBe(locales.length);
});
