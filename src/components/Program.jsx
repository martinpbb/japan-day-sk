import React from "react";
import { MapPin } from "lucide-react";
import Section from "./Section.jsx";
import WorkshopsTeaser from "./WorkshopsTeaser.jsx";
import { useI18n } from "../lib/useI18n.js";
import { useEventArchive } from "../lib/useEventArchive.js";

function VenueSchedule({ venue, title, subtitle, capacity, capacityLabel, items, performers }) {
  const { eventHref } = useEventArchive();
  return (
    <section className="programVenue" aria-labelledby={`venue-${venue}`}>
      <header className="programVenueHeader">
        <MapPin size={19} aria-hidden="true" />
        <div>
          <h2 id={`venue-${venue}`}>{title}</h2>
          <p>{subtitle}{capacity ? <span className="programCapacity">{capacityLabel.replace("{capacity}", capacity)}</span> : null}</p>
        </div>
      </header>
      <div className="programVenueList">
        {items.map((item, index) => {
          const performer = item.performerId ? performers.get(item.performerId) : null;
          return (
            <article className="programVenueItem" key={`${venue}-${item.time}-${index}`}>
              <time className="programVenueTime" dateTime={`2026-11-07T${item.time}:00+01:00`}>
                {item.endTime ? `${item.time}–${item.endTime}` : item.time}
              </time>
              <div className="programVenueDetails">
                <h3>{item.title}</h3>
                {item.presenter ? <span className="programVenuePerformer">{item.presenter}</span> : null}
                {!item.presenter && performer ? <a className="programVenuePerformer" href={eventHref(`/ucinkujuci/${performer.id}`)}>{performer.name}</a> : null}
                {item.durationMinutes ? <span className="programVenueDuration">{item.durationMinutes} min</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function Program({ includeWorkshopsTeaser = false }) {
  const { site, content } = useI18n();
  const copy = site.ui.program;
  const route = content.seo.routes["/program"];
  const performers = new Map(content.performers.items.map((item) => [item.id, item]));
  const hall = content.program.items.filter((item) => item.venue === "hall");
  const theatre = content.program.items.filter((item) => item.venue === "theatre");

  if (!content.program.items.length) {
    return <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint"><div className="emptyState programPending"><strong>{site.ui.programPending}</strong><p>{content.program.note}</p></div></Section>;
  }

  return (
    <>
      <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint">
        <div className="programVenues">
          <VenueSchedule venue="hall" title={copy.hallTitle} subtitle={copy.hallSubtitle} items={hall} performers={performers} />
          <VenueSchedule venue="theatre" title={copy.theatreTitle} subtitle={copy.theatreSubtitle} capacity={100} capacityLabel={copy.capacity} items={theatre} performers={performers} />
        </div>
        {content.program.note ? <p className="infoNote programInfoNote">{content.program.note}</p> : null}
        {content.program.plan ? <section className="programPlanSection" aria-label={content.program.plan.title || content.program.plan.alt}>{content.program.plan.title ? <h2>{content.program.plan.title}</h2> : null}{content.program.plan.description ? <p>{content.program.plan.description}</p> : null}<img className="programPlan" src={content.program.plan.image} alt={content.program.plan.alt} /></section> : null}
      </Section>
      {includeWorkshopsTeaser ? <WorkshopsTeaser /> : null}
    </>
  );
}
