export function workshopPrice(workshop, copy, locale = "sk") {
  if (workshop.priceDisplay) {
    if (locale === "ja" && workshop.priceDisplay === "od 2 € za kus") return copy.pricePerPiece.replace("{price}", new Intl.NumberFormat("ja-JP", { style: "currency", currency: "EUR", currencyDisplay: "name" }).format(2));
    return workshop.priceDisplay;
  }
  if (workshop.paid == null || workshop.priceCents == null) return copy.pricePending;
  if (!workshop.paid) return copy.free;
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, { style: "currency", currency: workshop.currency || "EUR" }).format(workshop.priceCents / 100);
}

export function formatDuration(minutes, locale = "sk") {
  if (locale === "ja") return `${minutes}分`;
  return new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "short" }).format(minutes);
}

export function formatSession(session, durationMinutes, locale = "sk") {
  const start = new Date(session.start);
  if (Number.isNaN(start.getTime())) return session.start || "";
  const format = (date) => new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava", hourCycle: "h23" }).format(date);
  const startText = format(start);
  if (session.end_at) {
    const end = new Date(session.end_at);
    if (!Number.isNaN(end.getTime())) return `${startText} – ${format(end)}`;
  }
  return durationMinutes ? `${startText} – ${format(new Date(start.getTime() + durationMinutes * 60_000))}` : startText;
}

// Array entries reuse performer profiles; lecturerId remains a supported fallback.
export function workshopLecturers(workshop, performers) {
  const entries = workshop.lecturers ?? (workshop.lecturerId ? [{ performerId: workshop.lecturerId }] : []);
  return entries.map((entry) => entry.performerId
    ? { ...performers.find((person) => person.id === entry.performerId), role: entry.role }
    : entry).filter((person) => person.name);
}

export function lecturerRoleLabel(role, locale) {
  if (!role) return "";
  const labels = {
    lead: { sk: "hlavná lektorka", en: "lead instructor", de: "Hauptleitung", es: "instructora principal", ja: "主担当" },
    support: { sk: "podpora", en: "support", de: "Unterstützung", es: "apoyo", ja: "サポート" },
  };
  return labels[role]?.[locale] || labels[role]?.en || "";
}
