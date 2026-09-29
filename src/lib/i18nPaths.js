import { defaultLocale, supportedLocales } from "../data/content.js";

const prefixedLocales = supportedLocales.filter((locale) => locale !== defaultLocale);
const localePrefixPattern = new RegExp(`^/(${prefixedLocales.join("|")})(?=/|$)`);

export function getLocaleFromPath(pathname) {
  const match = (pathname || "/").match(localePrefixPattern);
  return match ? match[1] : defaultLocale;
}

export function stripLocalePrefix(pathname) {
  const path = pathname || "/";
  const stripped = path.replace(localePrefixPattern, "");
  return stripped || "/";
}

export function addLocalePrefix(pathname, locale) {
  const path = stripLocalePrefix(pathname);
  const targetLocale = supportedLocales.includes(locale) ? locale : defaultLocale;

  if (targetLocale === defaultLocale) return path;
  return path === "/" ? `/${targetLocale}/` : `/${targetLocale}${path}`;
}
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
