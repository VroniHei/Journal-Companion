import dotenv from "dotenv";

// `override: true` sorgt dafür, dass server/.env immer Vorrang vor evtl.
// bereits gesetzten Umgebungsvariablen hat (sonst gewinnt eine alte/leere Var).
dotenv.config({ override: true });

// Zentrale Konfiguration. Der API-Key wird nur hier (Backend) gelesen.
export const env = {
  port: Number(process.env.PORT ?? 3001),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
};

export function hasApiKey(): boolean {
  return env.anthropicApiKey.trim().length > 0;
}
