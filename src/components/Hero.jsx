import React from "react";
import { CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function Hero() {
  const { locale, site } = useI18n();
  const { ui } = site;
  const e = site.event;
  const openingFrom = ui?.openingFrom ?? "Open from {time}";
  return (
    <section id="top" className="hero">
      <div className="heroPattern" aria-hidden="true" />
      <div className="container heroGrid">
        <div className="heroCopy">
          <div className="eyebrow">{site.hero.kicker}</div>
          <h1>{site.hero.title}</h1>
          <div className="heroShortName">{site.hero.shortName}</div>
          <div className="heroDescriptor">{site.hero.descriptor}</div>
          <p>{site.hero.subtitle}</p>
          <div className="heroActions">
            <a className="button primary" href={addLocalePrefix("/program", locale)}>{site.hero.ctaPrimary}</a>
            <a className="button ghost" href={addLocalePrefix("/prakticke-informacie", locale)}>{site.hero.ctaSecondary}</a>
          </div>
          <div className="facts">
            <span><CalendarDays size={18} />{e.date}</span>
            {e.openingTime ? <span><Clock3 size={18} />{openingFrom.replace("{time}", e.openingTime)}</span> : null}
            <span><MapPin size={18} />{e.venue}, {e.locationLabel}</span>
            <span><Ticket size={18} />{e.admission}</span>
          </div>
        </div>
        <aside className="heroCard heroCardPb" aria-label={ui.heroCardLabel}>
          <div className="pbBrushDisc" aria-hidden="true" />
          <div className="pbMountain" aria-hidden="true">山</div>
          <div className="verticalText">日本の茶と文化</div>
          <div className="heroCardText">
            <small>07 • 11 • 2026</small>
            <strong>POVAŽSKÁ<br/>BYSTRICA</strong>
            <span>{ui.cultureGastronomyTradition}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
