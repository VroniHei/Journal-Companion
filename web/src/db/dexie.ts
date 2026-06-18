import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  ChatMessage,
  JournalEntry,
  PatternSummary,
} from "@journal/shared";

// Lokale Datenbank (IndexedDB). Keine Cloud, kein Login.
export class JournalDB extends Dexie {
  entries!: Table<JournalEntry, string>;
  chatMessages!: Table<ChatMessage, string>;
  patternSummaries!: Table<PatternSummary, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("journal-companion");
    this.version(1).stores({
      // `*topics` = Multi-Entry-Index für spätere Themen-Abfragen
      entries: "id, createdAt, updatedAt, *topics",
      chatMessages: "id, entryId, createdAt",
      patternSummaries: "id, createdAt, periodStart, periodEnd",
      settings: "id",
    });
  }
}

export const db = new JournalDB();
