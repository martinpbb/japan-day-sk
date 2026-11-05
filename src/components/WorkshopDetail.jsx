import React, { useState } from "react";
import Section from "./Section.jsx";
import WorkshopRegistrationForm from "./WorkshopRegistrationForm.jsx";
import WorkshopGallery from "./WorkshopGallery.jsx";
import { formatDuration, formatSession, lecturerRoleLabel, workshopPrice, workshopLecturers } from "../lib/workshops.js";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

import { useWorkshopAvailability, useWorkshopSessionAvailability } from "../lib/workshopApi.js";
import { navigateWithinApp } from "../lib/clientNavigation.js";

export default function WorkshopDetail({ workshop }) {
  const { content, locale, site } = useI18n();
  const copy = site.ui.workshops;
  const dropIn = workshop.registrationRequired === false;
  const live = useWorkshopAvailability(dropIn ? null : workshop.slug);
  const availability = useWorkshopSessionAvailability();
  const liveWorkshop = availability.workshops?.find(item => item.id === workshop.id);
  const availabilitySessions = liveWorkshop?.sessions || [];
  const sessions = !dropIn && availabilitySessions.length ? availabilitySessions.map(session => {
    const detailSession = live?.sessions?.find(item => item.id === session.id);
    return { ...session, start: session.start_at, registrationOpen: detailSession ? !!detailSession.registration_open : !!workshop.registrationOpen, location: session.location || detailSession?.location };
  }) : !dropIn && live?.sessions?.length ? live.sessions.map(session => ({ ...session, start: session.start_at, registrationOpen: !!session.registration_open })) : (workshop.sessions || []).map(session => {
    const current = availabilitySessions.find(item => item.id === session.id);
    return { ...session, ...(current ? { start: current.start_at, end_at: current.end_at, capacity: current.capacity } : {}), registrationOpen: !!workshop.registrationOpen };
  });
  const registrationWorkshop = { ...workshop, ...(live ? { paid: live.price_cents > 0, priceCents: live.price_cents, currency: live.currency } : {}), registrationOpen: workshop.registrationOpen };
  const registrationOpen = !dropIn && registrationWorkshop.registrationOpen;
  const [selectedId, setSelectedId] = useState(sessions[0]?.id || "");
  const selectedSession = sessions.find((session) => session.id === selectedId) || sessions[0] || null;
  const selectedSessionIsLive = !!selectedSession && (live?.sessions?.some(session => session.id === selectedSession.id) || availabilitySessions.some(session => session.id === selectedSession.id));
  const people = workshopLecturers(workshop, content.performers.items);
  return <Section className="performerDetailSection workshopDetail">
    <a className="backLink" href={addLocalePrefix("/workshopy", locale)} onClick={navigateWithinApp}>← {copy.all}</a>
    {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
    {workshop.image ? <img className="workshopDetailImage" src={workshop.image} alt={workshop.title} /> : null}
    <WorkshopGallery slug={workshop.slug} />
    <div className="workshopDetailGrid">
      <div className="workshopDescription">{workshop.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <dl className="workshopFacts workshopDetailFacts">
          {people.length ? <div><dt>{people.length > 1 ? copy.lecturers : copy.lecturer}</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.role ? ` (${lecturerRoleLabel(person.role, locale)})` : ""}{person.affiliation ? <div>{person.affiliation}</div> : null}</div>)}</dd></div> : null}
          {workshop.durationMinutes ? <div><dt>{copy.duration}</dt><dd>{formatDuration(workshop.durationMinutes, locale)}</dd></div> : null}
          <div><dt>{copy.price}</dt><dd>{workshopPrice(registrationWorkshop, copy, locale)}</dd></div>
          {selectedSessionIsLive && selectedSession?.capacity != null ? <div><dt>{copy.capacity}</dt><dd>{copy.capacityForSession.replace("{capacity}", selectedSession.capacity)}</dd></div> : null}
          {selectedSession?.location ? <div><dt>{copy.location}</dt><dd>{selectedSession.location}</dd></div> : null}
        </dl>
      </div>
      <section className="workshopSessions" aria-labelledby="workshop-sessions-title">
        <h2 id="workshop-sessions-title">{dropIn ? copy.time : copy.sessions}</h2>
        {dropIn ? <><p>{workshop.availabilityWindow}</p><p>{workshop.availabilityNote}</p></> : sessions.length ? sessions.map((session) => <label className="workshopSession" key={session.id}>
          <input type="radio" name="workshop-session" value={session.id} checked={session.id === (selectedSession?.id || "")} onChange={() => setSelectedId(session.id)} />
          <span><strong>{formatSession(session, workshop.durationMinutes, locale)}</strong>{session.location ? <span>{session.location}</span> : null}{(() => {
            const current = availabilitySessions.find(item => item.id === session.id);
            if (current) return <>
              <span>{copy.registeredCount.replace("{registered}", current.registered_count).replace("{capacity}", current.capacity)}</span>
              <span>{current.available_count === 0 ? copy.full : copy.availableCount.replace("{count}", current.available_count)}</span>
              {current.waitlist_count > 0 ? <span>{copy.waitlistCount.replace("{count}", current.waitlist_count)}</span> : null}
            </>;
            return availability.failed ? <span>{copy.availabilityUnavailable}</span> : null;
          })()}</span>
        </label>) : <p>{copy.sessionPending}</p>}
        {!dropIn ? <p className="workshopRegistrationState">{registrationOpen ? copy.registrationOpen : copy.registrationClosed}</p> : null}
      </section>
    </div>
    {!dropIn ? <WorkshopRegistrationForm key={selectedSession?.id || "none"} workshop={registrationWorkshop} session={selectedSession} copy={copy} locale={locale} /> : null}
  </Section>;
}
