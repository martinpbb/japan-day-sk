import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { formatDuration, formatSession, lecturerRoleLabel, workshopPrice, workshopLecturers } from "../lib/workshops.js";
import { useWorkshopSessionAvailability } from "../lib/workshopApi.js";
import { navigateWithinApp } from "../lib/clientNavigation.js";

function WorkshopCard({ workshop, lecturers, locale, copy, availability }) {
  const open = workshop.registrationRequired !== false && workshop.registrationOpen !== false;
  const liveWorkshop = availability.workshops?.find(item => item.id === workshop.id);
  const liveSessions = liveWorkshop?.sessions || [];
  const people = workshopLecturers(workshop, lecturers);
  return <a className="performerCard performerCardLink workshopCard" href={addLocalePrefix(`/workshopy/${workshop.slug || workshop.id}`, locale)} onClick={navigateWithinApp}>
    {workshop.image ? <img className="workshopImage" src={workshop.image} alt="" loading="lazy" /> : null}
    <div className="performerContent">
      {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
      <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
      <p className="shortText">{workshop.short || workshop.description}</p>
      <dl className="workshopFacts">
        {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}</div>)}</dd></div> : null}
        {workshop.durationMinutes ? <div><dt>{copy.duration}</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
        <div><dt>{copy.price}</dt><dd>{workshopPrice(workshop, copy, locale)}</dd></div>
        <div><dt>{copy.time}</dt><dd>{workshop.availabilityWindow || (liveWorkshop ? <>
          <p>{copy.aggregateSummary.replace("{count}", liveWorkshop.session_count).replace("{registered}", liveWorkshop.registered_count).replace("{capacity}", liveWorkshop.capacity)}</p>
          {liveSessions.length ? <ul className="workshopTimeList">{liveSessions.map(session => <li key={session.id}>
            {formatSession({ start: session.start_at, end_at: session.end_at }, workshop.durationMinutes, locale)} · {copy.registeredCount.replace("{registered}", session.registered_count).replace("{capacity}", session.capacity)}
          </li>)}</ul> : null}
        </> : availability.failed ? copy.availabilityUnavailable : copy.sessionPending)}</dd></div>
      </dl>
      {workshop.availabilityNote ? <p className="workshopAvailabilityNote">{workshop.availabilityNote}</p> : null}
      {workshop.registrationRequired !== false ? <span className="workshopRegistrationState">{open ? copy.registrationOpen : copy.registrationClosed}</span> : null}
    </div>
  </a>;
}

export default function Workshops() {
  const { content, locale, site } = useI18n();
  const workshops = content.workshops?.items || [];
  const lecturers = content.performers.items;
  const copy = site.ui.workshops;
  const availability = useWorkshopSessionAvailability();
  return <Section kicker={copy.title} title={copy.title} className="sectionTint">
    <p className="infoNote workshopInfoNote">{copy.walkInNote}</p>
    <div className="workshopGrid">{workshops.map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} lecturers={lecturers} locale={locale} copy={copy} availability={availability} />)}</div>
  </Section>;
}
