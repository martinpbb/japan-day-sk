export function workshopPrice(workshop) {
  if (workshop.priceDisplay) return workshop.priceDisplay;
  if (workshop.paid == null) return "Cena bude doplnená";
  if (!workshop.paid) return "Zadarmo";
  if (workshop.priceCents == null) return "Cena bude doplnená";
  return new Intl.NumberFormat("sk-SK", { style: "currency", currency: workshop.currency || "EUR" }).format(workshop.priceCents / 100);
}

export function formatSession(session, durationMinutes) {
  const start = new Date(session.start);
  if (Number.isNaN(start.getTime())) return session.start || "";
  const format = (date) => new Intl.DateTimeFormat("sk-SK", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava" }).format(date);
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
