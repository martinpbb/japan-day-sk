import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { archiveBase, archiveSections } from "../lib/archiveRoutes.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function ArchiveNavigation() {
  const { locale, site } = useI18n();
  return <Section id="archive-sections" title={site.archive.navigation} className="sectionTint">
    <nav className="featureGrid archiveGrid" aria-label={site.archive.navigation}>
      {archiveSections.map(section => {
        const path = `${archiveBase}${section}`;
        const card = site.archive.cards[section];
        return <a key={path} className="featureCard featureCardLink" href={addLocalePrefix(`${path}/`, locale)}>
          <h3>{card.title}</h3><p>{card.description}</p>
        </a>;
      })}
    </nav>
  </Section>;
}
