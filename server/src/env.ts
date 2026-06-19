import dotenv from "dotenv";

// `override: true` sorgt dafür, dass server/.env immer Vorrang vor evtl.
// bereits gesetzten Umgebungsvariablen hat (sonst gewinnt eine alte/leere Var).
dotenv.config({ override: true });

// Zentrale Konfiguration. Schlüssel werden nur hier (Backend) gelesen.
export const env = {
  port: Number(process.env.PORT ?? 3001),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Sprachausgabe (ElevenLabs) — optional. Wenn gesetzt, nutzt das Frontend die
  // natürliche neuronale Stimme statt der Browser-Sprachausgabe.
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  // Standard: „Brian" — tiefe, warme, natürliche männliche Stimme
  // (per ELEVENLABS_VOICE_ID überschreibbar).
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "nPczCjzI2devNBz1zQrb",
};

export function hasApiKey(): boolean {
  return env.anthropicApiKey.trim().length > 0;
}

export function hasTts(): boolean {
  return env.elevenLabsApiKey.trim().length > 0;
}
