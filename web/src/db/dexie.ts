import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  ChatMessage,
  JournalEntry,
  PatternInsight,
  PatternSummary,
  StabilityMoment,
  SyncKind,
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
  tombstones!: Table<Tombstone, string>;

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
  }
}

export const db = new JournalDB();
