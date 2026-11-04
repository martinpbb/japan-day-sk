import React from "react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";

export default function SpeechContestPromotion() {
  const { site } = useI18n();
  const promotion = site.speechContest;

  return (
    <Section className="sectionTint speechContestSection" kicker={promotion.kicker} title={promotion.title}>
      <div className="speechContestGrid">
        <div className="speechContestCopy">
          <p>{promotion.intro}</p>
          <p className="speechContestDetails"><strong>{promotion.date}</strong><br />{promotion.venue}</p>
          <p>{promotion.admission}</p>
          <p>{promotion.organizer}</p>
        </div>
        <img className="speechContestPoster" src="/images/gallery/plagat-japanese-competition.jpg" alt={promotion.posterAlt} loading="lazy" />
      </div>
    </Section>
  );
}
