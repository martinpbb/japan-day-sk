import React from "react";
import { CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import { useI18n } from "../lib/useI18n.js";
import { useEventArchive } from "../lib/useEventArchive.js";

export default function Hero({ postEvent = false }) {
  const { eventHref } = useEventArchive();
  const { site } = useI18n();
  const { ui } = site;
  const e = site.event;
  const thanks = site.postEvent?.hero;
  const openingFrom = ui?.openingFrom ?? "Open from {time}";
  return (
    <section id="top" className={`hero${postEvent ? " postEventHero" : ""}`}>
      <div className="heroPattern" aria-hidden="true" />
      <div className="container heroGrid">
        <div className="heroCopy">
          {postEvent ? <>
            <div className="eyebrow">{site.brand.name}</div>
            <h1>{thanks.lines.map((line) => <span key={line}>{line}</span>)}</h1>
            <p>{thanks.intro}</p>
            <div className="heroActions"><a className="button primary" href="#spatna-vazba">{thanks.cta}</a></div>
            <div className="facts"><span><CalendarDays size={18} />{thanks.date}</span><span><MapPin size={18} />{e.city}, {e.country}</span></div>
          </> : <>
          <div className="eyebrow">{site.hero.kicker}</div>
          <h1>{site.hero.title}</h1>
          <div className="heroShortName">{site.hero.shortName}</div>
          <div className="heroDescriptor">{site.hero.descriptor}</div>
          <p>{site.hero.subtitle}</p>
          <div className="heroActions">
            <a className="button primary" href={eventHref("/program")}>{site.hero.ctaPrimary}</a>
            <a className="button ghost" href={eventHref("/prakticke-informacie")}>{site.hero.ctaSecondary}</a>
          </div>
          <div className="facts">
            <span><CalendarDays size={18} />{e.date}</span>
            {e.openingTime ? <span><Clock3 size={18} />{openingFrom.replace("{time}", e.openingTime)}</span> : null}
            <span><MapPin size={18} />{e.venue}, {e.locationLabel}</span>
            <span><Ticket size={18} />{e.admission}</span>
          </div>
          </>}
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
