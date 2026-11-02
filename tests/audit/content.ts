import fs from 'node:fs';
import path from 'node:path';
import { localeCodes, prefixFor, type Locale } from '../helpers/locales';
export { localeCodes, prefixFor };
export const read = (locale: Locale, name: string) => JSON.parse(fs.readFileSync(path.resolve('src/data/locales', locale, `${name}.json`), 'utf8'));
export const publicRoutes = (locale: Locale) => [...new Set<string>([
  ...Object.keys(read(locale, 'seo').routes),
  ...read(locale, 'performers').items.map((p: any) => `/ucinkujuci/${p.id}`),
  ...read(locale, 'workshops').items.map((p: any) => `/workshopy/${p.slug}`),
  ...read(locale, 'exhibitors').items.filter((p: any) => p.detail).map((p: any) => `/vystavovatelia/${p.id}`),
])];
export const routePath = (locale: Locale, route: string) => prefixFor(locale, route).replace(/\/$/, '') + '/';
