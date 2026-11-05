/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React, { useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback.jsx";
import Section from "./Section.jsx";
import ContentRenderer from "./ContentRenderer.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function PerformerDetail({ performer }) {
  const { locale, site, content } = useI18n();
  const [posterAvailable, setPosterAvailable] = useState(true);
  const appearances = content.program.items.filter((item) => item.performerId === performer.id);

  return (
    <Section className="performerDetailSection">
      <a className="backLink" href={addLocalePrefix("/ucinkujuci", locale)}>
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
          {performer.represents ? (
            <div className="programMeta">{performer.represents.label}: {performer.represents.value}</div>
          ) : null}
          {performer.website ? (
            <div className="programMeta">
              {performer.website.label}: <a href={performer.website.url} target="_blank" rel="noopener noreferrer">{performer.website.url}</a>
            </div>
          ) : null}
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

      {performer.id === "hisayo-yasuda" && content.performerPromotion ? (
        <section className={`performerPromotion${posterAvailable ? "" : " performerPromotionNoPoster"}`} aria-labelledby="performer-promotion-title">
          {posterAvailable ? (
            <div className="performerPromotionPoster">
              <img
                src="/images/performers/hisayo_yasuda.jpg"
                alt={content.performerPromotion.posterAlt}
                onError={() => setPosterAvailable(false)}
              />
            </div>
          ) : null}
          <div className="performerPromotionContent">
            <div className="eyebrow">{content.performerPromotion.kicker}</div>
            <h2 id="performer-promotion-title">{content.performerPromotion.title}</h2>
            <p className="performerLead">{content.performerPromotion.intro}</p>
            <dl className="performerPromotionFacts">
              <div><dt>{content.performerPromotion.dateLabel}</dt><dd>{content.performerPromotion.date}</dd></div>
              <div><dt>{content.performerPromotion.timeLabel}</dt><dd>{content.performerPromotion.time}</dd></div>
              <div><dt>{content.performerPromotion.venueLabel}</dt><dd>{content.performerPromotion.venue}</dd></div>
              <div><dt>{content.performerPromotion.addressLabel}</dt><dd>{content.performerPromotion.address}</dd></div>
              <div><dt>{content.performerPromotion.levelsLabel}</dt><dd>{content.performerPromotion.levels}</dd></div>
              <div><dt>{content.performerPromotion.participationLabel}</dt><dd>{content.performerPromotion.participation}</dd></div>
              <div><dt>{content.performerPromotion.organizerLabel}</dt><dd>{content.performerPromotion.organizer}</dd></div>
            </dl>
            <a className="performerPromotionCta" href="https://www.j-pad.eu/" target="_blank" rel="noopener noreferrer">
              {content.performerPromotion.cta}
            </a>
          </div>
        </section>
      ) : null}

    </Section>
  );
}
