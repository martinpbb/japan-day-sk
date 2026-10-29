import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { localeCodes } from "../helpers/locales";
import { routes } from "../helpers/routes";
test("@data static output contains generated route documents", () => {
  const dist = path.resolve(process.cwd(), "dist"); test.skip(!fs.existsSync(dist), "Run npm run build first");
  for (const locale of localeCodes) for (const route of routes) {
    const prefix = locale === "sk" ? "" : `${locale}/`;
    const relative = route === "/" ? `${prefix}index.html` : `${prefix}${route.slice(1)}/index.html`;
    expect(fs.existsSync(path.join(dist, relative)), relative).toBeTruthy();
  }
});
