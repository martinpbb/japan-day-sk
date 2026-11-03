import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { localeCodes } from "../helpers/locales";
import { routes } from "../helpers/routes";
import { readFileSync } from "node:fs";
test("@data static output contains generated route documents", () => {
  const dist = path.resolve(process.cwd(), "dist"); test.skip(!fs.existsSync(dist), "Run npm run build first");
  for (const locale of localeCodes) for (const route of routes) {
    const prefix = locale === "sk" ? "" : `${locale}/`;
    const relative = route === "/" ? `${prefix}index.html` : `${prefix}${route.slice(1)}/index.html`;
    expect(fs.existsSync(path.join(dist, relative)), relative).toBeTruthy();
  }
});

test("@data public admin shells are noindex and contain no private registration data", () => {
  const dist = path.resolve(process.cwd(), "dist");
  test.skip(!fs.existsSync(dist), "Run npm run build first");
  const workshops: { items: { id: string; slug?: string; sessions?: { id: string }[] }[] } = JSON.parse(readFileSync(path.resolve("src/data/locales/sk/workshops.json"), "utf8"));
  const workshop = workshops.items.find((item) => item.id && item.sessions?.length);
  if (!workshop?.sessions?.length) throw new Error("Expected workshop data with at least one session.");
  const sessionId = workshop.sessions[0].id;
  const adminPaths = [
    "admin/index.html",
    "admin/workshops/index.html",
    `admin/workshops/${workshop.slug || workshop.id}/index.html`,
    `admin/sessions/${sessionId}/index.html`,
  ];
  for (const relative of adminPaths) {
    const html = readFileSync(path.join(dist, relative), "utf8");
    expect(html, relative).toMatch(/<meta name="robots" content="noindex, nofollow"\s*\/?\s*>/i);
    expect(html, relative).not.toMatch(/attendee@example\.com|registration_access_token_hash|registration_access=|first_name|last_name/i);
  }
});
