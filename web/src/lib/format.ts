export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Kompakt für Karten: „Heute, 09:14" · „Gestern, 18:40" · „Mo, 07:55". */
export function formatShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return `Heute, ${time}`;
  if (sameDay(d, yesterday)) return `Gestern, ${time}`;
  const weekday = d.toLocaleDateString("de-DE", { weekday: "short" });
  return `${weekday}, ${time}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
