/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React, { useState } from "react";
import { Send } from "lucide-react";
import Section from "./Section.jsx";
import { useI18n } from "../lib/useI18n.js";

export function ContactForm() {
  const { site } = useI18n(); const copy = site.contactForm;
  const [status, setStatus] = useState("idle"); const [message, setMessage] = useState("");
  async function handleSubmit(event) { event.preventDefault(); setStatus("sending"); setMessage(""); const form = event.currentTarget; try { const response = await fetch("https://formspree.io/f/xeajdqer", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(); form.reset(); setStatus("success"); setMessage(copy.success); } catch { setStatus("error"); setMessage(copy.error); } }
  return <div className="contactFormBlock"><div className="contactFormIntro"><div className="eyebrow">{copy.kicker}</div><h3>{copy.title}</h3><p>{copy.intro}</p></div><form className="contactForm" onSubmit={handleSubmit}><div className="contactFormGrid"><label className="contactField"><span>{copy.name.label}</span><input type="text" name="name" autoComplete="name" placeholder={copy.name.placeholder} required minLength={2} maxLength={100} /></label><label className="contactField"><span>{copy.email.label}</span><input type="email" name="email" autoComplete="email" placeholder={copy.email.placeholder} required maxLength={160} /></label></div><label className="contactField"><span>{copy.subject.label}</span><input type="text" name="subject" placeholder={copy.subject.placeholder} required minLength={3} maxLength={160} /></label><label className="contactField"><span>{copy.message.label}</span><textarea name="message" rows="7" placeholder={copy.message.placeholder} required minLength={10} maxLength={5000} /></label><label className="contactHoneypot" aria-hidden="true">Website<input type="text" name="_gotcha" tabIndex="-1" autoComplete="off" /></label><button className="contactSubmit" type="submit" disabled={status === "sending"}><span>{status === "sending" ? copy.sending : copy.submit}</span><Send size={17} /></button><div className="contactPrivacy">{copy.privacy}</div>{message ? <div className={`contactStatus ${status === "success" ? "isSuccess" : "isError"}`} role="status" aria-live="polite">{message}</div> : null}</form></div>;
}

export default function Contact() { const { content } = useI18n(); const route = content.seo.routes["/kontakt"]; return <Section id="kontakt" kicker={route.breadcrumb} title={route.h1}><ContactForm /></Section>; }
