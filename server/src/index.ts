import express from "express";
import { env, hasApiKey } from "./env";
import { reflectRouter } from "./routes/reflect";

const app = express();
app.use(express.json({ limit: "2mb" }));

// Health-Check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Config: sagt dem Frontend u.a., ob der API-Key gesetzt ist (ohne den Key zu senden).
app.get("/api/config", (_req, res) => {
  res.json({ hasApiKey: hasApiKey() });
});

// API-Routen
app.use("/api", reflectRouter);
// Weitere folgen: /api/chat (Phase 4), /api/contact-impulse (Phase 5),
// /api/weekly-review (Phase 7)

app.listen(env.port, () => {
  console.log(`[server] läuft auf http://localhost:${env.port}`);
  if (!hasApiKey()) {
    console.warn(
      "[server] Achtung: ANTHROPIC_API_KEY ist nicht gesetzt. " +
        "Lege server/.env an (Vorlage: server/.env.example).",
    );
  }
});
