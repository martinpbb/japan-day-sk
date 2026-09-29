import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(process.cwd(), "src/data/locales");
const read = (locale: string, file: string) => JSON.parse(fs.readFileSync(path.join(root, locale, file), "utf8"));

test("@data performer IDs and programme references resolve in every locale", () => {
  const ids = read("sk", "performers.json").items.map((item: any) => item.id); expect(new Set(ids).size).toBe(ids.length);
  for (const locale of ["sk", "en", "de", "es", "zh", "vi"]) {
    const performers = read(locale, "performers.json").items; const performerIds = new Set(performers.map((item: any) => item.id));
    expect(performers.map((item: any) => item.id), locale).toEqual(ids);
    for (const item of read(locale, "program.json").items) if (item.performerId) expect(performerIds.has(item.performerId), `${locale}/${item.performerId}`).toBeTruthy();
  }
});
