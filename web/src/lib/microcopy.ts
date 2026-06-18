import type { JournalEntry } from "@journal/shared";

// Gentle Gamification: warme, ruhige Bestärkungen — kein Kitsch, kein Druck.
// Belohnt Selbstführung (sortieren, Impuls halten, Schleife erkennen), NICHT App-Nutzung.

export function reflectionMicrocopy(entry: JournalEntry): string {
  if (entry.ruminationFlag) {
    return "Du hast gemerkt, dass du in einer Schleife bist. Genau da beginnt Selbstführung.";
  }
  if (entry.impulse === "ihm schreiben") {
    return "Du hast erst sortiert, bevor du gehandelt hast. Das zählt.";
  }
  if (entry.needs.length > 0) {
    return "Du hast benannt, was du brauchst. Das ist schon ein Schritt.";
  }
  return "Du hast dir einen Moment genommen, das zu sortieren. Das zählt.";
}

export const CLOSE_MICROCOPY =
  "Für heute schließen wir die Akte. Dein Nervensystem dankt (widerwillig).";
