// Zentrale Quelle der Wahrheit für die Mood-Skala (vorher 1:1 dupliziert in
// MoodCard, JournalCard und Dashboard). Werte exakt wie zuvor — keine visuelle
// Änderung, nur Entdopplung (APP-STYLE §3).

/** Mood-Skala: clay (schwer) → gold → sage → grün (leicht). */
export const MOOD_SCALE = ["#CD8A5B", "#DDB14B", "#9BA383", "#A8E84F"] as const;

/** Lesbare Labels zur Mood-Skala (für Legenden). */
export const MOOD_LEGEND = [
  { c: MOOD_SCALE[0], label: "schwer" },
  { c: MOOD_SCALE[1], label: "gemischt" },
  { c: MOOD_SCALE[2], label: "okay" },
  { c: MOOD_SCALE[3], label: "leicht" },
] as const;

/** Punkt-Farben der drei Ritual-Recap-Antworten (clay · gold · sage). */
export const RITUAL_DOTS = [MOOD_SCALE[0], MOOD_SCALE[1], MOOD_SCALE[2]] as const;

/** Mood-Wert (1–10) → Farbe der 4-stufigen Skala. */
export function moodColor(v: number): string {
  if (v <= 3.5) return MOOD_SCALE[0];
  if (v <= 5.5) return MOOD_SCALE[1];
  if (v <= 7.5) return MOOD_SCALE[2];
  return MOOD_SCALE[3];
}
