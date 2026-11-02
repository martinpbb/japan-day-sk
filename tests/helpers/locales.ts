export const locales = {
  sk: { prefix: "/", lang: "sk", hreflang: "sk", label: "Slovenčina" },
  en: { prefix: "/en/", lang: "en", hreflang: "en", label: "English" },
  de: { prefix: "/de/", lang: "de", hreflang: "de", label: "Deutsch" },
  es: { prefix: "/es/", lang: "es", hreflang: "es", label: "Español" },
  ja: { prefix: "/ja/", lang: "ja", hreflang: "ja", label: "日本語" },
} as const;

export type Locale = keyof typeof locales;
export const localeCodes = Object.keys(locales) as Locale[];
export const prefixFor = (locale: Locale, route = "/") => {
  const suffix = route === "/" ? "" : route;
  return locale === "sk" ? `${suffix || "/"}` : `${locales[locale].prefix.slice(0, -1)}${suffix || "/"}`;
};
