/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import Section from "./Section.jsx";
import ImageWithFallback from "./ImageWithFallback.jsx";
import { useI18n } from "../lib/useI18n.js";
function PartnerList({ items }) { return <div className="partnerGrid">{items.map((item) => <article className="partnerCard" key={item.name}><ImageWithFallback src={item.image} alt={item.name} className="partnerLogo"/><strong>{item.name}</strong>{item.note ? <span>{item.note}</span> : null}</article>)}</div>; }
export default function Partners() { const { site, content } = useI18n(); return <Section id="partneri" className="contactPartners" kicker={site.ui.organizersKicker} title={site.ui.organizersTitle}><h3 className="subheading">{site.ui.organizers}</h3><PartnerList items={content.partners.organizers}/><h3 className="subheading">{site.ui.partners}</h3><PartnerList items={content.partners.partners}/></Section>; }
