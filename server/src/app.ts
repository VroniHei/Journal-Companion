import express from "express";
import { hasApiKey } from "./env";
import { reflectRouter } from "./routes/reflect";
import { chatRouter } from "./routes/chat";
import { contactImpulseRouter } from "./routes/contactImpulse";
import { weeklyReviewRouter } from "./routes/weeklyReview";
import { voiceReflectRouter } from "./routes/voiceReflect";

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
  res.json({ hasApiKey: hasApiKey() });
});

// API-Routen
app.use("/api", reflectRouter);
app.use("/api", chatRouter);
app.use("/api", contactImpulseRouter);
app.use("/api", weeklyReviewRouter);
app.use("/api", voiceReflectRouter);

export default app;
