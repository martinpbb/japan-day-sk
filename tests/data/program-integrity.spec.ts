import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src/data/locales");
const read = (locale: string) => JSON.parse(fs.readFileSync(path.join(root, locale, "program.json"), "utf8"));

test("@data programme is intentionally empty and structurally equivalent while draft", () => {
  const locales = ["sk", "en", "de", "es", "zh", "vi"];
  for (const locale of locales) {
    const data = read(locale);
    expect(data.status).toBe("draft");
    expect(data.items).toEqual([]);
    expect(data.note).toBeTruthy();
  }
});
