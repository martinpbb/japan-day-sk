/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import Section from "./Section.jsx";
import ImageWithFallback from "./ImageWithFallback.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
export default function Exhibitors() {
  const { locale, site, content } = useI18n();
  const route = content.seo.routes["/vystavovatelia"];

  const renderCard = (item) => {
    const website = item.url || item.website || item.link;
    let externalWebsite = null;
    try {
      const parsedWebsite = website ? new URL(website) : null;
      externalWebsite = parsedWebsite && ["http:", "https:"].includes(parsedWebsite.protocol) ? website : null;
    } catch {
      externalWebsite = null;
    }

    const card = <>
      <div className={`exhibitorMedia exhibitorMedia--${item.imageMode || "photo"}`}>
        <ImageWithFallback src={item.image} alt={item.alt || item.name} autoFit imageFit={item.imageFit} className="exhibitorImage" style={{ objectPosition: item.imagePosition || undefined, transform: item.imageScale ? `scale(${item.imageScale})` : undefined }} />
      </div>
      <div>
        <h3>{item.name}</h3>
        <p>{item.short || item.description}</p>
      </div>
    </>;

    return item.detail
      ? <a className="exhibitorCard exhibitorCardLink" href={addLocalePrefix(`/vystavovatelia/${item.id}`, locale)} key={item.id}>{card}</a>
      : externalWebsite
      ? <a className="exhibitorCard exhibitorCardLink" href={externalWebsite} target="_blank" rel="noopener noreferrer" key={item.id || item.name}>{card}</a>
      : <article className="exhibitorCard" key={item.id || item.name}>{card}</article>;
  };

  return <Section id="vystavovatelia" kicker={route.breadcrumb} title={route.h1} className="sectionTint">
    {content.exhibitors.items.length ? <div className="exhibitorGrid">{content.exhibitors.items.map(renderCard)}</div> : <div className="emptyState"><strong>{site.ui.exhibitorListPending}</strong><p>{content.exhibitors.intro}</p></div>}
  </Section>;
}
