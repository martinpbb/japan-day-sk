import { useContext } from "react";
import { EventArchiveContext } from "./eventArchiveContext.js";
import { archivePath } from "./archiveRoutes.js";
import { addLocalePrefix } from "./i18nPaths.js";
import { useI18n } from "./useI18n.js";

export function useEventArchive() {
  const archived = useContext(EventArchiveContext);
  const { locale } = useI18n();
  return { archived, eventHref: path => addLocalePrefix(archived ? archivePath(path) : path, locale) };
}
