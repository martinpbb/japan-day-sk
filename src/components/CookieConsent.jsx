import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/useI18n.js";

export const COOKIE_CONSENT_KEY = "japanday_cookie_consent";

function updateConsent(preference) {
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    analytics_storage: preference === "analytics" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function readConsent() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch {
    return null;
  }
}

export default function CookieConsent({ isOpen, onClose }) {
  const { site } = useI18n();
  const copy = site.ui.cookieConsent;
  const [preference, setPreference] = useState(readConsent);
  const visible = isOpen || !preference;

  useEffect(() => {
    if (preference) updateConsent(preference);
  }, [preference]);

  const savePreference = (nextPreference) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, nextPreference);
    } catch {
      // Consent still applies for this session when storage is unavailable.
    }
    setPreference(nextPreference);
    updateConsent(nextPreference);
    onClose();
  };

  if (!visible) return null;

  return (
    <section className="cookieConsent" role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
      <div className="cookieConsentContent">
        <h2 id="cookie-consent-title">{copy.title}</h2>
        <p>{copy.text}</p>
      </div>
      <div className="cookieConsentActions">
        <button className="cookieConsentNecessary" type="button" onClick={() => savePreference("necessary")}>{copy.necessary}</button>
        <button className="button primary cookieConsentAccept" type="button" onClick={() => savePreference("analytics")}>{copy.analytics}</button>
      </div>
    </section>
  );
}
