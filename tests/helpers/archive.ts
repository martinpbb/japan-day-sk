import fs from "node:fs";
import path from "node:path";

export const archiveLocales = ["sk", "en", "de", "es", "ja"] as const;
export const archiveRoot = "/archiv/2026";
export const sections = ["o-podujati", "program", "ucinkujuci", "workshopy", "gastronomia", "vystavovatelia", "astronomia", "pre-deti", "prakticke-informacie", "galeria"];
export const localized = (locale: string, route: string) => `${locale === "sk" ? "" : `/${locale}`}${route.replace(/\/$/, "")}/`;
export function readArchiveContent(locale: string) {
  const read = (name: string) => JSON.parse(fs.readFileSync(path.resolve(`src/data/locales/${locale}/${name}.json`), "utf8"));
  return { site: read("site"), seo: read("seo"), performers: read("performers"), exhibitors: read("exhibitors"), workshops: read("workshops"), program: read("program"), astronomy: read("astronomy"), children: read("children") };
}
export function expectedArchiveRoutes(locale: string) {
  const content = readArchiveContent(locale);
  return [archiveRoot, ...sections.map(section => `${archiveRoot}/${section}`),
    ...content.performers.items.map((item: { id: string }) => `${archiveRoot}/ucinkujuci/${item.id}`),
    ...content.exhibitors.items.filter((item: { detail?: unknown }) => item.detail).map((item: { id: string }) => `${archiveRoot}/vystavovatelia/${item.id}`),
    ...content.workshops.items.map((item: { id: string; slug?: string }) => `${archiveRoot}/workshopy/${item.slug || item.id}`)
  ] as string[];
}
