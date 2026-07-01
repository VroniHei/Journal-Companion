import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  ChatMessage,
  DailyRitual,
  Decision,
  EnergyLevel,
  JournalEntry,
  RestDay,
  RoutineDay,
  OpenLoop,
  PatternInsight,
  PatternSummary,
  StabilityMoment,
  SyncKind,
  VoiceDraft,
  EntryEmbedding,
} from "@journal/shared";

/**
 * Grabstein für den Lösch-Sync: merkt sich, dass ein Datensatz gelöscht wurde,
 * damit die Löschung über Geräte propagiert und nicht wieder zurückkommt.
 */
export interface Tombstone {
  id: string; // `${kind}:${recordId}`
  kind: SyncKind;
  recordId: string;
  updatedAt: string; // Zeitpunkt der Löschung (ISO)
}

// Lokale Datenbank (IndexedDB). Optionaler Geräte-Sync über das Backend.
export class JournalDB extends Dexie {
  entries!: Table<JournalEntry, string>;
  chatMessages!: Table<ChatMessage, string>;
  patternSummaries!: Table<PatternSummary, string>;
  settings!: Table<AppSettings, string>;
  stabilityMoments!: Table<StabilityMoment, string>;
  patternInsights!: Table<PatternInsight, string>;
  openLoops!: Table<OpenLoop, string>;
  decisions!: Table<Decision, string>;
  dailyRituals!: Table<DailyRitual, string>;
  energyLevels!: Table<EnergyLevel, string>;
  routineDays!: Table<RoutineDay, string>;
  restDays!: Table<RestDay, string>;
  tombstones!: Table<Tombstone, string>;
  // Rein lokal, NICHT gesynct (kein SyncKind): Verlustschutz für Sprach-Entwürfe.
  voiceDrafts!: Table<VoiceDraft, string>;
  // Rein lokal, NICHT gesynct: Embeddings für den semantischen Rückblick.
  entryEmbeddings!: Table<EntryEmbedding, string>;

  constructor() {
    super("journal-companion");
    this.version(1).stores({
      // `*topics` = Multi-Entry-Index für spätere Themen-Abfragen
      entries: "id, createdAt, updatedAt, *topics",
      chatMessages: "id, entryId, createdAt",
      patternSummaries: "id, createdAt, periodStart, periodEnd",
      settings: "id",
    });
    this.version(2).stores({
      stabilityMoments: "id, createdAt, kind, entryId",
    });
    this.version(3).stores({
      patternInsights: "id, createdAt, updatedAt, patternType",
    });
    this.version(4).stores({
      tombstones: "id, updatedAt, kind",
    });
    this.version(5).stores({
      openLoops: "id, createdAt, updatedAt, status, entryId",
    });
    this.version(6).stores({
      decisions: "id, createdAt, updatedAt, status",
    });
    this.version(7).stores({
      dailyRituals: "id, date, updatedAt",
    });
    this.version(8).stores({
      energyLevels: "id, date, updatedAt",
    });
    this.version(9).stores({
      routineDays: "id, date, updatedAt",
    });
    this.version(10).stores({
      restDays: "id, date, updatedAt",
    });
    // Additiv: nur der neue lokale Store; bestehende Daten bleiben unberührt.
    this.version(11).stores({
      voiceDrafts: "id, updatedAt, status",
    });
    // Additiv: lokaler Embedding-Store für den semantischen Rückblick.
    this.version(12).stores({
      entryEmbeddings: "id, updatedAt, model",
    });
  }
}

export const db = new JournalDB();
