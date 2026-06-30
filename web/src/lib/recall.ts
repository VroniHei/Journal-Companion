// Reine Ähnlichkeits-Mathematik für den semantischen Rückblick. Bewusst frei von
// Dexie/Modell, damit ohne IndexedDB/Netz testbar. Brute-Force-Cosine genügt
// (Eintragszahl im Hunderter-/Tausenderbereich; kein ANN-Index nötig).

export type Vector = number[] | Float32Array;

/** Kosinus-Ähnlichkeit zweier Vektoren (0, falls einer Null-Länge hat). */
export function cosineSimilarity(a: Vector, b: Vector): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface SimCandidate {
  id: string;
  vector: Vector;
}

export interface SimResult {
  id: string;
  score: number;
}

export interface FindSimilarOptions {
  /** Wie viele Treffer höchstens. */
  k?: number;
  /** Diese IDs ausschließen (z. B. der aktuelle Eintrag). */
  excludeIds?: string[];
  /** Mindest-Ähnlichkeit, um aufgenommen zu werden. */
  minScore?: number;
}

/** Top-k ähnlichste Kandidaten zu `ref`, absteigend nach Score. */
export function findSimilar(
  ref: Vector,
  candidates: SimCandidate[],
  opts: FindSimilarOptions = {},
): SimResult[] {
  const { k = 3, excludeIds, minScore = 0 } = opts;
  const exclude = excludeIds ? new Set(excludeIds) : null;
  const scored: SimResult[] = [];
  for (const c of candidates) {
    if (exclude?.has(c.id)) continue;
    const score = cosineSimilarity(ref, c.vector);
    if (score >= minScore) scored.push({ id: c.id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(0, k));
}
