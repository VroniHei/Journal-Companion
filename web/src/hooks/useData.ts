import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/dexie";
import {
  listDecisions,
  listEntriesDesc,
  listMessages,
  listOpenLoops,
} from "../db/queries";
import { DEFAULT_SETTINGS } from "../lib/settings";
import type {
  AppSettings,
  ChatMessage,
  Decision,
  JournalEntry,
  OpenLoop,
} from "@journal/shared";

export function useSettings(): AppSettings {
  return useLiveQuery(() => db.settings.get("app")) ?? DEFAULT_SETTINGS;
}

export function useEntries(): JournalEntry[] {
  return useLiveQuery(() => listEntriesDesc(), [], []);
}

export function useEntry(id: string | undefined): JournalEntry | undefined {
  return useLiveQuery(() => (id ? db.entries.get(id) : undefined), [id]);
}

export function useMessages(entryId: string | undefined): ChatMessage[] {
  return useLiveQuery(
    () => (entryId ? listMessages(entryId) : Promise.resolve([])),
    [entryId],
    [],
  );
}

export function useOpenLoops(): OpenLoop[] {
  return useLiveQuery(() => listOpenLoops(), [], []);
}

export function useDecisions(): Decision[] {
  return useLiveQuery(() => listDecisions(), [], []);
}
