// Krisen-Heuristik — DEFENSIVE SICHERHEITSSCHICHT (eine Quelle für Server + Web).
//
// WICHTIG: Bewusstes Sicherheitsnetz auf Stichwort-Basis, KEIN verlässlicher
// Krisendetektor. Zwei Stufen, angelehnt an die Risiko-Stufen des
// therapist-safety-Leitfadens:
//   - "acute"  (Level 3–4): explizite Suizid-/Selbstverletzungs-/Gefahr-Sprache
//                → feste, menschliche Sicherheitsantwort statt KI-Antwort.
//   - "concern"(Level 2):   indirekte Not/Hoffnungslosigkeit ohne Plan
//                → KEIN Block, aber ein warmer Hinweis auf echte Hilfe.
// `flagged` bleibt true NUR bei "acute" (rückwärtskompatibel: der Server
// blockt weiterhin nur bei akuten Treffern).

export type CrisisCategory = "suizid" | "selbstverletzung" | "gefahr" | "gewalt";
export type CrisisLevel = "none" | "concern" | "acute";

interface Pattern {
  category: CrisisCategory;
  re: RegExp;
}

// Akut (Level 3–4): eindeutige Formulierungen. Erweitert um passive
// Suizidalität & indirekte Hilferufe (Last-Sein, „besser ohne mich", Mittel/
// Abschied), die klinisch häufig sind.
const ACUTE: Pattern[] = [
  {
    category: "suizid",
    re: /\b(suizid|selbstmord|mich umbringen|umbringen will|nicht mehr leben|nicht mehr weiterleben|will(?:\s+nicht mehr)? sterben|sterben wollen|mein leben beenden|alles beenden|nicht mehr da sein|keinen sinn mehr (?:zu leben|im leben))\b/i,
  },
  {
    // explizite Todeswünsche
    category: "suizid",
    re: /\b((?:lieber|besser) tot|tot sein wollen|will(?: lieber)? tot sein|wünschte,? ich wäre tot|wäre (?:lieber|besser) tot|wäre besser,? (?:ich|wenn ich) nicht (?:mehr )?(?:da|hier|geboren))\b/i,
  },
  {
    // passive Suizidalität / Last-Sein
    category: "suizid",
    re: /\b(besser ohne mich|ohne mich (?:wär|wäre|ist) (?:es )?(?:besser|leichter)|(?:keiner|niemand) (?:würde|wird) mich vermissen|(?:für alle|allen|euch|jedem) (?:nur )?(?:eine )?last)\b/i,
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
    re: /\b(bringe mich (?:gleich )?um|mache schluss mit allem|will nicht mehr aufwachen|nicht mehr aufwachen wollen|abschiedsbrief|(?:tabletten|pillen|medikamente) (?:gesammelt|geschluckt))\b/i,
  },
];

// Sorge (Level 2): Überlastung/Hoffnungslosigkeit/Aufgeben ohne expliziten
// Todesbezug → weicher, nicht-blockierender Hinweis. Bewusst eng, um
// Fehlalarme klein zu halten („nicht mehr schlafen/arbeiten" ist KEIN Treffer).
const CONCERN: RegExp[] = [
  /\bich kann (?:einfach |grad(?:e)? |gerade )?nicht mehr\b(?!\s+(?:schlafen|arbeiten|warten|essen|atmen|aufstehen|klar denken|richtig denken))/i,
  /\bhalte (?:das|es) (?:alles )?nicht mehr aus\b/i,
  /\b(?:so )?(?:geht|kann) (?:es|das) (?:so )?nicht mehr weiter\b/i,
  /\b(?:alles|das alles) (?:ist|fühlt sich) (?:so |grad(?:e)? )?sinnlos\b/i,
  /\bmacht (?:alles )?keinen sinn (?:mehr)?\b/i,
  /\bnichts (?:hat|ergibt) (?:noch |mehr )?(?:einen )?sinn\b/i,
  /\bich gebe auf\b/i,
];

export interface CrisisResult {
  flagged: boolean;
  level: CrisisLevel;
  category?: CrisisCategory;
}

export function detectCrisis(text: string): CrisisResult {
  for (const { category, re } of ACUTE) {
    if (re.test(text)) return { flagged: true, level: "acute", category };
  }
  for (const re of CONCERN) {
    if (re.test(text)) return { flagged: false, level: "concern" };
  }
  return { flagged: false, level: "none" };
}

// Feste, warme, menschliche Sicherheitsantwort (kein Coaching, keine Analyse).
export const CRISIS_MESSAGE = `Was du gerade schreibst, klingt sehr schwer, und ich nehme das ernst.

Ich bin nur eine App und kann dir in einem solchen Moment nicht das geben, was du jetzt verdienst: einen echten Menschen.

Bitte wende dich an jemanden, der jetzt für dich da sein kann.

- Bei akuter Gefahr in Deutschland: 112
- TelefonSeelsorge (kostenlos, rund um die Uhr): 0800 111 0 111 oder 0800 111 0 222
- Nummer gegen Kummer (für junge Menschen): 116 111

Wenn es geht, ruf eine Person an, der du vertraust, und bleib nicht allein damit. Du bist es wert, dass dir geholfen wird.`;

// Weicher Hinweis (Level 2): validiert, drängt nicht, weist sanft auf echte Hilfe.
export const CONCERN_MESSAGE = `Das klingt gerade nach viel — und vielleicht nach mehr, als du allein tragen solltest.

Wenn es zu schwer wird, ist die TelefonSeelsorge rund um die Uhr und kostenlos für dich da: 0800 111 0 111. Du musst das nicht allein sortieren.`;

// Strukturierte Notfall-Ressourcen für einen immer sichtbaren, leisen Hilfe-Anker.
export const HELP_RESOURCES: { label: string; tel: string; display: string }[] = [
  { label: "Akute Gefahr", tel: "112", display: "112" },
  {
    label: "TelefonSeelsorge (24/7, kostenlos)",
    tel: "08001110111",
    display: "0800 111 0 111",
  },
];
