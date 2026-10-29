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
    expect((html.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ZPT8F3EETE/g) || [])).toHaveLength(1);
    expect((html.match(/gtag\('config', 'G-ZPT8F3EETE'\)/g) || [])).toHaveLength(1);
    expect((html.match(/<script>[\s\S]*?GTM-N5S65NK8[\s\S]*?<\/script>/g) || [])).toHaveLength(1);
    expect((html.match(/<noscript>[\s\S]*?GTM-N5S65NK8[\s\S]*?<\/noscript>/g) || [])).toHaveLength(1);
  }
});
