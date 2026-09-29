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

export default function Breadcrumbs({ current, parent = null }) {
  const { locale, site } = useI18n();
  const { ui } = site;
  return (
    <nav className="breadcrumbs container" aria-label={ui.breadcrumbLabel}>
      <a href={addLocalePrefix("/", locale)}>{site.brand.name}</a>
      {parent ? (
        <>
          <span aria-hidden="true">›</span>
          <a href={addLocalePrefix(parent.path, locale)}>{parent.name}</a>
        </>
      ) : null}
      <span aria-hidden="true">›</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
