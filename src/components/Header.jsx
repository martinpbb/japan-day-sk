import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";

const localeLabels = {
  sk: { code: "SK", label: "Slovenčina" },
  en: { code: "EN", label: "English" },
  de: { code: "DE", label: "Deutsch" },
  es: { code: "ES", label: "Español" },
  zh: { code: "ZH", label: "中文" },
  vi: { code: "VI", label: "Tiếng Việt" }
};

function LanguageSwitcher({ onSelect }) {
  const { locale, setLocale, locales, site } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className={`languageSwitcher ${open ? "open" : ""}`} ref={wrapperRef}>
      <button
        className="languageSwitcherTrigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <strong>{localeLabels[locale].code}</strong>
        <span>{localeLabels[locale].label}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="languageSwitcherMenu" role="listbox" aria-label={site.ui.language}>
          {locales.map((item) => (
            <button
              className={item === locale ? "active" : ""}
              type="button"
              role="option"
              aria-selected={item === locale}
              key={item}
              onClick={() => {
                setLocale(item);
                setOpen(false);
                onSelect();
              }}
            >
              <strong>{localeLabels[item].code}</strong>
              <span>{localeLabels[item].label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const { locale, site } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="container headerRow">
        <a className="brand" href={addLocalePrefix("/", locale)} onClick={() => setOpen(false)} aria-label={site.ui.homeLabel}>
          <span className="brandSun" aria-hidden="true" />
          <span><strong>{site.brand.name}</strong><small>{site.brand.shortName}</small></span>
        </a>
        <nav className={`nav ${open ? "open" : ""}`} aria-label={site.ui.mainNavigation}>
          {site.navigation.map((item) => (
            <a key={item.path} href={addLocalePrefix(item.path, locale)} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          <LanguageSwitcher onSelect={() => setOpen(false)} />
        </nav>
        <button className="menuButton" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={site.ui.openMenu}>☰</button>
      </div>
    </header>
  );
}
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
