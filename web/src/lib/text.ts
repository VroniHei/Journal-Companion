/**
 * Heuristik: wirkt der Text wie ein unpunktierter „Worthaufen" (typisch für die
 * Browser-Spracherkennung)? Nur dann lohnt der Interpunktions-Pass — so sparen
 * wir den Aufruf, wenn z. B. ElevenLabs schon Satzzeichen geliefert hat.
 * Lang genug (≥ 12 Wörter) UND praktisch ohne Satz-Endezeichen.
 */
export function looksUnpunctuated(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const words = t.split(/\s+/).length;
  if (words < 12) return false;
  const sentenceMarks = (t.match(/[.!?…]/g) ?? []).length;
  // Verhältnis-Schwelle: weniger als ~1 Satz-Endezeichen je 15 Wörter wirkt wie
  // ein Worthaufen. Toleriert vereinzelte Abkürzungs-Punkte (z. B. „z.b.").
  return sentenceMarks * 15 < words;
}

// Entfernt das leichte Markdown (Überschriften, Fett/Kursiv, Listenzeichen) für
// die Sprachausgabe — gesprochen werden soll der reine Text, keine Sonderzeichen.
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}
