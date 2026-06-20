import { db, type Tombstone } from "./dexie";
import type {
  ChatMessage,
  ChatRole,
  EntryDigest,
  JournalEntry,
  OpenLoop,
  PatternFeedback,
  PatternInsight,
  PatternInsightDraft,
  PatternSummary,
  StabilityKind,
  StabilityMoment,
  SyncKind,
} from "@journal/shared";
import { createId, nowIso } from "../lib/ids";
import { notifyDataChanged } from "../lib/sync";

function tombstone(kind: SyncKind, recordId: string, at: string): Tombstone {
  return { id: `${kind}:${recordId}`, kind, recordId, updatedAt: at };
}

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
  notifyDataChanged();
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
  notifyDataChanged();
}

export async function deleteEntry(id: string): Promise<void> {
  await db.transaction(
    "rw",
    db.entries,
    db.chatMessages,
    db.tombstones,
    async () => {
      const msgIds = (
        await db.chatMessages.where("entryId").equals(id).toArray()
      ).map((m) => m.id);
      await db.chatMessages.where("entryId").equals(id).delete();
      await db.entries.delete(id);
      const now = nowIso();
      await db.tombstones.bulkPut([
        tombstone("entries", id, now),
        ...msgIds.map((mid) => tombstone("chatMessages", mid, now)),
      ]);
    },
  );
  notifyDataChanged();
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
  notifyDataChanged();
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
  notifyDataChanged();
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
  notifyDataChanged();
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

// --- Qualitative Muster (PatternInsight) ----------------------------------

export function listPatternInsights(): Promise<PatternInsight[]> {
  return db.patternInsights.orderBy("createdAt").reverse().toArray();
}

/** Speichert vom Modell gelieferte Muster als neue PatternInsights. */
export async function savePatternInsights(
  drafts: PatternInsightDraft[],
): Promise<PatternInsight[]> {
  const now = nowIso();
  const records: PatternInsight[] = drafts.map((d) => ({
    ...d,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    userFeedback: null,
    userConfirmed: null,
  }));
  await db.patternInsights.bulkPut(records);
  notifyDataChanged();
  return records;
}

export async function setPatternFeedback(
  id: string,
  feedback: PatternFeedback,
): Promise<void> {
  await db.patternInsights.update(id, {
    userFeedback: feedback,
    userConfirmed:
      feedback === "passt" ? true : feedback === "passt-nicht" ? false : null,
    updatedAt: nowIso(),
  });
  notifyDataChanged();
}

export async function setPatternNotes(id: string, notes: string): Promise<void> {
  await db.patternInsights.update(id, { userNotes: notes, updatedAt: nowIso() });
  notifyDataChanged();
}

export async function deletePatternInsight(id: string): Promise<void> {
  await db.transaction("rw", db.patternInsights, db.tombstones, async () => {
    await db.patternInsights.delete(id);
    await db.tombstones.put(tombstone("patternInsights", id, nowIso()));
  });
  notifyDataChanged();
}

// --- Offene Schleifen („Klärung") -----------------------------------------

export function listOpenLoops(): Promise<OpenLoop[]> {
  return db.openLoops.orderBy("createdAt").reverse().toArray();
}

export async function createOpenLoop(input: {
  title: string;
  note?: string;
  entryId?: string;
}): Promise<OpenLoop> {
  const now = nowIso();
  const loop: OpenLoop = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    title: input.title.trim(),
    note: input.note?.trim() || undefined,
    status: "offen",
    entryId: input.entryId,
  };
  await db.openLoops.put(loop);
  notifyDataChanged();
  return loop;
}

export async function updateOpenLoop(
  id: string,
  patch: Partial<Pick<OpenLoop, "title" | "note">>,
): Promise<void> {
  const current = await db.openLoops.get(id);
  if (!current) return;
  await db.openLoops.put({ ...current, ...patch, id, updatedAt: nowIso() });
  notifyDataChanged();
}

export async function resolveOpenLoop(
  id: string,
  resolutionNote?: string,
): Promise<void> {
  const current = await db.openLoops.get(id);
  if (!current) return;
  const now = nowIso();
  await db.openLoops.put({
    ...current,
    status: "geklärt",
    resolvedAt: now,
    resolutionNote: resolutionNote?.trim() || undefined,
    updatedAt: now,
  });
  notifyDataChanged();
}

export async function reopenOpenLoop(id: string): Promise<void> {
  const current = await db.openLoops.get(id);
  if (!current) return;
  await db.openLoops.put({
    ...current,
    status: "offen",
    resolvedAt: undefined,
    resolutionNote: undefined,
    updatedAt: nowIso(),
  });
  notifyDataChanged();
}

export async function deleteOpenLoop(id: string): Promise<void> {
  await db.transaction("rw", db.openLoops, db.tombstones, async () => {
    await db.openLoops.delete(id);
    await db.tombstones.put(tombstone("openLoops", id, nowIso()));
  });
  notifyDataChanged();
}

/** Löscht alle synchronisierten Inhalte und legt dafür Tombstones an. */
export async function clearAllData(): Promise<void> {
  await db.transaction(
    "rw",
    db.entries,
    db.chatMessages,
    db.patternSummaries,
    db.tombstones,
    async () => {
      const now = nowIso();
      const tombs: Tombstone[] = [];
      const collect = async (kind: SyncKind, ids: string[]) => {
        for (const rid of ids) tombs.push(tombstone(kind, rid, now));
      };
      await collect(
        "entries",
        (await db.entries.toCollection().primaryKeys()) as string[],
      );
      await collect(
        "chatMessages",
        (await db.chatMessages.toCollection().primaryKeys()) as string[],
      );
      await collect(
        "patternSummaries",
        (await db.patternSummaries.toCollection().primaryKeys()) as string[],
      );
      await db.entries.clear();
      await db.chatMessages.clear();
      await db.patternSummaries.clear();
      await db.tombstones.bulkPut(tombs);
    },
  );
  notifyDataChanged();
}
