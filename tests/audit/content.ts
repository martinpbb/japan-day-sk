import fs from 'node:fs';
import path from 'node:path';
import { localeCodes, prefixFor, type Locale } from '../helpers/locales';
import { buildArchiveRoutes, legacyArchiveTarget } from '../../src/lib/archiveRoutes.js';
export { localeCodes, prefixFor };
export const read = (locale: Locale, name: string) => JSON.parse(fs.readFileSync(path.resolve('src/data/locales', locale, `${name}.json`), 'utf8'));
export const publicRoutes = (locale: Locale) => {
  const content = Object.fromEntries(['seo', 'performers', 'workshops', 'exhibitors'].map(name => [name, read(locale, name)]));
  const archive = buildArchiveRoutes(content);
  return [...new Set<string>([...Object.keys(content.seo.routes), ...Object.keys(archive)])].filter(route => !legacyArchiveTarget(route, archive));
};
export const routePath = (locale: Locale, route: string) => prefixFor(locale, route).replace(/\/$/, '') + '/';
