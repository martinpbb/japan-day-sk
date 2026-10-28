export function buildExhibitorRoute(exhibitor, seo) {
  const exhibitorsRoute = seo.routes["/vystavovatelia"];
  const source = `${exhibitor.name} — ${exhibitor.detail?.lead || exhibitor.short || exhibitor.description || ""}`.replace(/\s+/g, " ").trim();
  return {
    title: `${exhibitor.name} | ${exhibitorsRoute.breadcrumb} | ${seo.siteName} 2026`,
    description: source.length > 160 ? `${source.slice(0, 157).trimEnd()}…` : source,
    h1: exhibitor.detail?.heading || exhibitor.name,
    intro: exhibitor.detail?.lead || exhibitor.short || exhibitor.description || "",
    breadcrumb: exhibitor.name,
    breadcrumbParent: { name: exhibitorsRoute.breadcrumb, path: "/vystavovatelia" },
    schema: ["breadcrumb"]
  };
}
