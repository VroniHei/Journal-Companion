import { db } from "./dexie";
import type {
  ChatMessage,
  ChatRole,
  EntryDigest,
  JournalEntry,
  PatternSummary,
  StabilityKind,
  StabilityMoment,
} from "@journal/shared";
import { createId, nowIso } from "../lib/ids";

// --- Einträge -------------------------------------------------------------

export type NewEntryInput = Pick<
  JournalEntry,
  | "text"
  | "mood"
  | "intensity"
  | "emotions"
  | "bodySignals"
  | "topics"
  | "needs"
  | "impulse"
  | "intention"
> &
  Partial<
    Pick<
      JournalEntry,
      | "startIntent"
      | "sleepQuality"
      | "movementToday"
      | "outsideToday"
      | "cannabisToday"
      | "inputType"
      | "transcript"
    >
  >;

export async function createEntry(input: NewEntryInput): Promise<JournalEntry> {
  const now = nowIso();
  const entry: JournalEntry = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    aiReflection: null,
    crisisFlag: false,
    ruminationFlag: false,
    ...input,
  };
  await db.entries.put(entry);
  return entry;
}

export function getEntry(id: string): Promise<JournalEntry | undefined> {
  return db.entries.get(id);
}

export async function updateEntry(
  id: string,
  patch: Partial<JournalEntry>,
): Promise<void> {
  const current = await db.entries.get(id);
  if (!current) return;
  await db.entries.put({ ...current, ...patch, id, updatedAt: nowIso() });
}

export async function deleteEntry(id: string): Promise<void> {
  await db.transaction("rw", db.entries, db.chatMessages, async () => {
    await db.chatMessages.where("entryId").equals(id).delete();
    await db.entries.delete(id);
  });
}

export function listEntriesDesc(): Promise<JournalEntry[]> {
  return db.entries.orderBy("createdAt").reverse().toArray();
}

// --- Chat -----------------------------------------------------------------

export async function addChatMessage(
  entryId: string,
  role: ChatRole,
  content: string,
): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: createId(),
    entryId,
    role,
    content,
    createdAt: nowIso(),
  };
  await db.chatMessages.put(msg);
  return msg;
}

export function listMessages(entryId: string): Promise<ChatMessage[]> {
  return db.chatMessages.where("entryId").equals(entryId).sortBy("createdAt");
}

// --- Muster ---------------------------------------------------------------

export function listPatternsDesc(): Promise<PatternSummary[]> {
  return db.patternSummaries.orderBy("createdAt").reverse().toArray();
}

export async function getLatestPattern(): Promise<PatternSummary | null> {
  const all = await db.patternSummaries
    .orderBy("createdAt")
    .reverse()
    .limit(1)
    .toArray();
  return all[0] ?? null;
}

export async function savePattern(p: PatternSummary): Promise<void> {
  await db.patternSummaries.put(p);
}

// --- Gentle Gamification: stabile Momente -------------------------------

export async function recordStabilityMoment(
  kind: StabilityKind,
  label: string,
  entryId?: string,
): Promise<void> {
  await db.stabilityMoments.put({
    id: createId(),
    createdAt: nowIso(),
    kind,
    label,
    entryId,
  });
}

export function listStabilityMoments(): Promise<StabilityMoment[]> {
  return db.stabilityMoments.orderBy("createdAt").reverse().toArray();
}

// --- Kontext-Digest (Ebene 2 des 3-Ebenen-Prompts) ------------------------

const EXCERPT_LEN = 280;

export function toDigest(e: JournalEntry): EntryDigest {
  return {
    createdAt: e.createdAt,
    mood: e.mood,
    intensity: e.intensity,
    topics: e.topics,
    emotions: e.emotions,
    needs: e.needs,
    impulse: e.impulse,
    excerpt:
      e.text.length > EXCERPT_LEN ? e.text.slice(0, EXCERPT_LEN) + "…" : e.text,
  };
}

/** Kurzer Digest der letzten Einträge (ohne den aktuellen). */
export async function recentDigests(
  limit = 5,
  excludeId?: string,
): Promise<EntryDigest[]> {
  const entries = await db.entries
    .orderBy("createdAt")
    .reverse()
    .limit(limit + 1)
    .toArray();
  return entries
    .filter((e) => e.id !== excludeId)
    .slice(0, limit)
    .map(toDigest);
}

/** Digests aller Einträge in einem Zeitraum (für den Wochenrückblick). */
export async function digestsInRange(
  startIso: string,
  endIso: string,
): Promise<EntryDigest[]> {
  const all = await db.entries.orderBy("createdAt").toArray();
  return all
    .filter((e) => e.createdAt >= startIso && e.createdAt <= endIso)
    .map(toDigest);
}

/** Anzahl jüngerer Einträge zum selben Thema am selben Tag (für Grübel-Hinweis). */
export async function sameTopicSameDayCount(entry: JournalEntry): Promise<number> {
  const day = entry.createdAt.slice(0, 10);
  const all = await db.entries.toArray();
  return all.filter(
    (e) =>
      e.id !== entry.id &&
      e.createdAt.slice(0, 10) === day &&
      e.topics.some((t) => entry.topics.includes(t)),
  ).length;
}
