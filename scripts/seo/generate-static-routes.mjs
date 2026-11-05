import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, buildSchemas } from "../../src/seo/schema.js";
import { buildPerformerRoute } from "../../src/seo/performerRoute.js";
import { buildExhibitorRoute } from "../../src/seo/exhibitorRoute.js";
import { buildWorkshopRoute } from "../../src/seo/workshopRoute.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dist = path.join(root, "dist");
const baseHtml = await fs.readFile(path.join(dist, "index.html"), "utf8");

const locales = [
  { locale: "sk", prefix: "" },
  { locale: "en", prefix: "/en" },
  { locale: "de", prefix: "/de" },
  { locale: "es", prefix: "/es" },
  { locale: "ja", prefix: "/ja" }
];

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function publicUrl(baseUrl, routePath) {
  const url = absoluteUrl(baseUrl, routePath);
  return url.endsWith("/") ? url : `${url}/`;
}

function replaceTitle(html, title) {
  return html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
}

const gtmHead = `    <!-- Google Tag Manager -->
    <script>
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    </script>
    <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-MGF62FC3"></script>
    <!-- End Google Tag Manager -->`;

const gtmNoScript = `    <!-- Google Tag Manager (noscript) -->
    <noscript>
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=GTM-MGF62FC3"
        height="0"
        width="0"
        style="display:none;visibility:hidden"
      ></iframe>
    </noscript>
    <!-- End Google Tag Manager (noscript) -->`;

