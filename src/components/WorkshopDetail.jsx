import React, { useState } from "react";
import Section from "./Section.jsx";
import WorkshopRegistrationForm from "./WorkshopRegistrationForm.jsx";
import { formatSession, workshopPrice, workshopLecturers } from "../lib/workshops.js";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

import { useWorkshopAvailability } from "../lib/workshopApi.js";
import registrationCopy from "../data/registration.json";

export default function WorkshopDetail({ workshop }) {
  const { content, locale } = useI18n();
  const live = useWorkshopAvailability(workshop.slug);
  const sessions = live ? live.sessions.map(session => ({ ...session, start: session.start_at, registrationOpen: !!session.registration_open })) : (workshop.sessions || []).map(session => ({ ...session, registrationOpen: false }));
  const registrationWorkshop = { ...workshop, ...(live ? { paid: live.price_cents > 0, priceCents: live.price_cents, currency: live.currency } : {}), registrationOpen: !!live };
  const [selectedId, setSelectedId] = useState(sessions[0]?.id || "");
  const selectedSession = sessions.find((session) => session.id === selectedId) || sessions[0] || null;
  const people = workshopLecturers(workshop, content.performers.items);
  return <Section className="performerDetailSection workshopDetail">
    <a className="backLink" href={addLocalePrefix("/workshopy", locale)}>← Všetky workshopy</a>
    {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
    {workshop.image ? <img className="workshopDetailImage" src={workshop.image} alt={workshop.title} /> : null}
    <div className="workshopDetailGrid">
      <div className="workshopDescription">{workshop.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <dl className="workshopFacts workshopDetailFacts">
          {people.length ? <div><dt>{people.length > 1 ? "Lektori" : "Lektor"}</dt><dd>{people.map((person) => <div key={person.name}>{person.name}{person.affiliation ? <div>{person.affiliation}</div> : null}</div>)}</dd></div> : null}
          {workshop.durationMinutes ? <div><dt>Trvanie</dt><dd>{workshop.durationMinutes} min</dd></div> : null}
          <div><dt>Cena</dt><dd>{workshopPrice(registrationWorkshop)}</dd></div>
          {selectedSession?.capacity != null ? <div><dt>Kapacita</dt><dd>{selectedSession.capacity} osôb na termín</dd></div> : null}
          {selectedSession?.location ? <div><dt>Miesto</dt><dd>{selectedSession.location}</dd></div> : null}
        </dl>
      </div>
      <section className="workshopSessions" aria-labelledby="workshop-sessions-title">
        <h2 id="workshop-sessions-title">Termíny</h2>
        {sessions.length ? sessions.map((session) => <label className="workshopSession" key={session.id}>
          <input type="radio" name="workshop-session" value={session.id} checked={session.id === (selectedSession?.id || "")} onChange={() => setSelectedId(session.id)} />
          <span><strong>{formatSession(session, workshop.durationMinutes)}</strong>{session.location ? <span>{session.location}</span> : null}{session.capacity != null ? <span>{session.remaining_capacity == null ? `Kapacita: ${session.capacity}` : session.remaining_capacity === 0 ? registrationCopy.full : registrationCopy.available.replace("{remaining}", session.remaining_capacity).replace("{capacity}", session.capacity)}</span> : null}</span>
        </label>) : <p>Termín bude doplnený</p>}
        {!registrationWorkshop.registrationOpen ? <p className="workshopRegistrationState">Registrácia zatiaľ nie je otvorená</p> : null}
      </section>
    </div>
    <WorkshopRegistrationForm key={selectedSession?.id || "none"} workshop={registrationWorkshop} session={selectedSession} />
  </Section>;
}
