import type { EntryDigest, JournalEntry, ReflectionContext } from "@journal/shared";
import {
  entriesByIds,
  getLatestPattern,
  recentDigests,
  recentEntries,
  sameTopicSameDayCount,
  toDigest,
} from "../db/queries";
import {
  embedIfReady,
  embeddingText,
  findSimilarEntries,
  isModelReady,
  isSemanticRecallEnabled,
} from "./embeddings";

// Untergrenze für die Aufnahme eines ähnlichen Eintrags. Bewusst niedrig: die
// Auswahl trägt vor allem über das Top-k-Ranking; sehr Unähnliches fällt raus.
const SEM_MIN_SCORE = 0.35;

/**
 * Thematisch ähnliche frühere Einträge als Digest — oder `null`, wenn der
 * semantische Rückblick nicht greift (Feature aus, Modell nicht geladen, kein
 * Referenz-Embedding, keine Treffer). Dann nutzt der Aufrufer wie bisher Recency.
 *
 * WICHTIG: wartet nie auf das Modell. `embedIfReady` liefert nur etwas, wenn das
 * Modell bereits warm ist; sonst sofort `null` → Recency für dieses eine Mal.
 */
async function semanticDigest(
  entry: JournalEntry,
  max: number,
): Promise<EntryDigest[] | null> {
  if (!isModelReady()) return null;
  if (!(await isSemanticRecallEnabled())) return null;
  const ref = await embedIfReady(embeddingText(entry));
  if (!ref) return null;

  const sims = await findSimilarEntries(ref, {
    k: max,
    excludeIds: [entry.id],
    minScore: SEM_MIN_SCORE,
  });
  if (!sims.length) return null;

  const semantic = await entriesByIds(sims.map((s) => s.id));
  // Recency dazumischen (Token-Budget knapp): Semantik zuerst, mit den letzten
  // Einträgen auffüllen, nach id entdoppeln, auf `max` deckeln.
  const recent = await recentEntries(max, entry.id);
  const seen = new Set(semantic.map((e) => e.id));
  const merged = [...semantic];
  for (const e of recent) {
    if (merged.length >= max) break;
    if (!seen.has(e.id)) {
      merged.push(e);
      seen.add(e.id);
    }
  }
  return merged.slice(0, max).map(toDigest);
}

/** 3-Ebenen-Kontext: aktueller Eintrag (separat) + Verlaufs-Digest + Muster. */
export async function buildReflectionContext(
  entry: JournalEntry,
): Promise<ReflectionContext> {
  const latestPattern = await getLatestPattern();
  const recentDigest =
    (await semanticDigest(entry, 5)) ?? (await recentDigests(5, entry.id));
  return { recentDigest, latestPattern };
}

/**
 * Hintergrundwissen fürs Gespräch: neuestes Muster-Summary + ein bewusst KNAPPER
 * Digest (3 Einträge). Mit aktivem semantischem Rückblick thematisch passend,
 * sonst die letzten 3 Einträge (unverändertes Verhalten).
 */
export async function buildChatContext(
  entry: JournalEntry,
): Promise<ReflectionContext> {
  const latestPattern = await getLatestPattern();
  const recentDigest =
    (await semanticDigest(entry, 3)) ?? (await recentDigests(3, entry.id));
  return { recentDigest, latestPattern };
}

/** Client-Signal für Grübelschleifen: mehrere Einträge zum selben Thema am selben Tag. */
export async function clientRuminationHint(
  entry: JournalEntry,
): Promise<boolean> {
  const sameTopic = await sameTopicSameDayCount(entry);
  return sameTopic >= 2;
}
