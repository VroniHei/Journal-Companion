import express from "express";
import { env, hasApiKey, hasStt, hasSync, hasTts } from "./env";
import { rateLimit } from "./lib/rateLimit";
import { reflectRouter } from "./routes/reflect";
import { chatRouter } from "./routes/chat";
import { contactImpulseRouter } from "./routes/contactImpulse";
import { weeklyReviewRouter } from "./routes/weeklyReview";
import { voiceReflectRouter } from "./routes/voiceReflect";
import { ttsRouter } from "./routes/tts";
import { sttRouter } from "./routes/stt";
import { patternInsightsRouter } from "./routes/patternInsights";
import { shareSuggestionRouter } from "./routes/shareSuggestion";
import { syncRouter } from "./routes/sync";
import { titleRouter } from "./routes/title";
import { punctuateRouter } from "./routes/punctuate";
import { summarizeConversationRouter } from "./routes/summarizeConversation";

// Die konfigurierte Express-App — ohne `listen`, damit sie sowohl lokal
// (server/src/index.ts) als auch als Vercel-Serverless-Funktion (api/index.ts)
// verwendet werden kann.
export const app = express();
app.use(express.json({ limit: "2mb" }));

// Health-Check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Config: sagt dem Frontend u.a., ob der API-Key gesetzt ist (ohne den Key zu senden).
app.get("/api/config", (_req, res) => {
  res.json({
    hasApiKey: hasApiKey(),
    hasTts: hasTts(),
    hasStt: hasStt(),
    hasSync: hasSync(),
  });
});

// Missbrauchsschutz: nur die teuren KI-/Sprach-Routen begrenzen. Ein einziger
// Gate-Filter (läuft genau einmal pro Anfrage) lässt Health, Config und den
// Geräte-Sync (nicht-KI, häufig getaktet) bewusst aus.
const aiLimiter = rateLimit({ max: env.rateLimitPerMin, windowMs: 60_000 });
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  if (req.path === "/api/health" || req.path === "/api/config") return next();
  if (req.path.startsWith("/api/sync")) return next();
  return aiLimiter(req, res, next);
});

// API-Routen
app.use("/api", reflectRouter);
app.use("/api", chatRouter);
app.use("/api", contactImpulseRouter);
app.use("/api", weeklyReviewRouter);
app.use("/api", voiceReflectRouter);
app.use("/api", ttsRouter);
app.use("/api", sttRouter);
app.use("/api", patternInsightsRouter);
app.use("/api", shareSuggestionRouter);
app.use("/api", syncRouter);
app.use("/api", titleRouter);
app.use("/api", punctuateRouter);
app.use("/api", summarizeConversationRouter);

export default app;
