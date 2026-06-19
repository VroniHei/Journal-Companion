import { app } from "./app";
import { env, hasApiKey } from "./env";

// Lokaler Entwicklungs-Start (im Codespace / auf dem eigenen Rechner).
// Auf Vercel wird stattdessen api/index.ts als Serverless-Funktion genutzt.
app.listen(env.port, () => {
  console.log(`[server] läuft auf http://localhost:${env.port}`);
  if (!hasApiKey()) {
    console.warn(
      "[server] Achtung: ANTHROPIC_API_KEY ist nicht gesetzt. " +
        "Lege server/.env an (Vorlage: server/.env.example).",
    );
  }
});
