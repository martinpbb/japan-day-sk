import React, { useState } from "react";
import Section from "./Section.jsx";
import WorkshopRegistrationForm from "./WorkshopRegistrationForm.jsx";
import { formatDuration, formatSession, lecturerRoleLabel, workshopPrice, workshopLecturers } from "../lib/workshops.js";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

import { useWorkshopAvailability } from "../lib/workshopApi.js";

export default function WorkshopDetail({ workshop }) {
  const { content, locale, site } = useI18n();
  const copy = site.ui.workshops;
  const live = useWorkshopAvailability(workshop.slug);
  const sessions = live ? live.sessions.map(session => ({ ...session, start: session.start_at, registrationOpen: !!session.registration_open })) : (workshop.sessions || []).map(session => ({ ...session, registrationOpen: false }));
  const registrationWorkshop = { ...workshop, ...(live ? { paid: live.price_cents > 0, priceCents: live.price_cents, currency: live.currency } : {}), registrationOpen: !!live };
  const [selectedId, setSelectedId] = useState(sessions[0]?.id || "");
  const selectedSession = sessions.find((session) => session.id === selectedId) || sessions[0] || null;
  const people = workshopLecturers(workshop, content.performers.items);
  return <Section className="performerDetailSection workshopDetail">
    <a className="backLink" href={addLocalePrefix("/workshopy", locale)}>← {copy.all}</a>
    {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
    {workshop.image ? <img className="workshopDetailImage" src={workshop.image} alt={workshop.title} /> : null}
    <div className="workshopDetailGrid">
      <div className="workshopDescription">{workshop.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <dl className="workshopFacts workshopDetailFacts">
          {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}{person.affiliation ? <div>{person.affiliation}</div> : null}</div>)}</dd></div> : null}
          {workshop.durationMinutes ? <div><dt>{copy.duration}</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
          <div><dt>{copy.price}</dt><dd>{workshopPrice(registrationWorkshop, copy, locale)}</dd></div>
          {selectedSession?.capacity != null ? <div><dt>{copy.capacity}</dt><dd>{copy.capacityForSession.replace("{capacity}", selectedSession.capacity)}</dd></div> : null}
          {selectedSession?.location ? <div><dt>{copy.location}</dt><dd>{selectedSession.location}</dd></div> : null}
        </dl>
      </div>
      <section className="workshopSessions" aria-labelledby="workshop-sessions-title">
        <h2 id="workshop-sessions-title">{copy.sessions}</h2>
        {sessions.length ? sessions.map((session) => <label className="workshopSession" key={session.id}>
          <input type="radio" name="workshop-session" value={session.id} checked={session.id === (selectedSession?.id || "")} onChange={() => setSelectedId(session.id)} />
          <span><strong>{formatSession(session, workshop.durationMinutes, locale)}</strong>{session.location ? <span>{session.location}</span> : null}{session.capacity != null ? <span>{session.remaining_capacity == null ? `${copy.capacity}: ${session.capacity}` : session.remaining_capacity === 0 ? copy.full : `${session.remaining_capacity} ${copy.peopleShort}`}</span> : null}</span>
        </label>) : <p>{copy.sessionPending}</p>}
        {!registrationWorkshop.registrationOpen ? <p className="workshopRegistrationState">{copy.registrationClosed}</p> : null}
      </section>
    </div>
    <WorkshopRegistrationForm key={selectedSession?.id || "none"} workshop={registrationWorkshop} session={selectedSession} copy={copy} locale={locale} />
  </Section>;
}
