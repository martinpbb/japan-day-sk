export function buildWorkshopRoute(workshop, seo) {
  const catalog = seo.routes["/workshopy"];
  return {
    title: `${workshop.title} | ${catalog.breadcrumb} | ${seo.siteName}`,
    description: workshop.short || workshop.description || catalog.description,
    h1: workshop.title,
    intro: workshop.short || "",
    breadcrumb: workshop.title,
    breadcrumbParent: { name: catalog.breadcrumb, path: "/workshopy" },
    schema: ["breadcrumb"],
  };
}
