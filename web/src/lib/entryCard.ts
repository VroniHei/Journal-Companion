import type { JournalEntry } from "@journal/shared";

// Ableitungen für die Journal-Karten.

// Typische Füllwort-Einstiege (v.a. bei Sprache), die als Titel nichtssagend sind.
const FILLER_OPENING =
  /^(ähm+|öhm+|also|ja|nun|hey|du|na ?ja|na|hm+|so|tja|halt|ok(ay)?|weißt du( was)?|sag mal|ich mein(e)?|ich wollt(e)? (nur )?sagen|ne|gell)[\s,.!?–-]+/i;

function trimFillerOpening(s: string): string {
  let prev = "";
  let cur = s.trimStart();
  while (cur && cur !== prev) {
    prev = cur;
    cur = cur.replace(FILLER_OPENING, "").trimStart();
  }
  return cur || s.trim();
}

function shorten(s: string): string {
  return s.length > 60 ? `${s.slice(0, 57).trimEnd()}…` : s;
}

/**
 * Titel der Karte. Bevorzugt den KI-Titel; sonst eine Zusammenfassung/den ersten
 * sinnvollen Satz (Füllwörter übersprungen); sonst Themen.
 */
export function entryTitle(e: JournalEntry): string {
  if (e.title?.trim()) return e.title.trim();

  const summary = e.entrySummary?.trim();
  if (summary) {
    const s = summary.split(/(?<=[.!?])\s/)[0]?.trim() ?? summary;
    if (s.length >= 8) return shorten(s);
  }

  const firstLine = e.text.split("\n")[0]?.trim() ?? "";
  const sentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() ?? firstLine;
  const base = trimFillerOpening(sentence || firstLine);
  if (base.length >= 8) return shorten(base);

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
