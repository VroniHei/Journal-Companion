import { db } from "../db/dexie";
import type { AppSettings, ClaudeModel, ResponsePrefs } from "@journal/shared";
import { APP_NAME } from "./appName";

const SETTINGS_ID = "app";

export const DEFAULT_SETTINGS: AppSettings = {
  id: SETTINGS_ID,
  appName: APP_NAME,
  userName: "",
  claudeModel: "claude-sonnet-4-6", // Standard: kosteneffizient
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

/** High-Quality-Modus erzwingt Opus; sonst das gewählte Modell. */
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
