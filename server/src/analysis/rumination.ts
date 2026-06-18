// Serverseitige Grübelschleifen-Signale (Phrasen + Intensität).
// Wird mit den Client-Signalen (mehrere Einträge/Tag/Thema, wiederholte Impulse)
// kombiniert — siehe web/src/lib/context.ts.

const PHRASES: RegExp[] = [
  /\bwarum macht (?:er|sie|es)\b/i,
  /\bwas bedeutet das\b/i,
  /\bwas,? wenn\b/i,
  /\bwas wäre,? wenn\b/i,
  /\bich muss (?:es )?(?:wissen|verstehen)\b/i,
  /\bich verstehe (?:es|das) nicht\b/i,
  /\bich halte das nicht (?:mehr )?aus\b/i,
  /\bimmer wieder\b/i,
];

/** Heuristik: viele Warum-/Was-wäre-wenn-Fragen oder hohe Intensität. */
export function detectRuminationSignals(text: string, intensity: number): boolean {
  let hits = 0;
  for (const re of PHRASES) if (re.test(text)) hits++;
  const questionMarks = (text.match(/\?/g) ?? []).length;
  if (hits >= 2) return true;
  if (hits >= 1 && intensity >= 8) return true;
  if (questionMarks >= 4 && intensity >= 7) return true;
  return false;
}
