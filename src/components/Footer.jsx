/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */

import React from "react";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
export default function Footer({ onCookieSettings }) {
  const { locale, site } = useI18n();
  const { ui } = site;
  const footerNavigation = site.navigation.filter((item) => [
    "/program",
    "/ucinkujuci",
    "/vystavovatelia",
    "/prakticke-informacie",
    "/kontakt"
  ].includes(item.path));

  return (
    <footer className="footer">
      <div className="container">
        <div className="footerColumns">
          <div className="footerColumn">
            <h2>Event</h2>
            <strong>{site.brand.name}</strong>
            <span>{site.brand.descriptor}</span>
            <span>{site.event.date}</span>
            <span>{site.event.venue}, {site.event.city}</span>
          </div>
          <nav className="footerColumn" aria-label={ui.importantLinks}>
            <h2>{ui.importantLinks}</h2>
            {footerNavigation.map((item) => <a key={item.path} href={addLocalePrefix(item.path, locale)}>{item.label}</a>)}
          </nav>
          <nav className="footerColumn" aria-label={ui.legalInformation}>
            <h2>{ui.legalInformation}</h2>
            {site.footer.legalLinks.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>)}
            <button className="footerCookieSettings" type="button" onClick={onCookieSettings}>{ui.cookieConsent.settings}</button>
          </nav>
        </div>
        <div className="footerBottom">
          <span>© 2026 {site.brand.name}</span>
          <span>{site.footer.note}</span>
          <div className="footerMark" aria-label="Japonsko">日本</div>
        </div>
      </div>
    </footer>
  );
}
