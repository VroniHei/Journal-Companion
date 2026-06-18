import type { JournalEntry, ReflectionContext } from "@journal/shared";
import {
  getLatestPattern,
  recentDigests,
  sameTopicSameDayCount,
} from "../db/queries";

/** 3-Ebenen-Kontext: aktueller Eintrag (separat) + Verlaufs-Digest + Muster. */
export async function buildReflectionContext(
  entry: JournalEntry,
): Promise<ReflectionContext> {
  const [recentDigest, latestPattern] = await Promise.all([
    recentDigests(5, entry.id),
    getLatestPattern(),
  ]);
  return { recentDigest, latestPattern };
}

/** Client-Signal für Grübelschleifen: mehrere Einträge zum selben Thema am selben Tag. */
export async function clientRuminationHint(
  entry: JournalEntry,
): Promise<boolean> {
  const sameTopic = await sameTopicSameDayCount(entry);
  return sameTopic >= 2;
}
