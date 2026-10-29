import React, { useCallback, useEffect, useMemo, useState } from "react";
import { defaultLocale, getLocaleContent, getLocaleSite, localeDocumentLanguages, supportedLocales } from "../data/content.js";
import { addLocalePrefix, getLocaleFromPath } from "./i18nPaths.js";
import { I18nContext } from "./i18nContext.js";

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => getLocaleFromPath(window.location.pathname));

  useEffect(() => {
    const syncLocaleFromUrl = () => setLocaleState(getLocaleFromPath(window.location.pathname));
    window.addEventListener("popstate", syncLocaleFromUrl);
    return () => window.removeEventListener("popstate", syncLocaleFromUrl);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeDocumentLanguages[locale] || localeDocumentLanguages[defaultLocale];
  }, [locale]);

  const setLocale = useCallback((nextLocale) => {
    const targetLocale = supportedLocales.includes(nextLocale) ? nextLocale : defaultLocale;
    const nextPath = addLocalePrefix(window.location.pathname, targetLocale);
    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;

    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.pushState({}, "", nextUrl);
    }
    setLocaleState(targetLocale);
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale,
    site: getLocaleSite(locale),
    content: getLocaleContent(locale),
    locales: supportedLocales
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
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
