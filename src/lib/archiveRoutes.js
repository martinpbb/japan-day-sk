import { buildPerformerRoute } from "../seo/performerRoute.js";
import { buildExhibitorRoute } from "../seo/exhibitorRoute.js";
import { buildWorkshopRoute } from "../seo/workshopRoute.js";

export const archiveBase = "/archiv/2026";
export const archiveSections = [
  "/o-podujati", "/program", "/ucinkujuci", "/workshopy",
  "/gastronomia", "/vystavovatelia", "/astronomia", "/pre-deti",
  "/prakticke-informacie", "/galeria"
];

// Keep anchors intact, including links to individual gastronomy entries.
export function archivePath(path) {
  const section = path.split(/[?#]/)[0].split("/")[1];
  return archiveSections.includes(`/${section}`) ? `${archiveBase}${path}` : path;
}

export function archiveContentPath(path) {
  return path === archiveBase ? "/" : path.slice(archiveBase.length);
}

export function buildArchiveRoutes({ seo, performers, exhibitors, workshops }) {
  const routes = Object.fromEntries(Object.entries(seo.routes).filter(([path]) => path.startsWith(`${archiveBase}/`) || path === archiveBase));
  const addDetail = (path, route) => {
    routes[archivePath(path)] = {
      ...route,
      title: `${route.title} | ${seo.routes[archiveBase].breadcrumb}`,
      breadcrumbParent: { ...route.breadcrumbParent, path: archivePath(route.breadcrumbParent.path) }
    };
  };
  for (const performer of performers.items) addDetail(`/ucinkujuci/${performer.id}`, buildPerformerRoute(performer, seo));
  for (const exhibitor of exhibitors.items.filter(item => item.detail)) addDetail(`/vystavovatelia/${exhibitor.id}`, buildExhibitorRoute(exhibitor, seo));
  for (const workshop of workshops.items) addDetail(`/workshopy/${workshop.slug || workshop.id}`, buildWorkshopRoute(workshop, seo));
  return routes;
}

export function legacyArchiveTarget(path, archiveRoutes) {
  const normalized = path.replace(/\/+$/, "") || "/";
  let decoded;
  try { decoded = decodeURIComponent(normalized); } catch { return null; }
  const corrected = decoded.replace(/^(\/workshopy|\/archiv\/2026\/workshopy)\/japonstina$/, "$1/japoncina");
  const target = archivePath(corrected);
  return target !== normalized && archiveRoutes[target] ? target : null;
}
