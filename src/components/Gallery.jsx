import React, { useMemo, useState } from "react";
import Section from "./Section.jsx";
import ImageWithFallback from "./ImageWithFallback.jsx";
import Modal from "./Modal.jsx";
import { useI18n } from "../lib/useI18n.js";
const categoryKeys = { Program: "program", Programme: "program", "Čaj": "tea", Tea: "tea", Gastronomie: "food", Food: "food", Atmosféra: "atmosphere", Atmosphere: "atmosphere", Stánky: "stalls", Stalls: "stalls" };

export default function Gallery() {
  const { site, content } = useI18n();
  const { ui } = site;
  const items = content.gallery.items;
  const categories = useMemo(() => ["all", ...new Set(items.map((item) => categoryKeys[item.category] || item.category))], [items]);
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState(null);
  const visible = active === "all" ? items : items.filter((item) => (categoryKeys[item.category] || item.category) === active);
  const labels = { all: ui.all, ...Object.fromEntries(Object.entries(ui.galleryCategories || {}).map(([label, value]) => [categoryKeys[label] || label, value])) };

  return (
    <Section id="fotky" kicker={ui.previousYear} title={ui.galleryTitle}>
      {!items.length ? <div className="emptyState"><strong>{ui.galleryPending}</strong></div> : <>
        <div className="filters">{categories.map((key) => <button className={active === key ? "active" : ""} key={key} onClick={() => setActive(key)}>{labels[key] || key}</button>)}</div>
        <div className="galleryGrid">{visible.map((item) => <button type="button" className="galleryItem" key={item.id} onClick={() => setSelected(item)} aria-label={ui.showPhoto.replace("{alt}", item.alt)}><ImageWithFallback src={item.src} alt={item.alt} className="galleryImage" /></button>)}</div>
      </>}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)}>{selected ? <figure className="galleryLightboxFigure"><img className="galleryLightboxImage" src={selected.src} alt={selected.alt} /><figcaption><span>{selected.alt}</span>{selected.category ? <small>{labels[categoryKeys[selected.category]] || selected.category}</small> : null}</figcaption></figure> : null}</Modal>
    </Section>
  );
}
