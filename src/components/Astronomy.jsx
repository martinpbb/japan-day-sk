import React from "react";
import { Orbit } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";

export default function Astronomy() {
  const { content } = useI18n();
  const data = content.astronomy;

  return (
    <Section id="astronomicky-klub" kicker={data.organization} title={data.title} className="astronomySection">
      <div className="astronomyFeature">
        <div className="astronomyCopy">
          <Orbit className="astronomyIcon" size={27} aria-hidden="true" />
          {data.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="astronomySpeaker"><strong>{data.speaker}</strong><span>{data.organization}</span></p>
        </div>
        {data.image ? <img className="astronomyImage" src={data.image} alt={data.imageAlt || ""} /> : null}
      </div>
    </Section>
  );
}
