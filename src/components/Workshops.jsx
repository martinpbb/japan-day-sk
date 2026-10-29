import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { formatSession, workshopPrice } from "../lib/workshops.js";

function WorkshopCard({ workshop, lecturers, locale }) {
  const lecturer = workshop.lecturerId ? lecturers.get(workshop.lecturerId) : null;
  return <a className="performerCard performerCardLink workshopCard" href={addLocalePrefix(`/workshopy/${workshop.slug || workshop.id}`, locale)}>
    {workshop.image ? <img className="workshopImage" src={workshop.image} alt="" loading="lazy" /> : null}
    <div className="performerContent">
      {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
      <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
      <p className="shortText">{workshop.short || workshop.description}</p>
      <dl className="workshopFacts">
        {lecturer ? <div><dt>Lektor</dt><dd>{lecturer.name}</dd></div> : null}
        {workshop.durationMinutes ? <div><dt>Trvanie</dt><dd>{workshop.durationMinutes} min</dd></div> : null}
        <div><dt>Cena</dt><dd>{workshopPrice(workshop)}</dd></div>
        <div><dt>Termín</dt><dd>{workshop.sessions?.length ? workshop.sessions.map((session) => formatSession(session, workshop.durationMinutes)).join(", ") : "Termín bude doplnený"}</dd></div>
      </dl>
      <span className="workshopRegistrationState">{workshop.registrationOpen ? "Registrácia je otvorená" : "Registrácia zatiaľ nie je otvorená"}</span>
    </div>
  </a>;
}

export default function Workshops() {
  const { content, locale } = useI18n();
  const workshops = content.workshops?.items || [];
  const lecturers = new Map(content.performers.items.map((person) => [person.id, person]));
  return <Section kicker="Workshopy" title="Workshopy" className="sectionTint">
    <div className="workshopGrid">{workshops.map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} lecturers={lecturers} locale={locale} />)}</div>
  </Section>;
}
