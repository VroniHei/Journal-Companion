// Krisen-Heuristik — DEFENSIVE SICHERHEITSSCHICHT.
//
// WICHTIG: Dies ist ein bewusstes Sicherheitsnetz auf Stichwort-Basis, KEIN
// verlässlicher Krisendetektor. Es fängt einige klare Formulierungen ab. Bei
// einem Treffer wird KEINE normale KI-Antwort erzeugt, sondern eine feste,
// menschliche Sicherheitsantwort mit Hinweis auf echte Hilfe.

export type CrisisCategory =
  | "suizid"
  | "selbstverletzung"
  | "gefahr"
  | "gewalt";

interface Pattern {
  category: CrisisCategory;
  re: RegExp;
}

// Bewusst auf eindeutige Formulierungen fokussiert, um Fehlalarme zu begrenzen.
// Mehrdeutiges wie „ich halte das nicht aus" gilt als Grübel-Signal, nicht als Krise.
const PATTERNS: Pattern[] = [
  {
    category: "suizid",
    re: /\b(suizid|selbstmord|mich umbringen|umbringen will|nicht mehr leben|nicht mehr weiterleben|will(?:\s+nicht mehr)? sterben|sterben wollen|mein leben beenden|alles beenden|nicht mehr da sein|keinen sinn mehr (?:zu leben|im leben))\b/i,
  },
  {
    category: "selbstverletzung",
    re: /\b(mich (?:selbst )?verletzen|selbstverletzung|ritzen|mich schneiden|mir wehtun)\b/i,
  },
  {
    category: "gewalt",
    re: /\b(jemanden (?:umbringen|töten|verletzen)|ihn umbringen|sie umbringen)\b/i,
  },
  {
    category: "gefahr",
    re: /\b(bringe mich (?:gleich )?um|mache schluss mit allem|will nicht mehr aufwachen)\b/i,
  },
];

export interface CrisisResult {
  flagged: boolean;
  category?: CrisisCategory;
}

export function detectCrisis(text: string): CrisisResult {
  for (const { category, re } of PATTERNS) {
    if (re.test(text)) return { flagged: true, category };
  }
  return { flagged: false };
}

// Feste, warme, menschliche Sicherheitsantwort (kein Coaching, keine Analyse).
export const CRISIS_MESSAGE = `Was du gerade schreibst, klingt sehr schwer — und ich nehme das ernst.

Ich bin nur eine App und kann dir in einem solchen Moment nicht das geben, was du jetzt verdienst: einen echten Menschen.

Bitte wende dich an jemanden, der jetzt für dich da sein kann.

- Bei akuter Gefahr in Deutschland: 112
- TelefonSeelsorge (kostenlos, rund um die Uhr): 0800 111 0 111 oder 0800 111 0 222

Wenn es geht, ruf eine Person an, der du vertraust, und bleib nicht allein damit. Du bist es wert, dass dir geholfen wird.`;
