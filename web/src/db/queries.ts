import { db, type Tombstone } from "./dexie";
import type {
  ChatMessage,
  ChatRole,
  DailyRitual,
  Decision,
  EnergyLevel,
  EntryDigest,
  RoutineDay,
  JournalEntry,
  OpenLoop,
  PatternFeedback,
  PatternInsight,
  PatternInsightDraft,
  PatternSummary,
  RestDay,
  StabilityKind,
  StabilityMoment,
  SyncKind,
  VoiceDraft,
} from "@journal/shared";
import { createId, nowIso } from "../lib/ids";
import { isOfferableVoiceDraft, isStaleVoiceDraft } from "../lib/voiceDraft";
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
  await recordStabilityMoment("schleife-geklaert", "Offene Schleife geklärt");
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

// --- Entscheidungs-Rückblick („Klärung") ----------------------------------

export function listDecisions(): Promise<Decision[]> {
  return db.decisions.orderBy("createdAt").reverse().toArray();
}

export async function createDecision(input: {
  question: string;
  leaning?: string;
  expectation?: string;
  feeling: number;
}): Promise<Decision> {
  const now = nowIso();
  const decision: Decision = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    question: input.question.trim(),
    leaning: input.leaning?.trim() || undefined,
    expectation: input.expectation?.trim() || undefined,
    feeling: input.feeling,
    status: "offen",
    feltRight: null,
  };
  await db.decisions.put(decision);
  notifyDataChanged();
  return decision;
}

export async function reviewDecision(
  id: string,
  review: { feltRight: boolean | null; reviewNote?: string },
): Promise<void> {
  const current = await db.decisions.get(id);
  if (!current) return;
  const now = nowIso();
  await db.decisions.put({
    ...current,
    status: "reflektiert",
    reviewedAt: now,
    reviewNote: review.reviewNote?.trim() || undefined,
    feltRight: review.feltRight,
    updatedAt: now,
  });
  await recordStabilityMoment(
    "entscheidung-reflektiert",
    "Entscheidung im Rückblick angeschaut",
  );
  notifyDataChanged();
}

export async function reopenDecision(id: string): Promise<void> {
  const current = await db.decisions.get(id);
  if (!current) return;
  await db.decisions.put({
    ...current,
    status: "offen",
    reviewedAt: undefined,
    reviewNote: undefined,
    feltRight: null,
    updatedAt: nowIso(),
  });
  notifyDataChanged();
}

export async function deleteDecision(id: string): Promise<void> {
  await db.transaction("rw", db.decisions, db.tombstones, async () => {
    await db.decisions.delete(id);
    await db.tombstones.put(tombstone("decisions", id, nowIso()));
  });
  notifyDataChanged();
}

// --- Tagesritual (6-Minuten-Ansatz) ---------------------------------------

/** Datums-Schlüssel des lokalen Tages (YYYY-MM-DD) = id des Tagesrituals. */
export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDailyRitual(date: string): Promise<DailyRitual | undefined> {
  return db.dailyRituals.get(date);
}

/** Alle Tagesrituale, neueste zuerst (für den Ritual-Verlauf). */
export async function listDailyRituals(): Promise<DailyRitual[]> {
  const all = await db.dailyRituals.orderBy("date").reverse().toArray();
  // Nur Tage mit tatsächlichem Inhalt zeigen.
  return all.filter(
    (r) =>
      (r.gratitude?.length ?? 0) > 0 ||
      (r.goodMoments?.length ?? 0) > 0 ||
      [r.makeGreat, r.affirmation, r.goodDeed, r.better].some(
        (s) => (s ?? "").trim().length > 0,
      ),
  );
}

/** Legt das Tagesritual an oder ergänzt es (ein Datensatz pro Tag). */
export async function upsertDailyRitual(
  date: string,
  patch: Partial<DailyRitual>,
): Promise<void> {
  const now = nowIso();
  const current = await db.dailyRituals.get(date);
  const base: DailyRitual = current ?? {
    id: date,
    date,
    createdAt: now,
    updatedAt: now,
    gratitude: [],
    goodMoments: [],
  };
  await db.dailyRituals.put({ ...base, ...patch, id: date, date, updatedAt: now });
  notifyDataChanged();
}

/**
 * Spiegelt das Tagesritual als normalen Tageseintrag in „Letzte Einträge"/Archiv
 * und in die Serie. Genau ein Eintrag pro Ritual-Tag (per `entryId` verknüpft).
 * Der Eintrag ist als `startIntent: "tagesritual"` markiert und wird aus der
 * Stimmungs-Statistik herausgefiltert (kein echter Mood-Eintrag).
 */
