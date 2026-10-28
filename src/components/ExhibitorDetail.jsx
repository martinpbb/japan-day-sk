import React from "react";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

export default function ExhibitorDetail({ exhibitor }) {
  const { locale, content } = useI18n();
  const { detail, gallery = [] } = exhibitor;
  const order = detail.customOrder;
  return (
    <article className="section exhibitorDetail">
      <div className="container">
        <header className="exhibitorDetailIntro">
          <div className="eyebrow">{exhibitor.category}</div>
          <h1>{detail.heading}</h1>
          <p className="performerLead">{detail.lead}</p>
        </header>
        <img className="exhibitorDetailImage" src={exhibitor.image} alt={`${exhibitor.name} – ${exhibitor.category}`} />
        <div className="exhibitorDetailBody">
          <div className="exhibitorDetailStory">
            {exhibitor.description.split(/\n\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <aside className="exhibitorOrder" aria-labelledby="exhibitor-order-title">
            <h2 id="exhibitor-order-title">{order.title}</h2>
            <p className="exhibitorOrderPrice"><strong>{order.price}</strong></p>
            <p>{order.priceNote}</p>
            <ul>{order.details.map((item) => <li key={item}>{item}</li>)}</ul>
          </aside>
        </div>
        {gallery.length > 0 && <div className="exhibitorDetailGallery">
          {gallery.map((image) => <img className="exhibitorDetailImage" key={image.src} src={image.src} alt={image.alt} loading="lazy" />)}
        </div>}
        <a className="backLink" href={addLocalePrefix("/vystavovatelia", locale)}>
          <ArrowLeft size={18} aria-hidden="true" />
          {content.seo.routes["/vystavovatelia"].breadcrumb}
        </a>
      </div>
    </article>
  );
}
