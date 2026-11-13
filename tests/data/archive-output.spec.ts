import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { archiveLocales, archiveRoot, expectedArchiveRoutes, localized, readArchiveContent } from "../helpers/archive";
import { execFileSync } from "node:child_process";

for (const locale of archiveLocales) {
  test(`@archive @data @seo ${locale} generated metadata, alternates, sitemap and historical data`, () => {
    const content = readArchiveContent(locale);
    const sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
    for (const route of expectedArchiveRoutes(locale)) {
      const publicPath = localized(locale, route);
      const html = fs.readFileSync(path.join("dist", publicPath, "index.html"), "utf8");
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(`<link rel="canonical" href="https://japanday.sk${publicPath}"`);
      expect(html).toContain('content="index, follow"');
      expect(sitemap).toContain(`<loc>https://japanday.sk${publicPath}</loc>`);
      expect([...html.matchAll(/rel="alternate"/g)]).toHaveLength(6);
      for (const alternate of archiveLocales) {
        const target = localized(alternate, route);
        expect(html).toContain(`hreflang="${alternate}" href="https://japanday.sk${target}"`);
        expect(fs.existsSync(path.join("dist", target, "index.html"))).toBe(true);
      }
      const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)].map(match => JSON.parse(match[1]));
      expect(schemas.some(schema => schema["@type"] === "Event")).toBe(false);
      const breadcrumb = schemas.find(schema => schema["@type"] === "BreadcrumbList");
      expect(breadcrumb.itemListElement.at(-1).item).toBe(`https://japanday.sk${publicPath}`);
      for (const item of breadcrumb.itemListElement) {
        expect(fs.existsSync(path.join("dist", new URL(item.item).pathname, "index.html"))).toBe(true);
        if (locale !== "sk") expect(new URL(item.item).pathname).toMatch(new RegExp(`^/${locale}/`));
      }
    }
    // New localized copy must not inherit the previously audited '?' corruption.
    expect(JSON.stringify(content.site.archive)).not.toMatch(/\?/);
    expect(JSON.stringify(content.children.competition.archive)).not.toMatch(/\?/);
    expect(content.children.archiveIntro).not.toMatch(/\?/);
    if (locale === "ja") expect(content.site.archive.ended).toMatch(/[\u3040-\u30ff]/);
    for (const [route, metadata] of Object.entries(content.seo.routes)) {
      if (route.startsWith(archiveRoot)) expect(JSON.stringify(metadata)).not.toMatch(/\?/);
    }
    // Archive implementation is additive: no historical JSON content is changed.
    for (const name of ["site", "seo", "performers", "workshops", "exhibitors", "program", "gastronomy", "children", "astronomy", "gallery", "partners"]) {
      const original = JSON.parse(execFileSync("git", ["show", `HEAD:src/data/locales/${locale}/${name}.json`], { encoding: "utf8" }));
      const current = JSON.parse(fs.readFileSync(`src/data/locales/${locale}/${name}.json`, "utf8"));
      for (const snapshot of [original, current]) {
        if (name === "site") delete snapshot.archive;
        if (name === "seo") for (const key of Object.keys(snapshot.routes)) if (key.startsWith(archiveRoot)) delete snapshot.routes[key];
        if (name === "children") {
          delete snapshot.archiveIntro;
          delete snapshot.competition.archive;
        }
      }
      expect(current, `${locale}/${name} preserved`).toEqual(original);
    }
  });

  test(`@archive @data ${locale} static legacy redirects and GitHub Pages fallback documents`, () => {
    const redirects = fs.readFileSync("dist/_redirects", "utf8");
    const sitemap = fs.readFileSync("dist/sitemap.xml", "utf8");
    const routes = expectedArchiveRoutes(locale).filter(route => route !== archiveRoot && !route.endsWith("/astronomia"));
    routes.push(`${archiveRoot}/workshopy/japonstina`);
    for (const route of routes) {
      const source = route.endsWith("/japonstina") ? route : route.slice(archiveRoot.length);
      const target = localized(locale, route.replace(/\/japonstina$/, "/japoncina"));
      const oldPath = localized(locale, source);
      const html = fs.readFileSync(path.join("dist", oldPath, "index.html"), "utf8");
      expect(redirects).toContain(`${oldPath} ${target} 301`);
      expect(redirects).toContain(`${oldPath.slice(0, -1)} ${target} 301`);
      expect(html).toContain(`window.location.replace(${JSON.stringify(target)} + window.location.search + window.location.hash)`);
      expect(html).toContain(`http-equiv="refresh" content="0;url=${target}"`);
      expect(html).toContain('content="noindex, follow"');
      expect(sitemap).not.toContain(`<loc>https://japanday.sk${oldPath}</loc>`);
    }
  });
}

test("@archive @data 404 output is nonindexable and does not claim the homepage canonical", () => {
  const html = fs.readFileSync("dist/404.html", "utf8");
  expect(html).toContain('content="noindex, nofollow"');
  expect(html).not.toMatch(/rel="canonical"|rel="alternate"|application\/ld\+json/);
  const config = JSON.parse(fs.readFileSync("wrangler.web-staging.jsonc", "utf8"));
  expect(config.assets.not_found_handling).toBe("404-page");
});
