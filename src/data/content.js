import skSite from "./locales/sk/site.json";
import skSeo from "./locales/sk/seo.json";
import skProgram from "./locales/sk/program.json";
import skPerformers from "./locales/sk/performers.json";
import skGastronomy from "./locales/sk/gastronomy.json";
import skChildren from "./locales/sk/children.json";
import skAstronomy from "./locales/sk/astronomy.json";
import skExhibitors from "./locales/sk/exhibitors.json";
import skWorkshops from "./locales/sk/workshops.json";
import skGallery from "./locales/sk/gallery.json";
import skPartners from "./locales/sk/partners.json";
import enSite from "./locales/en/site.json";
import enSeo from "./locales/en/seo.json";
import enProgram from "./locales/en/program.json";
import enPerformers from "./locales/en/performers.json";
import enGastronomy from "./locales/en/gastronomy.json";
import enChildren from "./locales/en/children.json";
import enAstronomy from "./locales/en/astronomy.json";
import enExhibitors from "./locales/en/exhibitors.json";
import enWorkshops from "./locales/en/workshops.json";
import enGallery from "./locales/en/gallery.json";
import enPartners from "./locales/en/partners.json";
import deSite from "./locales/de/site.json";
import deSeo from "./locales/de/seo.json";
import deProgram from "./locales/de/program.json";
import dePerformers from "./locales/de/performers.json";
import deGastronomy from "./locales/de/gastronomy.json";
import deChildren from "./locales/de/children.json";
import deAstronomy from "./locales/de/astronomy.json";
import deExhibitors from "./locales/de/exhibitors.json";
import deWorkshops from "./locales/de/workshops.json";
import deGallery from "./locales/de/gallery.json";
import dePartners from "./locales/de/partners.json";
import esSite from "./locales/es/site.json";
import esSeo from "./locales/es/seo.json";
import esProgram from "./locales/es/program.json";
import esPerformers from "./locales/es/performers.json";
import esGastronomy from "./locales/es/gastronomy.json";
import esChildren from "./locales/es/children.json";
import esAstronomy from "./locales/es/astronomy.json";
import esExhibitors from "./locales/es/exhibitors.json";
import esWorkshops from "./locales/es/workshops.json";
import esGallery from "./locales/es/gallery.json";
import esPartners from "./locales/es/partners.json";
import jaSite from "./locales/ja/site.json";
import jaSeo from "./locales/ja/seo.json";
import jaProgram from "./locales/ja/program.json";
import jaPerformers from "./locales/ja/performers.json";
import jaGastronomy from "./locales/ja/gastronomy.json";
import jaChildren from "./locales/ja/children.json";
import jaAstronomy from "./locales/ja/astronomy.json";
import jaExhibitors from "./locales/ja/exhibitors.json";
import jaWorkshops from "./locales/ja/workshops.json";
import jaGallery from "./locales/ja/gallery.json";
import jaPartners from "./locales/ja/partners.json";

export const defaultLocale = "sk";
export const supportedLocales = ["sk", "en", "de", "es", "ja"];
export const localeDocumentLanguages = {
  sk: "sk",
  en: "en",
  de: "de",
  es: "es",
  ja: "ja",
};

const localeContent = {
  sk: { site: skSite, seo: skSeo, program: skProgram, performers: skPerformers, performerPromotion: skPerformers.performerPromotion, gastronomy: skGastronomy, children: skChildren, astronomy: skAstronomy, exhibitors: skExhibitors, workshops: skWorkshops, gallery: skGallery, partners: skPartners },
  en: { site: enSite, seo: enSeo, program: enProgram, performers: enPerformers, performerPromotion: enPerformers.performerPromotion, gastronomy: enGastronomy, children: enChildren, astronomy: enAstronomy, exhibitors: enExhibitors, workshops: enWorkshops, gallery: enGallery, partners: enPartners },
  de: { site: deSite, seo: deSeo, program: deProgram, performers: dePerformers, performerPromotion: dePerformers.performerPromotion, gastronomy: deGastronomy, children: deChildren, astronomy: deAstronomy, exhibitors: deExhibitors, workshops: deWorkshops, gallery: deGallery, partners: dePartners },
  es: { site: esSite, seo: esSeo, program: esProgram, performers: esPerformers, performerPromotion: esPerformers.performerPromotion, gastronomy: esGastronomy, children: esChildren, astronomy: esAstronomy, exhibitors: esExhibitors, workshops: esWorkshops, gallery: esGallery, partners: esPartners },
  ja: { site: jaSite, seo: jaSeo, program: jaProgram, performers: jaPerformers, performerPromotion: jaPerformers.performerPromotion, gastronomy: jaGastronomy, children: jaChildren, astronomy: jaAstronomy, exhibitors: jaExhibitors, workshops: jaWorkshops, gallery: jaGallery, partners: jaPartners },
};

export function getLocaleContent(locale) {
  return localeContent[locale] || localeContent[defaultLocale];
}

export function getLocaleSite(locale) {
  return getLocaleContent(locale).site;
}
