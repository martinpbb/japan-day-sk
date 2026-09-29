/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback.jsx";
import Section from "./Section.jsx";
import ContentRenderer from "./ContentRenderer.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function PerformerDetail({ performer }) {
  const { locale, site, content } = useI18n();
  const appearances = content.program.items.filter((item) => item.performerId === performer.id);

  return (
    <Section className="performerDetailSection">
      <a className="backLink" href={addLocalePrefix("/ucinkujici", locale)}>
        <ArrowLeft size={18} aria-hidden="true" />
        {site.ui.allPerformers}
      </a>

      <div className="performerDetailGrid">
        <div className="performerDetailMedia">
          <ImageWithFallback src={performer.image} alt={performer.name} className="performerDetailImage" />
        </div>

        <div className="performerDetailContent">
          <div className="programMeta">{performer.category}</div>
          <p className="performerLead">{performer.short}</p>
          <p>{performer.description}</p>
          <ContentRenderer content={performer.content} />

          {appearances.length > 0 ? (
            <div className="performerSchedule">
              <h2>{site.ui.inProgrammeHeading}</h2>
              {appearances.map((item, index) => (
                <div className="performerScheduleItem" key={`${item.time}-${index}`}>
                  <a className="performerScheduleLink" href={addLocalePrefix("/program", locale)}>
                    <Clock3 size={18} aria-hidden="true" />
                    <span>
                      <strong>{item.endTime ? `${item.time}–${item.endTime}` : item.time}</strong>
                      <span>{item.title}</span>
                    </span>
                  </a>
                  {item.description ? <p>{item.description}</p> : null}
                  <ContentRenderer content={item.content} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
