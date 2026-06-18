import "dotenv/config";

// Zentrale Konfiguration. Der API-Key wird nur hier (Backend) gelesen.
export const env = {
  port: Number(process.env.PORT ?? 3001),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
};

export function hasApiKey(): boolean {
  return env.anthropicApiKey.trim().length > 0;
}
