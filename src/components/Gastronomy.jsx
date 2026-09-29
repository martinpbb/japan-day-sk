import React from "react";
import { Fish, Flame, Leaf, Wine } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

const icons = [Fish, Flame, Leaf, Wine];

export default function Gastronomy({ compact = false }) {
  const { content, locale } = useI18n();
  const route = content.seo.routes["/gastronomia"];
  const items = content.gastronomy.items;
  const detailPath = (id) => `${addLocalePrefix(`/gastronomia#${id}`, locale)}`;

  return (
    <Section id="gastronomie" kicker={route.breadcrumb} title={route.h1} className="sectionDark">
      <div className="featureGrid">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <a className="featureCard featureCardLink" href={detailPath(item.id)} key={item.id}>
              <Icon size={28} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="cardCta">{item.cta}</span>
            </a>
          );
        })}
      </div>
      {!compact ? (
        <div className="gastronomyDetails">
          {items.map((item) => (
            <section className="gastronomyCategory" id={item.id} key={item.id}>
              <h3>{item.title}</h3>
              <p className="gastronomyIntro">{item.details.intro}</p>
              {item.details.secondary ? <p className="gastronomyIntro">{item.details.secondary}</p> : null}
              <div className="gastronomyItemGrid">
                {item.details.items.map((detail) => (
                  <article className="gastronomyItem" key={detail.name}>
                    <h4>{detail.name}</h4>
                    {detail.region ? <p className="gastronomyRegion">{detail.region}</p> : null}
                    {detail.description ? <p>{detail.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
