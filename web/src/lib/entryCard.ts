import type { JournalEntry } from "@journal/shared";

// Ableitungen für die Journal-Karten — alles aus vorhandenen Feldern, ohne
// zusätzlichen KI-Aufruf.

/** Automatischer Titel: erster Satz/erste Zeile, sonst Themen. */
export function entryTitle(e: JournalEntry): string {
  const firstLine = e.text.split("\n")[0]?.trim() ?? "";
  const sentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() ?? firstLine;
  const base = sentence || firstLine;
  if (base.length >= 8) {
    return base.length > 60 ? `${base.slice(0, 57).trimEnd()}…` : base;
  }
  if (e.topics.length) return e.topics.slice(0, 2).join(" · ");
  return base || "Eintrag";
}

export type EntryMode = "text" | "voice" | "contact" | "rumination";

export const MODE_LABEL: Record<EntryMode, string> = {
  text: "Notiz",
  voice: "Sprache",
  contact: "Kontakt",
  rumination: "Schleife",
};

export function entryMode(e: JournalEntry): EntryMode {
  if (e.startIntent === "ihm-schreiben") return "contact";
  if (e.ruminationFlag || e.startIntent === "schleife") return "rumination";
  if (e.inputType === "voice") return "voice";
  return "text";
}

export type EntryStatus = "offen" | "sortiert" | "abgeschlossen";

export const STATUS_LABEL: Record<EntryStatus, string> = {
  offen: "offen",
  sortiert: "sortiert",
  abgeschlossen: "abgeschlossen",
};

export function entryStatus(
  e: JournalEntry,
  closedIds: Set<string>,
): EntryStatus {
  if (closedIds.has(e.id)) return "abgeschlossen";
  return e.aiReflection ? "sortiert" : "offen";
}

/** Kurze Zusammenfassung: KI-Summary falls vorhanden, sonst Textauszug. */
export function entrySummaryText(e: JournalEntry): string {
  if (e.entrySummary) return e.entrySummary;
  const t = e.text.trim().replace(/\s+/g, " ");
  return t.length > 160 ? `${t.slice(0, 157)}…` : t;
}
