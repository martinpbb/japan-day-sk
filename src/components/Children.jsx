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
import { addLocalePrefix } from "../lib/i18nPaths.js";

const icons = [Palette, SparklesIcon, Bird, Gamepad2, Brush, CircleDot, ToyBrick, Candy];
const competitionIcons = [Shirt, Pencil];

function SparklesIcon(props) {
  return <Shapes {...props} />;
}

export default function Children({ compact = false }) {
  const { content, locale } = useI18n();
  const data = content.children;
  const route = content.seo.routes["/pre-deti"];
  const detailPath = addLocalePrefix("/pre-deti", locale);

  return (
    <Section id="pre-deti" kicker={route.sectionKicker || route.breadcrumb} title={route.sectionTitle || route.h1} className="childrenSection">
      <p className="childrenIntro">{data.intro}</p>
      <p className="childrenFreeEntry">{data.freeEntry}</p>
      {data.activities.length ? (
        <div className="featureGrid childrenGrid">
          {data.activities.map((activity, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article className="featureCard childrenCard" key={activity.id}>
                <Icon size={28} aria-hidden="true" />
                <h3>{activity.title}</h3>
                <p>{compact ? activity.short : activity.description}</p>
              </article>
            );
          })}
        </div>
      ) : <div className="emptyState"><strong>{data.intro}</strong></div>}
      {!compact && data.competition && (
        <section className="childrenCompetition" aria-labelledby="children-competition-title">
          <p className="childrenCompetitionEyebrow">{data.competition.eyebrow}</p>
          <h2 id="children-competition-title">{data.competition.title}</h2>
          <p className="childrenCompetitionIntro">{data.competition.intro}</p>
          <div className="childrenCompetitionGrid">
            {data.competition.categories.map((category, index) => {
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
          <div className="childrenPrize"><Trophy size={28} aria-hidden="true" /><div><h3>{data.competition.prize.title}</h3><p>{data.competition.prize.text}</p></div></div>
        </section>
      )}
      {compact ? (
        <a className="childrenCta" href={detailPath}>{data.cta}</a>
      ) : (
        <div className="childrenSafety">
          <h3>{data.safety.title}</h3>
          <p>{data.safety.text}</p>
        </div>
      )}
    </Section>
  );
}