export async function syncRitualEntry(date: string): Promise<void> {
  const r = await db.dailyRituals.get(date);
  if (!r) return;

  const lines = [
    r.gratitude?.length ? `Dankbar: ${r.gratitude.join(", ")}` : "",
    r.makeGreat ? `Fokus: ${r.makeGreat}` : "",
    r.affirmation ? `Mein Satz: ${r.affirmation}` : "",
    r.goodDeed ? `Gutes getan: ${r.goodDeed}` : "",
    r.better ? `Besser: ${r.better}` : "",
    r.goodMoments?.length ? `Schöne Momente: ${r.goodMoments.join(", ")}` : "",
  ].filter(Boolean);

  const now = nowIso();

  // Kein Inhalt → ggf. vorhandenen verknüpften Eintrag entfernen.
  if (lines.length === 0) {
    if (r.entryId) {
      await deleteEntry(r.entryId);
      await db.dailyRituals.put({ ...r, entryId: undefined, updatedAt: now });
    }
    return;
  }

  const text = lines.join("\n");

  if (r.entryId) {
    const existing = await db.entries.get(r.entryId);
    if (existing) {
      await db.entries.put({
        ...existing,
        text,
        title: "Tagesritual",
        updatedAt: now,
      });
      notifyDataChanged();
      return;
    }
  }

  const id = createId();
  const entry: JournalEntry = {
    id,
    // Auf den Ritual-Tag datieren (sortiert in den richtigen Tag/Woche).
    createdAt: new Date(`${date}T12:00:00`).toISOString(),
    updatedAt: now,
    text,
    title: "Tagesritual",
    mood: 6,
    intensity: 3,
    emotions: [],
    bodySignals: [],
    topics: [],
    needs: [],
    impulse: "",
    intention: [],
    aiReflection: null,
    startIntent: "tagesritual",
    crisisFlag: false,
    ruminationFlag: false,
  };
  await db.entries.put(entry);
  await db.dailyRituals.put({ ...r, entryId: id, updatedAt: now });
  notifyDataChanged();
}

// --- Energie-Check ---------------------------------------------------------

export function getEnergyLevel(date: string): Promise<EnergyLevel | undefined> {
  return db.energyLevels.get(date);
}

export function listEnergyLevels(): Promise<EnergyLevel[]> {
  return db.energyLevels.orderBy("date").reverse().toArray();
}

/** Setzt den Energie-Wert für einen Tag (genau ein Wert pro Tag). */
export async function setEnergyLevel(date: string, level: number): Promise<void> {
  const now = nowIso();
  const current = await db.energyLevels.get(date);
  await db.energyLevels.put({
    id: date,
    date,
    level,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  });
  notifyDataChanged();
}

// --- Pausentag (Streak-Schutz) ---------------------------------------------

export function listRestDays(): Promise<RestDay[]> {
  return db.restDays.orderBy("date").reverse().toArray();
}

/** Löst einen Pausentag für `date` ein (idempotent — genau ein Eintrag/Tag). */
export async function addRestDay(date: string): Promise<void> {
  const existing = await db.restDays.get(date);
  if (existing) return;
  const now = nowIso();
  await db.restDays.put({ id: date, date, createdAt: now, updatedAt: now });
  notifyDataChanged();
}

// --- Routine-Wechsel -------------------------------------------------------

export function getRoutineDay(date: string): Promise<RoutineDay | undefined> {
  return db.routineDays.get(date);
}

export function listRoutineDays(): Promise<RoutineDay[]> {
  return db.routineDays.orderBy("date").reverse().toArray();
}

/** Setzt/ergänzt den Routine-Tag (ersetzt? + Auslöser) für einen Tag. */
export async function setRoutineDay(
  date: string,
  patch: Partial<Pick<RoutineDay, "replaced" | "trigger">>,
): Promise<void> {
  const now = nowIso();
  const current = await db.routineDays.get(date);
  await db.routineDays.put({
    id: date,
    date,
    replaced: patch.replaced ?? current?.replaced ?? false,
    trigger: patch.trigger ?? current?.trigger,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  });
  notifyDataChanged();
}

// --- Sprach-Entwürfe (lokaler Verlustschutz, NICHT gesynct) ----------------

/**
 * Legt einen Sprach-Entwurf an oder aktualisiert ihn (stabile id vom Aufrufer).
 * `createdAt` bleibt erhalten; `status` ist „aktiv". So überlebt das Transkript
 * einen Tab-Verlust, bevor daraus ein echter Eintrag wird.
 */
export async function upsertVoiceDraft(
  id: string,
  transcript: string,
): Promise<void> {
  const now = nowIso();
  const existing = await db.voiceDrafts.get(id);
  await db.voiceDrafts.put({
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    transcript,
    status: "aktiv",
  });
}

/** Jüngster aktiver, nicht-leerer Entwurf (< 24 h) — zum Wiederherstellen. */
export async function getOfferableVoiceDraft(): Promise<VoiceDraft | undefined> {
  const all = await db.voiceDrafts.toArray();
  return all
    .filter((d) => isOfferableVoiceDraft(d))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

/** Harte Löschung (z. B. nachdem aus dem Entwurf ein echter Eintrag wurde). */
export async function deleteVoiceDraft(id: string): Promise<void> {
  await db.voiceDrafts.delete(id);
}

/** Bewusstes Verwerfen: weich markieren (wird nicht mehr angeboten, später aufgeräumt). */
export async function discardVoiceDraft(id: string): Promise<void> {
  const d = await db.voiceDrafts.get(id);
  if (!d) return;
  await db.voiceDrafts.put({ ...d, status: "verworfen", updatedAt: nowIso() });
}

/** Räumt verworfene und zu alte Entwürfe auf (beim App-Start). */
export async function cleanupVoiceDrafts(): Promise<void> {
  const all = await db.voiceDrafts.toArray();
  const stale = all.filter((d) => isStaleVoiceDraft(d)).map((d) => d.id);
  if (stale.length) await db.voiceDrafts.bulkDelete(stale);
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
  // Lokale Sprach-Entwürfe ebenfalls entfernen (enthalten Roh-Text; nicht
  // gesynct, daher ohne Tombstone).
  await db.voiceDrafts.clear();
  notifyDataChanged();
}
