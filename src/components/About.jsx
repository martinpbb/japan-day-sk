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
import { useI18n } from "../lib/useI18n.js";
export default function About() { const { site } = useI18n(); return <Section id="o-akci" kicker={site.about.kicker} title={site.about.title}><div className="aboutGrid"><div className="prose">{site.about.paragraphs.map((p) => <p key={p}>{p}</p>)}</div><div className="callout"><span>{site.ui.patronage}</span>{site.event.patronage.map((line) => <strong key={line}>{line}</strong>)}</div></div></Section>; }
