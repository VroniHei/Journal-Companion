import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/dexie";
import {
  getDailyRitual,
  getEnergyLevel,
  getRoutineDay,
  listDecisions,
  listEnergyLevels,
  listEntriesDesc,
  listMessages,
  listOpenLoops,
  listRestDays,
  listRoutineDays,
} from "../db/queries";
import { DEFAULT_SETTINGS } from "../lib/settings";
import type {
  AppSettings,
  ChatMessage,
  DailyRitual,
  Decision,
  EnergyLevel,
  JournalEntry,
  OpenLoop,
  RestDay,
  RoutineDay,
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

export function useDailyRitual(date: string): DailyRitual | undefined {
  return useLiveQuery(() => getDailyRitual(date), [date]);
}

export function useEnergyToday(date: string): EnergyLevel | undefined {
  return useLiveQuery(() => getEnergyLevel(date), [date]);
}

export function useEnergyLevels(): EnergyLevel[] {
  return useLiveQuery(() => listEnergyLevels(), [], []);
}

export function useRestDays(): RestDay[] {
  return useLiveQuery(() => listRestDays(), [], []);
}

export function useRoutineToday(date: string): RoutineDay | undefined {
  return useLiveQuery(() => getRoutineDay(date), [date]);
}

export function useRoutineDays(): RoutineDay[] {
  return useLiveQuery(() => listRoutineDays(), [], []);
}
