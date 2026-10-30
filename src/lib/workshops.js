export function workshopPrice(workshop) {
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
