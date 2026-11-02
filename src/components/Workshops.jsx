import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { formatDuration, formatSession, lecturerRoleLabel, workshopPrice, workshopLecturers } from "../lib/workshops.js";

function WorkshopCard({ workshop, lecturers, locale, copy }) {
  const people = workshopLecturers(workshop, lecturers);
  return <a className="performerCard performerCardLink workshopCard" href={addLocalePrefix(`/workshopy/${workshop.slug || workshop.id}`, locale)}>
    {workshop.image ? <img className="workshopImage" src={workshop.image} alt="" loading="lazy" /> : null}
    <div className="performerContent">
      {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
      <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
      <p className="shortText">{workshop.short || workshop.description}</p>
      <dl className="workshopFacts">
        {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}</div>)}</dd></div> : null}
        {workshop.durationMinutes ? <div><dt>{copy.duration}</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
        <div><dt>{copy.price}</dt><dd>{workshopPrice(workshop, copy, locale)}</dd></div>
        <div><dt>{copy.time}</dt><dd>{workshop.sessions?.length ? workshop.sessions.map((session) => formatSession(session, workshop.durationMinutes, locale)).join(", ") : copy.sessionPending}</dd></div>
      </dl>
      <span className="workshopRegistrationState">{workshop.registrationOpen ? copy.registrationOpen : copy.registrationClosed}</span>
    </div>
  </a>;
}

export default function Workshops() {
  const { content, locale, site } = useI18n();
  const workshops = content.workshops?.items || [];
  const lecturers = content.performers.items;
  const copy = site.ui.workshops;
  return <Section kicker={copy.title} title={copy.title} className="sectionTint">
    <p className="infoNote workshopInfoNote">{copy.walkInNote}</p>
    <div className="workshopGrid">{workshops.map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} lecturers={lecturers} locale={locale} copy={copy} />)}</div>
  </Section>;
}
