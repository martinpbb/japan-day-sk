/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import { ChevronRight } from "lucide-react";
import Section from "./Section.jsx";
import ImageWithFallback from "./ImageWithFallback.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function Performers() {
  const { locale, site, content } = useI18n();
  const page = content.seo.routes["/ucinkujuci"];
  return <Section id="ucinkujuci" kicker={page.sectionKicker} title={page.sectionTitle}>
    <div className="performerGrid">{content.performers.items.map((item) => <a className="performerCard performerCardLink" id={`host-${item.id}`} href={addLocalePrefix(`/ucinkujuci/${item.id}`, locale)} key={item.id} aria-label={site.ui.performersDetail.replace("{name}", item.name)}>
      <ImageWithFallback src={item.image} alt={item.name} className="performerImage" />
      <div className="performerContent"><div className="programMeta">{item.category}</div><div className="performerTitleRow"><h3>{item.name}</h3><ChevronRight size={20} aria-hidden="true" /></div><p className="shortText">{item.short}</p><span className="performerMore">{site.ui.showDetail}</span></div>
    </a>)}</div>
  </Section>;
}
