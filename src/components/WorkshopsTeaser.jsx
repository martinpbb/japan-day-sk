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
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { workshopLecturers, workshopPrice } from "../lib/workshops.js";

const featuredWorkshopIds = ["shodo", "origami", "japoncina", "tvorba-kombiku", "cajova-degustacia", "tsumami-zaiku"];

export default function WorkshopsTeaser() {
  const { content, locale } = useI18n();
  const workshops = content.workshops?.items || [];
  const lecturers = content.performers.items;
  const featured = featuredWorkshopIds
    .map((id) => workshops.find((workshop) => workshop.id === id))
    .filter(Boolean);

  return (
    <Section id="workshopy-teaser" kicker="Workshopy" title="Vyskúšajte si Japonsko na vlastnej koži" className="sectionTint">
      <p className="workshopsTeaserIntro">Počas Japonského dňa si budete môcť vyskúšať tradičné japonské umenie, jazyk, hry aj čaj. Pripravujeme praktické workshopy pre deti aj dospelých.</p>
      <div className="workshopsTeaserGrid">
        {featured.map((workshop) => {
          const people = workshopLecturers(workshop, lecturers);
          return <a className="performerCard performerCardLink workshopsTeaserCard" href={addLocalePrefix(`/workshopy/${workshop.slug || workshop.id}`, locale)} key={workshop.id}>
            <div className="performerContent">
              {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
              <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
              <p className="shortText">{workshop.short || workshop.description}</p>
              <dl className="workshopFacts">
                {people.length ? <div><dt>{people.length > 1 ? "Lektori" : "Lektor"}</dt><dd>{people.map((person) => person.name).join(", ")}</dd></div> : null}
                <div><dt>Cena</dt><dd>{workshopPrice(workshop)}</dd></div>
                <div><dt>Termín</dt><dd>{workshop.sessions?.length ? `${workshop.sessions.length} ${workshop.sessions.length === 1 ? "termín" : workshop.sessions.length < 5 ? "termíny" : "termínov"}` : "Termín bude doplnený"}</dd></div>
              </dl>
            </div>
          </a>;
        })}
      </div>
      <a className="workshopsTeaserCta" href={addLocalePrefix("/workshopy", locale)}>Pozrieť všetky workshopy <span aria-hidden="true">→</span></a>
    </Section>
  );
}
