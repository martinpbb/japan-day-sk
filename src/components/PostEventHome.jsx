import React from "react";
import { Image, Play, Heart, MessageCircle, Sparkles } from "lucide-react";
import Hero from "./Hero.jsx";
import Section from "./Section.jsx";
import { PartnerList } from "./Partners.jsx";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { archiveBase, archiveSections } from "../lib/archiveRoutes.js";
import "../styles/post-event.css";

// Deliberately has no persistence or transport. Keep the guard even while the
// submit buttons are disabled, so Enter cannot navigate or send form values.
function preventSubmission(event) {
  event.preventDefault();
}

function Newsletter({ copy, common }) {
  return <aside className="postCard newsletterCard" aria-labelledby="newsletter-title">
    <div className="eyebrow">{copy.kicker}</div>
    <h3 id="newsletter-title">{copy.title}</h3>
    <p>{copy.intro}</p>
    <form onSubmit={preventSubmission} aria-labelledby="newsletter-title" aria-describedby="newsletter-unavailable">
      <label htmlFor="newsletter-name">{copy.name}</label>
      <input id="newsletter-name" name="name" autoComplete="given-name" maxLength={100} />
      <label htmlFor="newsletter-email">{copy.email}</label>
      <input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <label className="postConsent" htmlFor="newsletter-consent">
        <input id="newsletter-consent" name="consent" type="checkbox" required />
        <span>{copy.consent}</span>
      </label>
      <p className="postNotice" id="newsletter-unavailable">{common.unavailable}</p>
      <div className="postFormActions">
        <button className="button postSecondary" type="button" onClick={(event) => event.currentTarget.form.reportValidity()}>{common.validate}</button>
        <button className="button primary" type="submit" disabled>{copy.submit}</button>
      </div>
    </form>
  </aside>;
}

function Feedback({ copy, newsletter, common }) {
  return <section id="spatna-vazba" className="section postFeedback">
    <div className="container postFeedbackGrid">
      <div className="postFeedbackIntro"><div className="eyebrow">{copy.kicker}</div><h2>{copy.title}</h2><p className="postLead" id="feedback-anonymous">{copy.intro}</p><svg className="postFeedbackIllustration" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
        <circle className="postFeedbackIllustrationRing" cx="90" cy="90" r="76" />
        <path className="postFeedbackSteam" d="M69 72c-8-8 7-11 0-20m20 20c-8-8 7-11 0-20m20 20c-8-8 7-11 0-20" />
        <path className="postFeedbackCup" d="M54 80h65v27a23 23 0 0 1-23 23H77a23 23 0 0 1-23-23V80Zm65 8h9a12 12 0 0 1 0 24h-12" />
        <path className="postFeedbackSill" d="M48 137h78" />
        <path className="postFeedbackLeaf" d="M132 57c-13 1-21 9-21 20 12 1 21-6 21-20Zm-20 19 9-9" />
      </svg></div>
      <div className="postFeedbackForms">
      <form className="postCard feedbackForm" onSubmit={preventSubmission} aria-label={copy.title} aria-describedby="feedback-anonymous feedback-unavailable">
        <fieldset aria-describedby="rating-scale">
          <legend>{copy.rating}</legend>
          <p id="rating-scale">{copy.scale}</p>
          <div className="postRating">
            {[1, 2, 3, 4, 5].map(value => <label key={value}><input type="radio" name="rating" value={value} /><span>{value}</span></label>)}
          </div>
        </fieldset>
        <div className="postQuestions">
          {copy.questions.map((question, index) => <div key={index} className={index === copy.questions.length - 1 ? "postQuestionWide" : ""}>
            <label htmlFor={`feedback-${index}`}>{question}</label>
            <textarea id={`feedback-${index}`} name={`answer-${index}`} rows={3} maxLength={2000} />
          </div>)}
        </div>
        <p className="postNotice" id="feedback-unavailable">{common.unavailable}</p>
        <button className="button primary" type="submit" disabled>{copy.submit}</button>
      </form>
      <Newsletter copy={newsletter} common={common} />
      </div>
    </div>
  </section>;
}

