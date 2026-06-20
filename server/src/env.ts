import dotenv from "dotenv";

// `override: true` sorgt dafür, dass server/.env immer Vorrang vor evtl.
// bereits gesetzten Umgebungsvariablen hat (sonst gewinnt eine alte/leere Var).
dotenv.config({ override: true });

// Zentrale Konfiguration. Schlüssel werden nur hier (Backend) gelesen.
export const env = {
  port: Number(process.env.PORT ?? 3001),
  // .trim() schützt vor versehentlichen Leerzeichen/Zeilenumbrüchen beim
  // Einfügen in Env-Variablen (sonst: 401 invalid x-api-key).
  anthropicApiKey: (process.env.ANTHROPIC_API_KEY ?? "").trim(),
  // Sprachausgabe (ElevenLabs) — optional. Wenn gesetzt, nutzt das Frontend die
  // natürliche neuronale Stimme statt der Browser-Sprachausgabe.
  elevenLabsApiKey: (process.env.ELEVENLABS_API_KEY ?? "").trim(),
  // Standard: „Brian" — tiefe, warme, natürliche männliche Stimme
  // (per ELEVENLABS_VOICE_ID überschreibbar).
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "nPczCjzI2devNBz1zQrb",
  // Geräte-Sync (Supabase Postgres) — optional. Nur server-seitig. Wenn gesetzt,
  // gleicht die App Einträge/Chats/Muster zwischen Geräten ab. Der Service-Key
  // ist geheim und darf NIE ins Frontend.
  supabaseUrl: (process.env.SUPABASE_URL ?? "").trim(),
  supabaseServiceKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
};

export function hasApiKey(): boolean {
  return env.anthropicApiKey.trim().length > 0;
}

export function hasTts(): boolean {
  return env.elevenLabsApiKey.trim().length > 0;
}

// Speech-to-Text nutzt denselben ElevenLabs-Key (Scribe).
export function hasStt(): boolean {
  return env.elevenLabsApiKey.trim().length > 0;
}

// Geräte-Sync ist aktiv, sobald Supabase-URL und Service-Key gesetzt sind.
export function hasSync(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseServiceKey.length > 0;
}
