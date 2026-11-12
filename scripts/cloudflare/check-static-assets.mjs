/**
 * Validate the generated static site before a Cloudflare Static Assets deploy.
 * No network, Cloudflare credentials, or production data access is required.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
const exists = (filename) => fs.existsSync(path.join(dist, filename));
const read = (filename) => fs.readFileSync(path.join(dist, filename), 'utf8');
const fail = [];
const requireCheck = (condition, message) => { if (!condition) fail.push(message); };
const locales = ['', 'en/', 'de/', 'es/', 'ja/'];

requireCheck(exists('index.html'), 'Missing root dist/index.html');
requireCheck(exists('robots.txt'), 'Missing dist/robots.txt');
requireCheck(exists('sitemap.xml'), 'Missing dist/sitemap.xml');
for (const prefix of locales) {
  const pathname = `${prefix}index.html`;
  requireCheck(exists(pathname), `Missing localized homepage: ${pathname}`);
  if (exists(pathname)) {
    const html = read(pathname);
    const lang = prefix ? prefix.slice(0, -1) : 'sk';
    requireCheck(new RegExp(`<html[^>]*\\blang=["']${lang}["']`, 'i').test(html), `Wrong html[lang] in ${pathname}`);
    requireCheck(/rel=["']canonical["']/i.test(html), `Missing canonical in ${pathname}`);
    requireCheck(/rel=["']alternate["']/i.test(html), `Missing hreflang in ${pathname}`);
  }
}

if (exists('sitemap.xml')) {
  const xml = read('sitemap.xml');
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1]);
  requireCheck(urls.length > 0, 'Sitemap is empty');
  requireCheck(new Set(urls).size === urls.length, 'Duplicate URLs in sitemap');
  for (const raw of urls) {
    let url;
    try { url = new URL(raw); } catch { fail.push(`Invalid URL in sitemap: ${raw}`); continue; }
    requireCheck(url.origin === 'https://japanday.sk', `Unexpected sitemap origin: ${raw}`);
    requireCheck(url.pathname.endsWith('/'), `Missing trailing slash in sitemap: ${raw}`);
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '') + 'index.html';
    requireCheck(exists(relative), `No HTML for sitemap URL ${raw} (${relative})`);
    if (exists(relative)) {
      const html = read(relative);
      const expectedCanonical = url.href;
      requireCheck(html.includes(`rel="canonical" href="${expectedCanonical}"`), `Canonical mismatch: ${relative}`);
      requireCheck(/<meta[^>]+name="description"/i.test(html), `Missing description: ${relative}`);
    }
  }
  console.log(`Validated ${urls.length} sitemap URLs against generated HTML.`);
}

for (const relative of ['admin/index.html', 'admin/workshops/index.html']) {
  if (exists(relative)) requireCheck(/name=["']robots["'][^>]*noindex/i.test(read(relative)), `Admin page not noindex: ${relative}`);
}

if (fail.length) {
  for (const error of fail.slice(0, 25)) console.error(`FAIL: ${error}`);
  if (fail.length > 25) console.error(`... and ${fail.length - 25} additional failures`);
  process.exitCode = 1;
} else {
  assert.ok(true);
  console.log('Static Assets check passed: languages, canonical, hreflang, sitemap and admin noindex.');
}
