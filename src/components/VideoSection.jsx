import React, { useState } from "react";
import { Play } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";

export default function VideoSection() {
  const { site } = useI18n();
  const [playing, setPlaying] = useState(false);
  const facebookReelId = site.video.facebookReelId?.trim();
  const youtubeId = site.video.youtubeId?.trim();
  const facebookUrl = facebookReelId ? `https://www.facebook.com/reel/${encodeURIComponent(facebookReelId)}` : "";

  return (
    <Section id="video" kicker={site.video.kicker} title={site.video.title} className="sectionTint">
      <div className={`videoWrap${facebookReelId ? " videoWrapFacebook" : ""}`}>
        {facebookReelId ? (
          playing ? (
            <iframe
              src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookUrl)}&show_text=false&width=400`}
              title={site.video.title}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <>
              <button className="videoPoster" type="button" onClick={() => setPlaying(true)} aria-label={site.ui.playVideoLabel}>
                <span className="videoPlay"><Play size={42} fill="currentColor"/><strong>{site.ui.playVideo}</strong></span>
              </button>
              <a className="videoFacebookFallback" href={facebookUrl} target="_blank" rel="noopener noreferrer">Pozrieť video na Facebooku</a>
            </>
          )
        ) : youtubeId ? (
          playing ? (
            <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`} title={site.video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          ) : (
            <button className="videoPoster" type="button" onClick={() => setPlaying(true)} aria-label={site.ui.playVideoLabel}>
              <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt={site.ui.previousYearVideoAlt} loading="lazy" />
              <span className="videoPlay"><Play size={42} fill="currentColor"/><strong>{site.ui.playVideo}</strong></span>
            </button>
          )
        ) : (
          <div className="videoPlaceholder"><Play size={44}/><strong>YouTube video</strong><span>{site.video.caption}</span></div>
        )}
      </div>
    </Section>
  );
}
