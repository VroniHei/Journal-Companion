import { Router } from "express";
import { z } from "zod";
import type { VoiceReflectResponse } from "@journal/shared";
import { hasApiKey } from "../env";
import { detectCrisis, CRISIS_MESSAGE } from "../safety/crisis";
import {
  buildVoiceReflectSystem,
  buildVoiceReflectUser,
} from "../prompts/builders";
import { generateText, singleUser, tuningFor } from "../services/claude";
import { extractJson } from "../lib/extractJson";

export const voiceReflectRouter = Router();

const schema = z.object({
  transcript: z.string().min(1),
  prefs: z.object({
    style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
    length: z.enum(["kurz", "mittel", "ausführlich"]),
    model: z.string().min(1),
  }),
});

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

voiceReflectRouter.post("/voice-reflect", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { transcript, prefs } = parsed.data;

  if (detectCrisis(transcript).flagged) {
    res.json({ crisis: true, message: CRISIS_MESSAGE });
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
    const tuning = tuningFor(prefs.model);
    const raw = await generateText({
      model: prefs.model,
      system: buildVoiceReflectSystem(prefs.style),
      messages: singleUser(buildVoiceReflectUser(transcript)),
      maxTokens: 900,
      effort: tuning.think ? "medium" : "low",
      think: false,
    });

    const obj = extractJson(raw) as Partial<VoiceReflectResponse>;
    const result: VoiceReflectResponse = {
      entrySummary: obj.entrySummary ?? "",
      mainEmotions: strArray(obj.mainEmotions),
      mainNeed: obj.mainNeed ?? "",
      mainTrigger: obj.mainTrigger ?? "",
      keyInsights: strArray(obj.keyInsights),
      supportiveImpulse: obj.supportiveImpulse ?? "",
      dontDoNow: strArray(obj.dontDoNow),
      nextStep: obj.nextStep ?? "",
    };
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Claude-Fehler: ${message}` });
  }
});
