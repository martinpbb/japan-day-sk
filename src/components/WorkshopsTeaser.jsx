import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { formatDuration, lecturerRoleLabel, workshopLecturers, workshopPrice } from "../lib/workshops.js";

const featuredWorkshopIds = ["shodo", "origami", "japoncina", "tvorba-kombiku", "cajova-degustacia", "tsumami-zaiku"];

export default function WorkshopsTeaser() {
  const { content, locale, site } = useI18n();
  const copy = site.ui.workshops;
  const workshops = content.workshops?.items || [];
  const lecturers = content.performers.items;
  const featured = featuredWorkshopIds
    .map((id) => workshops.find((workshop) => workshop.id === id))
    .filter(Boolean);

  return (
    <Section id="workshopy-teaser" kicker={copy.title} title="Vyskúšajte si Japonsko aj prakticky" className="sectionTint">
      <p className="workshopsTeaserIntro">Počas dňa budú prebiehať aj praktické workshopy japonskej kultúry, jazyka a čaju. Niektoré majú viac termínov a obmedzenú kapacitu.</p>
      <div className="workshopsTeaserGrid">
        {featured.map((workshop) => {
          const people = workshopLecturers(workshop, lecturers);
          const sessionCount = workshop.sessions?.length || 0;
          return (
            <a className="performerCard performerCardLink workshopsTeaserCard" href={addLocalePrefix(`/workshopy/${workshop.slug || workshop.id}`, locale)} key={workshop.id}>
              <div className="performerContent">
                {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
                <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
                <dl className="workshopFacts">
                  {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}</dt><dd>{people.map((person) => `${person.name}${person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}`).join(", ")}</dd></div> : null}
                  {workshop.durationMinutes ? <div><dt>{copy.duration}</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
                  <div><dt>{copy.price}</dt><dd>{workshopPrice(workshop, copy, locale)}</dd></div>
                  <div><dt>{copy.time}</dt><dd>{sessionCount ? `${sessionCount} ${copy.sessions}` : copy.sessionPending}</dd></div>
                </dl>
              </div>
            </a>
          );
        })}
      </div>
      <a className="workshopsTeaserCta" href={addLocalePrefix("/workshopy", locale)}>{copy.all} <span aria-hidden="true">→</span></a>
    </Section>
  );
}
