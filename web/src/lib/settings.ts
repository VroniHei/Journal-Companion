import { db } from "../db/dexie";
import type { AppSettings, ClaudeModel, ResponsePrefs } from "@journal/shared";
import { APP_NAME } from "./appName";

const SETTINGS_ID = "app";

export const DEFAULT_SETTINGS: AppSettings = {
  id: SETTINGS_ID,
  appName: APP_NAME,
  userName: "",
  claudeModel: "claude-opus-4-8", // Standard: Opus für tiefe Reflexion (Produktkern)
  responseStyle: "klar",
  maxResponseLength: "mittel",
  apiMode: "claude",
  highQualityMode: false,
  autoSpeak: false,
  preferFreeSpeech: true,
  onboarded: false, // Erststart-Flow für neue, leere Profile zeigen
};

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: SETTINGS_ID });
}

/**
 * Modell für die tiefen Reflexions-Routen. Standard ist Opus (s. DEFAULT_SETTINGS);
 * der „Gründliche Modus" erzwingt Opus auch dann, wenn bewusst ein schlankeres
 * Modell gewählt wurde. Mechanische Routen (Titel, Teilen-Karte) ignorieren dies
 * und nutzen serverseitig fest Sonnet.
 */
export function effectiveModel(s: AppSettings): ClaudeModel {
  return s.highQualityMode ? "claude-opus-4-8" : s.claudeModel;
}

export function toPrefs(s: AppSettings): ResponsePrefs {
  return {
    style: s.responseStyle,
    length: s.maxResponseLength,
    model: effectiveModel(s),
  };
}
