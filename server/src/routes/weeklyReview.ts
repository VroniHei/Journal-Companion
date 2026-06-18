import { Router } from "express";
import { z } from "zod";
import type { WeeklyReviewResponse } from "@journal/shared";
import { hasApiKey } from "../env";
import {
  buildWeeklyReviewSystem,
  buildWeeklyReviewUser,
} from "../prompts/builders";
import { generateText, singleUser } from "../services/claude";

export const weeklyReviewRouter = Router();

const digestSchema = z.object({
  createdAt: z.string(),
  mood: z.number(),
  intensity: z.number(),
  topics: z.array(z.string()),
  emotions: z.array(z.string()),
  needs: z.array(z.string()),
  impulse: z.string(),
  excerpt: z.string(),
});

const schema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  digests: z.array(digestSchema).max(60),
  prefs: z.object({
    style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
    length: z.enum(["kurz", "mittel", "ausführlich"]),
    model: z.string().min(1),
  }),
});

weeklyReviewRouter.post("/weekly-review", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { periodStart, periodEnd, digests, prefs } = parsed.data;

  if (!digests.length) {
    res.status(400).json({ error: "Für diesen Zeitraum gibt es keine Einträge." });
    return;
  }

  if (!hasApiKey()) {
    res.status(503).json({
      error:
        "Es ist kein API-Key gesetzt. Lege `ANTHROPIC_API_KEY` in server/.env an, dann starte das Backend neu.",
    });
    return;
  }

  try {
    const summary = await generateText({
      model: prefs.model,
      system: buildWeeklyReviewSystem(prefs.style),
      messages: singleUser(
        buildWeeklyReviewUser(periodStart, periodEnd, digests),
      ),
      maxTokens: 1500,
    });
    const response: WeeklyReviewResponse = { summary };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Claude-Fehler: ${message}` });
  }
});
