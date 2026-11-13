/** 
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Program from "./components/Program.jsx";
import Astronomy from "./components/Astronomy.jsx";
import Performers from "./components/Performers.jsx";
import PerformerDetail from "./components/PerformerDetail.jsx";
import Gastronomy from "./components/Gastronomy.jsx";
import Children from "./components/Children.jsx";
import WorkshopsTeaser from "./components/WorkshopsTeaser.jsx";
import ExhibitorDetail from "./components/ExhibitorDetail.jsx";
import Exhibitors from "./components/Exhibitors.jsx";
import Workshops from "./components/Workshops.jsx";
import WorkshopDetail from "./components/WorkshopDetail.jsx";
import VideoSection from "./components/VideoSection.jsx";
import Gallery from "./components/Gallery.jsx";
import PracticalInfo from "./components/PracticalInfo.jsx";
import SpeechContestPromotion from "./components/SpeechContestPromotion.jsx";
import Contact from "./components/Contact.jsx";
import Partners from "./components/Partners.jsx";
import Footer from "./components/Footer.jsx";
import PageIntro from "./components/PageIntro.jsx";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import SmartsuppChat from "./components/SmartsuppChat.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import SEO from "./seo/SEO.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { buildPerformerRoute } from "./seo/performerRoute.js";
import { buildExhibitorRoute } from "./seo/exhibitorRoute.js";
import { buildWorkshopRoute } from "./seo/workshopRoute.js";
import { useI18n } from "./lib/useI18n.js";
import { stripLocalePrefix } from "./lib/i18nPaths.js";
import { addLocalePrefix } from "./lib/i18nPaths.js";
import { archiveBase, archiveContentPath, buildArchiveRoutes, legacyArchiveTarget } from "./lib/archiveRoutes.js";
import { EventArchiveContext } from "./lib/eventArchiveContext.js";
import ArchiveNavigation from "./components/ArchiveNavigation.jsx";
import ArchiveNotice from "./components/ArchiveNotice.jsx";

const pageComponents = {
  "/program": Program,
  "/ucinkujuci": Performers,
  "/gastronomia": Gastronomy,
  "/pre-deti": Children,
  "/vystavovatelia": Exhibitors,
  "/workshopy": Workshops,
  "/prakticke-informacie": PracticalInfo,
  "/galeria": Gallery,
  "/o-podujati": About,
  "/kontakt": Contact,
  "/astronomia": Astronomy
};

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function getPerformerFromPath(path, performers) {
  const match = path.match(/^\/ucinkujuci\/([^/]+)$/);
  if (!match) return null;
  let slug;
  try { slug = decodeURIComponent(match[1]); } catch { return null; }
  return performers.items.find((item) => item.id === slug) || null;
}

function getWorkshopFromPath(path, workshops) {
  const match = path.match(/^\/workshopy\/([^/]+)$/);
  if (!match) return null;
  let slug;
  try { slug = decodeURIComponent(match[1]); } catch { return null; }
  return workshops?.items.find((item) => (item.slug || item.id) === slug || (slug === "japonstina" && (item.slug || item.id) === "japoncina")) || null;
}

function HomePage({ archived = false }) {
  return (
    <main>
      <Hero />
      {archived ? <ArchiveNavigation /> : null}
      <About />
      <Program />
      <Astronomy />
      <Children compact />
      <WorkshopsTeaser />
      <Performers />
      <Gastronomy compact />
      <Exhibitors />
      <VideoSection />
      <PracticalInfo />
      <SpeechContestPromotion />
      <Partners />
    </main>
  );
}

function SubPage({ path, route }) {
  const Content = pageComponents[path];
  if (!Content) return null;
  return (
    <main>
      <Breadcrumbs current={route.breadcrumb || route.h1} />
      <PageIntro title={route.h1} intro={route.intro} />
      <Content includeWorkshopsTeaser={path === "/program"} />
    </main>
  );
}

function PerformerPage({ performer, route }) {
  return (
    <main>
      <Breadcrumbs current={route.breadcrumb} parent={route.breadcrumbParent} />
      <PageIntro title={route.h1} intro={route.intro} />
      <PerformerDetail performer={performer} />
    </main>
  );
}

function PublicApp() {
  const { content, locale, site } = useI18n();
  const { seo, performers, exhibitors, workshops } = content;
  const [pathname, setPathname] = useState(window.location.pathname);
  const requestedPath = normalizePath(stripLocalePrefix(pathname));
  const archiveRoutes = buildArchiveRoutes(content);
  const redirect = legacyArchiveTarget(requestedPath, archiveRoutes);
  const publicPath = redirect || requestedPath;
  const archived = publicPath === archiveBase || publicPath.startsWith(`${archiveBase}/`);
  const path = archived ? archiveContentPath(publicPath) : publicPath;
  const exhibitor = exhibitors.items.find((item) => item.detail && path === `/vystavovatelia/${item.id}`);
  const performer = getPerformerFromPath(path, performers);
  const workshopCatalog = path === "/workshopy";
  const workshop = getWorkshopFromPath(path, workshops);
  const workshopRoute = workshop ? buildWorkshopRoute(workshop, seo) : workshopCatalog ? seo.routes["/workshopy"] : null;
  const performerRoute = performer ? buildPerformerRoute(performer, seo) : null;
  const exhibitorRoute = exhibitor ? (seo.routes[path] || buildExhibitorRoute(exhibitor, seo)) : null;
  const isKnown = archived ? Boolean(archiveRoutes[publicPath]) : Boolean(workshopRoute || performerRoute || exhibitorRoute || seo.routes[path]);
  const route = (archived ? archiveRoutes[publicPath] : workshopRoute || performerRoute || exhibitorRoute || seo.routes[path]) || {
    title: site.archive.notFoundTitle, description: site.archive.notFoundDescription, schema: [], noindex: true
  };
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  useEffect(() => {
    if (redirect) {
      window.history.replaceState({}, "", `${addLocalePrefix(`${redirect}/`, locale)}${window.location.search}${window.location.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [redirect, locale]);

  useEffect(() => {
    if (window.location.hash) {
      let anchor;
      try { anchor = decodeURIComponent(window.location.hash.slice(1)); } catch { anchor = ""; }
      window.requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [path]);

  return (
    <EventArchiveContext.Provider value={archived}>
      <SmartsuppChat />
      <SEO path={publicPath} route={route} />
      <Header />
      {archived && isKnown ? <ArchiveNotice /> : null}
      {!isKnown ? (
        <main><PageIntro title={site.archive.notFoundTitle} intro={site.archive.notFoundDescription} />
          <div className="container"><a href={addLocalePrefix(`${archiveBase}/`, locale)}>{site.archive.browse}</a></div>
        </main>
      ) : workshop ? (
        <main>
          <Breadcrumbs current={route.breadcrumb} parent={route.breadcrumbParent} />
          <PageIntro title={route.h1} intro={route.intro} />
          <WorkshopDetail workshop={workshop} />
        </main>
      ) : exhibitor ? (
        <main>
          <Breadcrumbs current={route.breadcrumb} parent={route.breadcrumbParent} />
          <ExhibitorDetail exhibitor={exhibitor} />
        </main>
      ) : performer ? (
        <PerformerPage performer={performer} route={route} />
      ) : path === "/" ? (
        <HomePage archived={archived} />
      ) : (
        <SubPage path={path} route={route} />
      )}
      <Footer onCookieSettings={() => setCookieSettingsOpen(true)} />
      <CookieConsent isOpen={cookieSettingsOpen} onClose={() => setCookieSettingsOpen(false)} />
    </EventArchiveContext.Provider>
  );
}

export default function App() {
  const adminPath = normalizePath(window.location.pathname);
  return adminPath === '/admin' || adminPath.startsWith('/admin/')
    ? <AdminDashboard path={adminPath} />
    : <PublicApp />;
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
