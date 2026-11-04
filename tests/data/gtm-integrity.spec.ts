import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function generatedHtmlFiles() {
  const dist = path.resolve(process.cwd(), "dist");
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.name === "index.html") files.push(entryPath);
    }
  };
  visit(dist);
  return files;
}

test("@data generated HTML contains exactly one GA4 and GTM integration", () => {
  const htmlFiles = generatedHtmlFiles();
  expect(htmlFiles.length).toBeGreaterThan(0);

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const isAdminShell = path.relative(path.resolve(process.cwd(), "dist"), file).split(path.sep)[0] === "admin";
    if (isAdminShell) {
      expect(html).not.toContain("googletagmanager.com/gtag/js");
      expect(html).not.toContain("googletagmanager.com/gtm.js");
      continue;
    }
    expect((html.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-80MZ8NGTCN/g) || [])).toHaveLength(1);
    expect((html.match(/gtag\('config', 'G-80MZ8NGTCN'\)/g) || [])).toHaveLength(1);
    expect((html.match(/gtag\('consent', 'default'/g) || [])).toHaveLength(1);
    const defaultsIndex = html.indexOf("gtag('consent', 'default'");
    const gtmIndex = html.indexOf("gtm.start");
    const gaIndex = html.indexOf("gtag('config', 'G-80MZ8NGTCN')");
    expect(defaultsIndex).toBeGreaterThanOrEqual(0);
    expect(defaultsIndex).toBeLessThan(gtmIndex);
    expect(defaultsIndex).toBeLessThan(gaIndex);
    expect(html).toContain("japanday_sk_cookie_consent");
    expect((html.match(/https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-MGF62FC3/g) || [])).toHaveLength(1);
    expect((html.match(/event: 'gtm\.js'/g) || [])).toHaveLength(1);
    expect((html.match(/<noscript>[\s\S]*?GTM-MGF62FC3[\s\S]*?<\/noscript>/g) || [])).toHaveLength(1);
  }
});

test("@data source shell retains one consent-gated GA4 and GTM integration", () => {
  const html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
  expect((html.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-80MZ8NGTCN/g) || [])).toHaveLength(1);
  expect((html.match(/gtag\('config', 'G-80MZ8NGTCN'\)/g) || [])).toHaveLength(1);
  expect((html.match(/gtag\('consent', 'default'/g) || [])).toHaveLength(1);
  expect(html.indexOf("gtag('consent', 'default'")).toBeLessThan(html.indexOf("gtag('config', 'G-80MZ8NGTCN')"));
  expect((html.match(/https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-MGF62FC3/g) || [])).toHaveLength(1);
});
