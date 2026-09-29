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
export default function Exhibitors() { const { site, content } = useI18n(); const route = content.seo.routes["/vystavovatelia"]; return <Section id="vystavovatele" kicker={route.breadcrumb} title={route.h1} className="sectionTint">{content.exhibitors.items.length ? <div className="exhibitorGrid">{content.exhibitors.items.map((item) => <article className="exhibitorCard" key={item.id || item.name}><div className={`exhibitorMedia exhibitorMedia--${item.imageMode || "photo"}`}><ImageWithFallback src={item.image} alt={item.alt || item.name} autoFit imageFit={item.imageFit} className="exhibitorImage" style={{ objectPosition: item.imagePosition || undefined, transform: item.imageScale ? `scale(${item.imageScale})` : undefined }} /></div><div><h3>{item.name}</h3><p>{item.description}</p>{item.url ? <a className="textLink" href={item.url} target="_blank" rel="noreferrer">{site.ui.socialLinks}</a> : null}</div></article>)}</div> : <div className="emptyState"><strong>{site.ui.exhibitorListPending}</strong><p>{content.exhibitors.intro}</p></div>}</Section>; }
