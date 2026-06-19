import express from "express";
import { hasApiKey, hasStt, hasTts } from "./env";
import { reflectRouter } from "./routes/reflect";
import { chatRouter } from "./routes/chat";
import { contactImpulseRouter } from "./routes/contactImpulse";
import { weeklyReviewRouter } from "./routes/weeklyReview";
import { voiceReflectRouter } from "./routes/voiceReflect";
import { ttsRouter } from "./routes/tts";
import { sttRouter } from "./routes/stt";
import { patternInsightsRouter } from "./routes/patternInsights";

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
  res.json({ hasApiKey: hasApiKey(), hasTts: hasTts(), hasStt: hasStt() });
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

export default app;