export default function PostEventHome() {
  const { site, content, locale } = useI18n();
  const copy = site.postEvent;
  const href = path => addLocalePrefix(path, locale);
  return <main className="postEventHome">
    <Hero postEvent />
    <Feedback copy={copy.feedback} newsletter={copy.newsletter} common={copy.forms} />
    <section id="detska-sutaz" className="section postCompetition">
      <div className="container postCompetitionGrid"><div>
      <div className="eyebrow">{copy.competition.kicker}</div><h2>{copy.competition.title}</h2>
      <p className="postLead">{copy.competition.intro}</p>
      <p className="postThanks"><Heart size={20} aria-hidden="true" />{copy.competition.thanks}</p>
      </div><div className="postArtworkGrid">
        {copy.competition.cards.map((card, index) => <article className="postCard" key={card.title}>
          <div className="postPlaceholder" aria-hidden="true">{index === 2 ? <Image size={42} /> : <Sparkles size={36} />}</div>
          <span className="postStatus">{copy.pending}</span><h3>{card.title}</h3><p>{card.text}</p>
        </article>)}
      </div></div>
    </section>
    <Section id="fotky-videa" kicker={copy.memories.kicker} title={copy.memories.title} className="postMemories sectionDark">
      <p className="postLead">{copy.memories.intro}</p>
      <div className="postMemoryGrid">
        {copy.memories.photos.map((label, index) => <figure className={`postMemory postMemory${index + 1}`} key={label}>
          <div className="postMemoryArt" aria-hidden="true"><Image size={40} /></div>
          <figcaption><span className="postStatus">{copy.pending}</span><h3>{label}</h3><p>{copy.memories.photoPending}</p></figcaption>
        </figure>)}
        <figure className="postMemory postMemoryVideo">
          <div className="postMemoryArt" aria-hidden="true"><Play size={46} /></div>
          <figcaption><span className="postStatus">{copy.pending}</span><h3>{copy.memories.video}</h3><p>{copy.memories.videoPending}</p></figcaption>
        </figure>
      </div>
      <div className="postGalleryActions">
        <button className="button postSecondary" type="button" disabled aria-describedby="gallery-pending">{copy.memories.gallery}</button>
        <a className="postTextLink" href={href("/archiv/2026/galeria/")}>{copy.memories.archive}</a>
      </div>
      <p id="gallery-pending">{copy.memories.galleryPending}</p>
    </Section>
    <Section id="nase-plany" kicker={copy.plans.kicker} title={copy.plans.title} className="sectionTint postPlans">
      <p className="postLead">{copy.plans.intro}</p>
      <div className="postThreeColumns">
        {copy.plans.cards.map((card, index) => <article className="postCard" key={card.title}>
          {index === 0 ? <MessageCircle aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          <p className="postStatus">{copy.plans.status}</p><h3>{card.title}</h3><p>{card.text}</p>
        </article>)}
      </div>
      <a className="button primary" href={href("/kontakt/")}>{copy.plans.cta}</a>
    </Section>
    <section id="podakovanie" className="section postAcknowledgements"><div className="container postAcknowledgementsGrid">
      <div><div className="eyebrow">{copy.acknowledgements.kicker}</div><h2>{copy.acknowledgements.title}</h2>
      <div className="postThanksGroups">
        {copy.acknowledgements.groups.map((group, index) => <article key={group.title}>
          <h3>{group.title}</h3><p>{group.text}</p>
          {index === 1 ? <a className="postTextLink" href={href("/archiv/2026/ucinkujuci/")}>{copy.acknowledgements.guestsLink}</a> : null}
        </article>)}
      </div></div><div>
      <h3 className="subheading">{copy.acknowledgements.organizers}</h3><PartnerList items={content.partners.organizers} />
      <h3 className="subheading">{copy.acknowledgements.partners}</h3><PartnerList items={content.partners.partners} />
      </div></div></section>
    <section id="archiv" className="section postArchive"><div className="container">
      <div className="postArchiveBanner sectionDark"><div><div className="eyebrow">{copy.archive.kicker}</div><h2>{copy.archive.title}</h2>
      <p className="postLead">{copy.archive.intro}</p><a className="button primary" href={href("/archiv/2026/")}>{copy.archive.cta}</a></div><span aria-hidden="true">26</span></div>
      <div className="postArchiveGrid">{archiveSections.map(path => <a className="postCard" href={href(`${archiveBase}${path}/`)} key={path}>
        <span className="postStatus">2026</span><h3>{site.archive.cards[path].title}</h3><span aria-hidden="true">↗</span>
      </a>)}</div>
    </div></section>
  </main>;
}
