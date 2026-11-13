import React from "react";
import { useI18n } from "../lib/useI18n.js";
import { addLocalePrefix } from "../lib/i18nPaths.js";
import { archiveBase } from "../lib/archiveRoutes.js";

export default function ArchiveNotice() {
  const { site, locale } = useI18n();
  return <aside className="container archiveNotice" aria-label={site.archive.label}>
    <div className="infoNote">
      <strong>{site.archive.label}</strong>
      <p>{site.archive.ended} {site.archive.registrationsClosed}</p>
      <a href={addLocalePrefix(`${archiveBase}/`, locale)}>{site.archive.browse}</a>
    </div>
  </aside>;
}