const ga4Head = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-80MZ8NGTCN"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', 'G-80MZ8NGTCN');
    </script>`;

function ensureGtm(html) {
  const withHead = html.includes("googletagmanager.com/gtm.js?id=GTM-MGF62FC3") ? html : html.replace(/<head>/i, `<head>\n${gtmHead}`);
  return withHead.includes('googletagmanager.com/ns.html?id=GTM-MGF62FC3')
    ? withHead
    : withHead.replace(/<body>/i, `<body>\n${gtmNoScript}`);
}

function ensureGa4(html) {
  const scriptCount = html.split("https://www.googletagmanager.com/gtag/js?id=G-80MZ8NGTCN").length - 1;
  const configCount = (html.match(/gtag\('config', 'G-80MZ8NGTCN'\)/g) || []).length;
  if (scriptCount === 1 && configCount === 1) return html;
  if (scriptCount > 1 || configCount > 1 || scriptCount !== configCount) {
    throw new Error("Expected exactly one complete GA4 integration in the route template.");
  }
  return html.replace(/<head>/i, `<head>\n${ga4Head}`);
}

function upsertMeta(html, attribute, key, content) {
  const regex = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return regex.test(html) ? html.replace(regex, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  const regex = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  return regex.test(html) ? html.replace(regex, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function addStructuredData(html, schemas) {
  const scripts = schemas.map((schema) => `    <script type="application/ld+json" data-japanday-schema="true">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`).join("\n");
  return scripts ? html.replace("</head>", `${scripts}\n  </head>`) : html;
}

function addHreflang(html, logicalPath, baseUrl) {
  const links = locales.map(({ locale, prefix }) => {
    const localizedPath = logicalPath === "/" ? `${prefix}/` || "/" : `${prefix}${logicalPath}`;
    return `    <link rel="alternate" hreflang="${locale}" href="${escapeHtml(publicUrl(baseUrl, localizedPath))}" />`;
  });
  links.push(`    <link rel="alternate" hreflang="x-default" href="${escapeHtml(publicUrl(baseUrl, logicalPath))}" />`);
  return html.replace("</head>", `${links.join("\n")}\n  </head>`);
}

function renderRoute({ locale, seo, site, logicalPath, publicPath, route }) {
  const canonical = publicUrl(seo.baseUrl, publicPath);
  const templateImage = logicalPath === "/" && publicPath === "/"
    ? baseHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
    : "";
  const imagePath = route.ogImage || (logicalPath === "/" ? "" : seo.defaultImage);
  const image = templateImage || (imagePath ? absoluteUrl(seo.baseUrl, imagePath) : "");
  let html = ensureGa4(ensureGtm(baseHtml));
  html = html.replace(/<html\b([^>]*)>/i, (_match, attributes) => `<html${attributes.replace(/\s+lang=["'][^"']*["']/i, "")} lang="${locale}">`);
  html = replaceTitle(html, route.title);
  html = upsertMeta(html, "name", "description", route.description);
  html = upsertMeta(html, "name", "robots", "index, follow");
  html = upsertMeta(html, "property", "og:title", route.title);
  html = upsertMeta(html, "property", "og:description", route.description);
  html = upsertMeta(html, "property", "og:url", canonical);
  html = upsertMeta(html, "property", "og:type", "website");
  html = upsertMeta(html, "property", "og:site_name", seo.siteName);
  html = upsertMeta(html, "property", "og:locale", seo.locale);
  html = upsertMeta(html, "name", "twitter:card", "summary_large_image");
  if (image) {
    html = upsertMeta(html, "property", "og:image", image);
    html = upsertMeta(html, "property", "og:image:width", String(route.ogImageWidth || 1200));
    html = upsertMeta(html, "property", "og:image:height", String(route.ogImageHeight || 1200));
    html = upsertMeta(html, "property", "og:image:type", "image/png");
    html = upsertMeta(html, "name", "twitter:image", image);
  }
  html = upsertCanonical(html, canonical);
  html = addStructuredData(html, buildSchemas({ seo, site, path: publicPath, route }));
  return addHreflang(html, logicalPath, seo.baseUrl);
}

const sitemapPaths = new Set();
const adminRoutePaths = new Set(["/admin/", "/admin/workshops/"]);
for (const { locale, contentLocale = locale, prefix } of locales) {
  const seo = JSON.parse((await fs.readFile(path.join(root, `src/data/locales/${contentLocale}/seo.json`), "utf8")).replace(/^\\uFEFF/, ""));
  const site = JSON.parse((await fs.readFile(path.join(root, `src/data/locales/${contentLocale}/site.json`), "utf8")).replace(/^\\uFEFF/, ""));
  const performers = JSON.parse((await fs.readFile(path.join(root, `src/data/locales/${contentLocale}/performers.json`), "utf8")).replace(/^\\uFEFF/, ""));
  const exhibitors = JSON.parse((await fs.readFile(path.join(root, `src/data/locales/${contentLocale}/exhibitors.json`), "utf8")).replace(/^\\uFEFF/, ""));
  const workshopsPath = path.join(root, `src/data/locales/${contentLocale}/workshops.json`);
  const workshops = JSON.parse((await fs.readFile(workshopsPath, "utf8")).replace(/^\\uFEFF/, ""));
  for (const workshop of workshops.items || []) {
    const id = workshop.slug || workshop.id;
    adminRoutePaths.add(`/admin/workshops/${id}/`);
    for (const session of workshop.sessions || []) if (session.id) adminRoutePaths.add(`/admin/sessions/${session.id}/`);
  }
  const performerRoutes = Object.fromEntries(performers.items.map((performer) => [
    `/ucinkujuci/${performer.id}`, buildPerformerRoute(performer, seo)
  ]));
  const exhibitorRoutes = Object.fromEntries((Array.isArray(exhibitors?.items) ? exhibitors.items : []).filter((item) => item.detail).map((item) => [
    `/vystavovatelia/${item.id}`, buildExhibitorRoute(item, seo)
  ]));
  const workshopRoutes = Object.fromEntries((Array.isArray(workshops?.items) ? workshops.items : []).map((workshop) => [
    `/workshopy/${workshop.slug || workshop.id}`, buildWorkshopRoute(workshop, seo)
  ]));
  if (workshops.items.some((workshop) => (workshop.slug || workshop.id) === "japoncina")) {
    workshopRoutes["/workshopy/japonstina"] = buildWorkshopRoute(workshops.items.find((workshop) => (workshop.slug || workshop.id) === "japoncina"), seo);
  }
  const routes = { ...seo.routes, ...performerRoutes, ...exhibitorRoutes, ...workshopRoutes };
  for (const [logicalPath, route] of Object.entries(routes)) {
    const publicPath = logicalPath === "/" ? `${prefix}/` || "/" : `${prefix}${logicalPath}`;
    const html = renderRoute({ locale, seo, site, logicalPath, publicPath, route });
    const targetDir = publicPath === "/" ? dist : path.join(dist, publicPath.slice(1));
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, "index.html"), html);
    sitemapPaths.add(publicPath);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...sitemapPaths].map((routePath) => `  <url><loc>${publicUrl("https://japanday.sk", routePath)}</loc></url>`).join("\n")}\n</urlset>\n`;
await fs.writeFile(path.join(dist, "sitemap.xml"), sitemap);
await fs.writeFile(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://japanday.sk/sitemap.xml\n");

const adminHtml = baseHtml
  .replace(/<title>.*?<\/title>/s, "<title>Workshop dashboard</title>")
  .replace(/<meta\s+name="description"[^>]*>/i, "")
  .replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<meta\s+(?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/gi, "")
  .replace(/<link\s+rel="canonical"[^>]*>/i, "")
  .replace(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^>]*><\/script>/g, "")
  .replace(/<script[^>]*>[\s\S]*?gtag\('config',[\s\S]*?<\/script>/g, "")
  .replace(/<script[^>]*>[\s\S]*?gtm\.js[\s\S]*?<\/script>/g, "")
  .replace(/<noscript>[\s\S]*?googletagmanager\.com\/ns\.html[\s\S]*?<\/noscript>/g, "");
// GitHub Pages serves a route's index.html only when the exact path exists.
// Keep every data-backed admin path materialized as a public, non-indexable shell.
for (const route of adminRoutePaths) {
  const target = path.join(dist, route.slice(1));
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, "index.html"), adminHtml);
}

console.log(`Generated ${sitemapPaths.size} localized SEO route documents, sitemap.xml and robots.txt.`);
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
