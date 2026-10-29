import React from "react";
import { ChevronRight } from "lucide-react";
import Section from "./Section.jsx";
import RegistrationForm from "./RegistrationForm.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function Program() {
  const { locale, site, content } = useI18n();
  const performerMap = new Map(content.performers.items.map((item) => [item.id, item]));
  const route = content.seo.routes["/program"];
  const performerPath = (id) => addLocalePrefix(`/ucinkujuci/${id}`, locale);
  if (!content.program.items.length) {
    return <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint"><div className="emptyState programPending"><strong>{site.ui.programPending}</strong><p>{content.program.note}</p></div></Section>;
  }
  return <Section id="program" kicker={route.breadcrumb} title={route.h1} className="sectionTint"><div className="timeline">{content.program.items.map((item, index) => { const performer = item.performerId ? performerMap.get(item.performerId) : null; return <article className="programItem" key={`${item.time}-${index}`}><time className="programTime"><strong>{item.time}</strong>{item.endTime ? <span>{site.ui.programmeUntil.replace("{time}", item.endTime)}</span> : null}</time><div className="timelineDotWrapper" aria-hidden="true"><div className="timelineDot" /></div><div className="programAvatarSlot">{performer ? <a className="programAvatarLink" href={performerPath(performer.id)} aria-label={site.ui.moreAbout.replace("{name}", performer.name)}><img className="programAvatar" src={performer.image} alt="" /></a> : null}</div><div className="programHeading"><div className="programMeta">{performer?.category || (item.type === "ceremony" ? site.ui.inProgramme : content.seo.routes["/prakticke-informacie"].breadcrumb)}</div>{performer ? <h3><a className="programTitleLink" href={performerPath(performer.id)}>{item.title}</a></h3> : <h3>{item.title}</h3>}</div>{(item.description || performer?.short) ? <p className="programDescription">{item.description || performer.short}</p> : <div className="programDescription" />}{performer ? <a className="iconLink" href={performerPath(performer.id)} aria-label={site.ui.moreAbout.replace("{name}", performer.name)}><ChevronRight size={20}/></a> : null}{item.registration ? <RegistrationForm workshop={{ title: item.title, term: item.registration.term, location: item.registration.location }} /> : null}</article>; })}</div>{content.program.plan ? <section className="programPlanSection" aria-label={content.program.plan.title || content.program.plan.alt}>{content.program.plan.title ? <h2>{content.program.plan.title}</h2> : null}{content.program.plan.description ? <p>{content.program.plan.description}</p> : null}<img className="programPlan" src={content.program.plan.image} alt={content.program.plan.alt} /></section> : null}</Section>;
}
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
