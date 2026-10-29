import React, { useState } from "react";
import { Play } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";
export default function VideoSection() { const { site } = useI18n(); const [playing, setPlaying] = useState(false); const id = site.video.youtubeId; return <Section id="video" kicker={site.video.kicker} title={site.video.title} className="sectionTint"><div className="videoWrap">{id && playing ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={site.video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : id ? <button className="videoPoster" type="button" onClick={() => setPlaying(true)} aria-label={site.ui.playVideoLabel}><img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={site.ui.previousYearVideoAlt} loading="lazy" /><span className="videoPlay"><Play size={42} fill="currentColor"/><strong>{site.ui.playVideo}</strong></span></button> : <div className="videoPlaceholder"><Play size={44}/><strong>YouTube video</strong><span>{site.video.caption}</span></div>}</div></Section>; }
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
