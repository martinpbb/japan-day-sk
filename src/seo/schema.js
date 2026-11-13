export function absoluteUrl(baseUrl, path = "/") {
  if (!path || path === "/") return `${baseUrl}/`;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

const schemaPerformers = [
  ["Person", "Noriko Komiyama"],
  ["PerformingGroup", "Gorin"],
  ["Person", "Martin Labudík"]
].map(([type, name]) => ({ "@type": type, name }));

const schemaLanguage = {
  "sk-SK": "sk",
  "en-GB": "en",
  "de-DE": "de",
  "es-ES": "es",
  "ja-JP": "ja"
};

export function buildFestivalSchema({ seo, site, path = "/" }) {
  const localePrefix = {
    "en-GB": "/en",
    "de-DE": "/de",
    "es-ES": "/es",
    "ja-JP": "/ja"
  }[seo.language] || "";
  const localizedPath = path === "/" && localePrefix ? `${localePrefix}/` : path;
  const image = seo.defaultImage ? absoluteUrl(seo.baseUrl, seo.defaultImage) : undefined;
  const startDate = site.event.openingTime
    ? `${site.event.dateISO}T${site.event.openingTime}:00+01:00`
    : site.event.dateISO;

  const event = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${absoluteUrl(seo.baseUrl, localizedPath)}#festival`,
    name: site.brand.name,
    alternateName: site.brand.shortName,
    description: seo.routes["/"].description,
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: schemaLanguage[seo.language] || seo.language,
    location: {
      "@type": "Place",
      name: site.event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: site.event.city,
        addressRegion: site.event.region,
        addressCountry: site.event.country
      }
    },
    url: absoluteUrl(seo.baseUrl, localizedPath),
    organizer: [
      {
        "@type": "Organization",
        name: "Rada mládeže Trenčianskeho kraja",
        url: "https://www.rmtnk.sk/"
      },
      {
        "@type": "Organization",
        name: "Mesto Považská Bystrica"
      },
      {
        "@type": "Organization",
        name: "Mladí pre Považskú"
      }
    ],
    performer: schemaPerformers,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(seo.baseUrl, localizedPath),
      price: 0,
      priceCurrency: site.event.currency,
      availability: "https://schema.org/InStock"
    }
  };

  if (site.event.closingTime) {
    event.endDate = `${site.event.dateISO}T${site.event.closingTime}:00+01:00`;
  }
  if (image) event.image = [image];
  return event;
}

export function buildOrganizationSchema({ seo }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${seo.baseUrl}/#organizer`,
    name: "Rada mládeže Trenčianskeho kraja",
    url: "https://www.rmtnk.sk/"
  };
}

export function buildBreadcrumbSchema({ seo, path, route }) {
  const prefix = { "en-GB": "/en", "de-DE": "/de", "es-ES": "/es", "ja-JP": "/ja" }[seo.language] || "";
  const breadcrumbUrl = value => {
    const localized = prefix && value !== prefix && !value.startsWith(`${prefix}/`) ? `${prefix}${value}` : value;
    return absoluteUrl(seo.baseUrl, localized.endsWith("/") ? localized : `${localized}/`);
  };
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: seo.siteName,
      item: breadcrumbUrl("/")
    }
  ];

  if (path.includes("/archiv/2026/")) itemListElement.push({
    "@type": "ListItem", position: 2,
    name: seo.routes["/archiv/2026"].breadcrumb,
    item: breadcrumbUrl("/archiv/2026")
  });

  if (route.breadcrumbParent) {
    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      name: route.breadcrumbParent.name,
      item: breadcrumbUrl(route.breadcrumbParent.path)
    });
  }

  itemListElement.push({
    "@type": "ListItem",
    position: itemListElement.length + 1,
    name: route.breadcrumb || route.h1,
    item: breadcrumbUrl(path)
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  };
}

export function buildSchemas({ seo, site, path, route }) {
  const requested = new Set(route.schema || []);
  const schemas = [];
  if (requested.has("festival")) schemas.push(buildFestivalSchema({ seo, site, path }));
  if (requested.has("organization")) schemas.push(buildOrganizationSchema({ seo }));
  if (requested.has("breadcrumb") && path !== "/") schemas.push(buildBreadcrumbSchema({ seo, path, route }));
  return schemas;
}
