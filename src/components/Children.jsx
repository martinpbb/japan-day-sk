/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import { Bird, Brush, Candy, CircleDot, Gamepad2, Palette, Shapes, ToyBrick, Trophy, Shirt, Pencil } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { useEventArchive } from "../lib/useEventArchive.js";

const icons = [Palette, SparklesIcon, Bird, Gamepad2, Brush, CircleDot, ToyBrick, Candy];
const competitionIcons = [Shirt, Pencil];

function SparklesIcon(props) {
  return <Shapes {...props} />;
}

export default function Children({ compact = false }) {
  const { archived, eventHref } = useEventArchive();
  const { content, locale } = useI18n();
  const data = content.children;
  const competition = archived ? data.competition?.archive : data.competition;
  const intro = archived ? data.archiveIntro : data.intro;
  const calloutTitle = archived ? competition?.title : "Súťaž pre deti";
  const calloutDescription = archived ? competition?.intro : "Vyfarbite japonské motívy a zapojte sa do súťaže o balíček japonských sladkostí.";
  const route = content.seo.routes["/pre-deti"];
  const detailPath = eventHref("/pre-deti");
  const showCompetitionImage = archived || compact || locale === "sk";

  return (
    <Section id="pre-deti" kicker={route.sectionKicker || route.breadcrumb} title={route.sectionTitle || route.h1} className="childrenSection">
      <div className="childrenIntroGrid">
        <div className="childrenIntroContent">
          <p className="childrenIntro">{intro}</p>
          {showCompetitionImage && competition && <aside className="childrenCompetitionCallout" aria-labelledby="children-competition-callout-title">
            <p className="childrenCompetitionEyebrow">{competition.eyebrow}</p>
            <h3 id="children-competition-callout-title">{calloutTitle}</h3>
            <p>{calloutDescription}</p>
          </aside>}
        </div>
        {showCompetitionImage && <div className="childrenPosterWrap"><img
          className="childrenCompetitionImage"
          src="/images/gallery/sutaz-pre-deti.png"
          alt={archived ? data.competition.archive.posterAlt : "Súťaž pre deti – Japonský deň čaju a kultúry v Považskej Bystrici"}
          loading="lazy"
          decoding="async"
        /></div>}
      </div>
      {data.activities.length ? (
        <div className="featureGrid childrenGrid">
          {(compact ? data.activities.filter(({ id }) => ["japanese-colouring", "origami", "ayatori"].includes(id)) : data.activities).map((activity, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article className="featureCard childrenCard" key={activity.id}>
                <Icon size={28} aria-hidden="true" />
                <h3>{archived && activity.id === "japanese-colouring" ? competition.activity.title : activity.title}</h3>
                <p>{archived && activity.id === "japanese-colouring" ? compact ? competition.activity.short : competition.activity.description : compact ? activity.short : activity.description}</p>
              </article>
            );
          })}
        </div>
      ) : <div className="emptyState"><strong>{data.intro}</strong></div>}
      {!compact && competition && (
        <section className="childrenCompetition" aria-labelledby="children-competition-title">
          <p className="childrenCompetitionEyebrow">{competition.eyebrow}</p>
          <h2 id="children-competition-title">{competition.title}</h2>
          <p className="childrenCompetitionIntro">{competition.intro}</p>
          <div className="childrenCompetitionGrid">
            {competition.categories.map((category, index) => {
              const Icon = competitionIcons[index % competitionIcons.length];
              return <article className="childrenCompetitionCard" key={category.id}>
                <Icon size={30} aria-hidden="true" />
                <h3>{category.title}</h3>
                <p className="childrenCompetitionLead">{category.intro}</p>
                <p>{category.body}</p>
                <p className="childrenCompetitionDetail">{category.detail}</p>
                <p className="childrenCompetitionEvaluation"><strong>{category.evaluationLabel}</strong> {category.evaluation}</p>
              </article>;
            })}
          </div>
          <div className="childrenSupportGrid">
            <div className="childrenPrize"><Trophy size={28} aria-hidden="true" /><div><h3>{competition.prize.title}</h3><p>{competition.prize.text}</p></div></div>
            <div className="childrenSafety">
              <h3>{data.safety.title}</h3>
              <p>{data.safety.text}</p>
            </div>
          </div>
        </section>
      )}
      {compact ? (
        <a className="childrenCta" href={detailPath}>{data.cta}</a>
      ) : null}
    </Section>
  );
}
