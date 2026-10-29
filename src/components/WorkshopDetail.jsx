import React, { useState } from "react";
import Section from "./Section.jsx";
import WorkshopRegistrationForm from "./WorkshopRegistrationForm.jsx";
import { formatSession, workshopPrice } from "../lib/workshops.js";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function WorkshopDetail({ workshop }) {
  const { content, locale } = useI18n();
  const sessions = workshop.sessions || [];
  const [selectedId, setSelectedId] = useState(sessions[0]?.id || "");
  const selectedSession = sessions.find((session) => session.id === selectedId) || sessions[0] || null;
  const lecturer = workshop.lecturerId ? content.performers.items.find((person) => person.id === workshop.lecturerId) : null;
  return <Section className="performerDetailSection workshopDetail">
    <a className="backLink" href={addLocalePrefix("/workshopy", locale)}>← Všetky workshopy</a>
    {workshop.category ? <div className="programMeta">{workshop.category}</div> : null}
    {workshop.image ? <img className="workshopDetailImage" src={workshop.image} alt={workshop.title} /> : null}
    <div className="workshopDetailGrid">
      <div className="workshopDescription"><p>{workshop.description}</p>
        <dl className="workshopFacts workshopDetailFacts">
          {lecturer ? <div><dt>Lektor</dt><dd>{lecturer.name}</dd></div> : null}
          {workshop.durationMinutes ? <div><dt>Trvanie</dt><dd>{workshop.durationMinutes} min</dd></div> : null}
          <div><dt>Cena</dt><dd>{workshopPrice(workshop)}</dd></div>
          {selectedSession?.capacity != null ? <div><dt>Kapacita</dt><dd>{selectedSession.capacity}</dd></div> : null}
          {selectedSession?.location ? <div><dt>Miesto</dt><dd>{selectedSession.location}</dd></div> : null}
        </dl>
      </div>
      <section className="workshopSessions" aria-labelledby="workshop-sessions-title">
        <h2 id="workshop-sessions-title">Termíny</h2>
        {sessions.length ? sessions.map((session) => <label className="workshopSession" key={session.id}>
          <input type="radio" name="workshop-session" value={session.id} checked={session.id === (selectedSession?.id || "")} onChange={() => setSelectedId(session.id)} />
          <span><strong>{formatSession(session, workshop.durationMinutes)}</strong>{session.location ? <span>{session.location}</span> : null}{session.capacity != null ? <span>Kapacita: {session.capacity}</span> : null}</span>
        </label>) : <p>Termín bude doplnený</p>}
        {!workshop.registrationOpen ? <p className="workshopRegistrationState">Registrácia zatiaľ nie je otvorená</p> : null}
      </section>
    </div>
    <WorkshopRegistrationForm workshop={workshop} session={selectedSession} />
  </Section>;
}
