import React from "react";
import { useI18n } from "../lib/useI18n.js";

export default function PageIntro({ title, intro }) {
  const { site } = useI18n();
  return (
    <section className="pageIntro">
      <div className="container">
        <div className="eyebrow">{site.hero.shortName}</div>
        <h1>{title}</h1>
        {intro ? <p>{intro}</p> : null}
      </div>
    </section>
  );
}
