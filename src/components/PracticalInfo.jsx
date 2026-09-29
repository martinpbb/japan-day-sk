import React from "react";
import { CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import Section from "./Section.jsx";
import { ContactForm } from "./Contact.jsx";
import { useI18n } from "../lib/useI18n.js";

const icons = [CalendarDays, Clock3, MapPin, Ticket];

export default function PracticalInfo() {
  const { site } = useI18n();
  const e = site.event;
  const query = encodeURIComponent(`${e.venue}, ${e.city}, Slovakia`);
  const mapEmbedUrl = `https://www.google.com/maps?q=${query}&output=embed`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return <Section id="informacie" kicker={site.practical.kicker} title={site.practical.title} className="sectionTint">
    <div className="infoGrid">{site.practical.items.map((item, i) => { const Icon = icons[i]; return <div className="infoCard" key={item.label}><Icon size={24}/><span>{item.label}</span><strong>{item.value}</strong></div>; })}</div>
    <div className="practicalDetails"><div><h3>{site.ui.transportAndParking}</h3><p>{site.practical.transport}</p></div><div><h3>{site.ui.accessibility}</h3><p>{site.practical.accessibility}</p></div></div>
    <div className="mapPlaceholder"><MapPin size={28}/><div><strong>{e.venue}, {e.city}</strong><span>{e.region} • Slovensko</span></div></div>
    <div className="venueMapCard"><iframe title={site.ui.mapTitle} src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><a className="venueMapLink" href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={18} />{site.ui.openMap}</a></div>
    <div className="faqBlock"><h3>{site.ui.faq}</h3>{site.practical.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    <ContactForm />
  </Section>;
}
