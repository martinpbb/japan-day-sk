import React from "react";
import { ChevronRight } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function Program() {
  const { locale, site, content } = useI18n();
  const performerMap = new Map(content.performers.items.map((item) => [item.id, item]));
  const route = content.seo.routes["/program"];
  const performerPath = (id) => addLocalePrefix(`/ucinkujuci/${id}`, locale);

  if (!content.program.items.length) {
    return (
      <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint">
        <div className="emptyState programPending">
          <strong>{site.ui.programPending}</strong>
          <p>{content.program.note}</p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint">
      <div className="timeline">
        {content.program.items.map((item, index) => {
          const performer = item.performerId ? performerMap.get(item.performerId) : null;
          return (
            <article className="programItem" key={`${item.time}-${index}`}>
              <time className="programTime"><strong>{item.time}</strong>{item.endTime ? <span>{site.ui.programmeUntil.replace("{time}", item.endTime)}</span> : null}</time>
              <div className="timelineDot" aria-hidden="true" />
              <div className="programAvatarSlot">{performer ? <a className="programAvatarLink" href={performerPath(performer.id)} aria-label={site.ui.moreAbout.replace("{name}", performer.name)}><img className="programAvatar" src={performer.image} alt="" /></a> : null}</div>
              <div className="programHeading"><div className="programMeta">{performer?.category || site.ui.inProgramme}</div>{performer ? <h3><a className="programTitleLink" href={performerPath(performer.id)}>{item.title}</a></h3> : <h3>{item.title}</h3>}</div>
              {(item.description || performer?.short) ? <p className="programDescription">{item.description || performer.short}</p> : <div className="programDescription" />}
              {performer ? <a className="iconLink" href={performerPath(performer.id)} aria-label={site.ui.moreAbout.replace("{name}", performer.name)}><ChevronRight size={20}/></a> : null}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
