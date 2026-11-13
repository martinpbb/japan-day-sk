import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { useEventArchive } from "../lib/useEventArchive.js";
import { formatDuration, lecturerRoleLabel, workshopPrice, workshopLecturers } from "../lib/workshops.js";
import { useWorkshopSessionAvailability } from "../lib/workshopApi.js";
import { navigateWithinApp } from "../lib/clientNavigation.js";

function WorkshopCard({ workshop, lecturers, locale, copy, availability, archived }) {
  const { eventHref } = useEventArchive();
  const liveWorkshop = availability.workshops?.find(item => item.id === workshop.id);
  const registerable = workshop.registrationRequired !== false;
  const aggregateValues = [liveWorkshop?.session_count, liveWorkshop?.registered_count, liveWorkshop?.capacity];
  const hasAggregate = aggregateValues.every(value => Number.isFinite(value) && value >= 0);
  const people = workshopLecturers(workshop, lecturers);
  return <a className="performerCard performerCardLink workshopCard" href={eventHref(`/workshopy/${workshop.slug || workshop.id}`)} onClick={navigateWithinApp}>
    {workshop.image ? <img className="workshopImage" src={workshop.image} alt="" loading="lazy" /> : null}
    <div className="performerContent">
      {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
      <div className="performerTitleRow"><h3>{workshop.title}</h3><span aria-hidden="true">›</span></div>
      <p className="shortText">{workshop.short || workshop.description}</p>
      <dl className="workshopFacts workshopOverviewFacts">
        {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}:</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}</div>)}</dd></div> : null}
        {workshop.durationMinutes ? <div><dt>{copy.duration}:</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
        <div><dt>{copy.price}:</dt><dd>{workshopPrice(workshop, copy, locale)}</dd></div>
        {registerable && !archived ? <div className="workshopOverviewSessions"><dt>{copy.sessions}:</dt><dd className="workshopOccupancy">
          {hasAggregate ? <span>{copy.aggregateSummary
            .replace("{count}", String(liveWorkshop.session_count))
            .replace("{registered}", String(liveWorkshop.registered_count))
            .replace("{capacity}", String(liveWorkshop.capacity))}</span>
            : <span>{availability.failed ? copy.availabilityUnavailable : copy.sessionPending}</span>}
        </dd></div> : null}
      </dl>
    </div>
  </a>;
}

export default function Workshops() {
  const { archived } = useEventArchive();
  const { content, locale, site } = useI18n();
  const workshops = content.workshops?.items || [];
  const lecturers = content.performers.items;
  const copy = site.ui.workshops;
  const availability = useWorkshopSessionAvailability(!archived);
  return <Section kicker={copy.title} title={copy.title} className="sectionTint">
    <p className="infoNote workshopInfoNote">{archived ? site.archive.registrationsClosed : copy.walkInNote}</p>
    <div className="workshopGrid">{workshops.map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} lecturers={lecturers} locale={locale} copy={copy} availability={availability} archived={archived} />)}</div>
  </Section>;
}
