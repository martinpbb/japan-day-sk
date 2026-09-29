import skSite from "./locales/sk/site.json";
import skSeo from "./locales/sk/seo.json";
import skProgram from "./locales/sk/program.json";
import skPerformers from "./locales/sk/performers.json";
import skGastronomy from "./locales/sk/gastronomy.json";
import skChildren from "./locales/sk/children.json";
import skExhibitors from "./locales/sk/exhibitors.json";
import skGallery from "./locales/sk/gallery.json";
import skPartners from "./locales/sk/partners.json";
import enSite from "./locales/en/site.json";
import enSeo from "./locales/en/seo.json";
import enProgram from "./locales/en/program.json";
import enPerformers from "./locales/en/performers.json";
import enGastronomy from "./locales/en/gastronomy.json";
import enChildren from "./locales/en/children.json";
import enExhibitors from "./locales/en/exhibitors.json";
import enGallery from "./locales/en/gallery.json";
import enPartners from "./locales/en/partners.json";
import deSite from "./locales/de/site.json";
import deSeo from "./locales/de/seo.json";
import deProgram from "./locales/de/program.json";
import dePerformers from "./locales/de/performers.json";
import deGastronomy from "./locales/de/gastronomy.json";
import deChildren from "./locales/de/children.json";
import deExhibitors from "./locales/de/exhibitors.json";
import deGallery from "./locales/de/gallery.json";
import dePartners from "./locales/de/partners.json";
import esSite from "./locales/es/site.json";
import esSeo from "./locales/es/seo.json";
import esProgram from "./locales/es/program.json";
import esPerformers from "./locales/es/performers.json";
import esGastronomy from "./locales/es/gastronomy.json";
import esChildren from "./locales/es/children.json";
import esExhibitors from "./locales/es/exhibitors.json";
import esGallery from "./locales/es/gallery.json";
import esPartners from "./locales/es/partners.json";
import zhSite from "./locales/zh/site.json";
import zhSeo from "./locales/zh/seo.json";
import zhProgram from "./locales/zh/program.json";
import zhPerformers from "./locales/zh/performers.json";
import zhGastronomy from "./locales/zh/gastronomy.json";
import zhChildren from "./locales/zh/children.json";
import zhExhibitors from "./locales/zh/exhibitors.json";
import zhGallery from "./locales/zh/gallery.json";
import zhPartners from "./locales/zh/partners.json";
import viSite from "./locales/vi/site.json";
import viSeo from "./locales/vi/seo.json";
import viProgram from "./locales/vi/program.json";
import viPerformers from "./locales/vi/performers.json";
import viGastronomy from "./locales/vi/gastronomy.json";
import viChildren from "./locales/vi/children.json";
import viExhibitors from "./locales/vi/exhibitors.json";
import viGallery from "./locales/vi/gallery.json";
import viPartners from "./locales/vi/partners.json";

export const defaultLocale = "sk";
export const supportedLocales = ["sk", "en", "de", "es", "zh", "vi"];
export const localeDocumentLanguages = {
  sk: "sk",
  en: "en",
  de: "de",
  es: "es",
  zh: "zh-CN",
  vi: "vi",
};

const localeContent = {
  sk: { site: skSite, seo: skSeo, program: skProgram, performers: skPerformers, gastronomy: skGastronomy, children: skChildren, exhibitors: skExhibitors, gallery: skGallery, partners: skPartners },
  en: { site: enSite, seo: enSeo, program: enProgram, performers: enPerformers, gastronomy: enGastronomy, children: enChildren, exhibitors: enExhibitors, gallery: enGallery, partners: enPartners },
  de: { site: deSite, seo: deSeo, program: deProgram, performers: dePerformers, gastronomy: deGastronomy, children: deChildren, exhibitors: deExhibitors, gallery: deGallery, partners: dePartners },
  es: { site: esSite, seo: esSeo, program: esProgram, performers: esPerformers, gastronomy: esGastronomy, children: esChildren, exhibitors: esExhibitors, gallery: esGallery, partners: esPartners },
  zh: { site: zhSite, seo: zhSeo, program: zhProgram, performers: zhPerformers, gastronomy: zhGastronomy, children: zhChildren, exhibitors: zhExhibitors, gallery: zhGallery, partners: zhPartners },
  vi: { site: viSite, seo: viSeo, program: viProgram, performers: viPerformers, gastronomy: viGastronomy, children: viChildren, exhibitors: viExhibitors, gallery: viGallery, partners: viPartners },
};

export function getLocaleContent(locale) {
  return localeContent[locale] || localeContent[defaultLocale];
}

export function getLocaleSite(locale) {
  return getLocaleContent(locale).site;
}
