import { Router } from "express";
import { z } from "zod";
import { hasApiKey } from "../env";
import { detectCrisis, CRISIS_MESSAGE } from "../safety/crisis";
import { detectRuminationSignals } from "../analysis/rumination";
import {
  buildReflectionSystem,
  buildReflectionUser,
  maxTokensFor,
} from "../prompts/builders";
import { singleUser, streamToResponse } from "../services/claude";

export const reflectRouter = Router();

const prefsSchema = z.object({
  style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
  length: z.enum(["kurz", "mittel", "ausführlich"]),
  model: z.string().min(1),
});

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

const reflectSchema = z.object({
  entry: z.object({
    text: z.string().min(1),
    mood: z.number(),
    intensity: z.number(),
    emotions: z.array(z.string()),
    bodySignals: z.array(z.string()),
    topics: z.array(z.string()),
    needs: z.array(z.string()),
    impulse: z.string(),
    intention: z.array(z.string()),
  }),
  context: z.object({
    recentDigest: z.array(digestSchema),
    latestPattern: z.any().nullable(),
  }),
  ruminationHint: z.boolean().optional(),
  intent: z.string().max(120).optional(),
  prefs: prefsSchema,
});

reflectRouter.post("/reflect", async (req, res) => {
  const parsed = reflectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { entry, context, ruminationHint, intent, prefs } = parsed.data;

  // 1. Krisen-Gate: deterministisch, ohne Claude-Call, auch ohne API-Key.
  const crisis = detectCrisis(entry.text);
  if (crisis.flagged) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Crisis", "1");
    res.send(CRISIS_MESSAGE);
    return;
  }

  // 2. Ohne API-Key freundlich erklären.
  if (!hasApiKey()) {
    res.status(503).json({
      error:
        "Es ist kein API-Key gesetzt. Lege `ANTHROPIC_API_KEY` in server/.env an (Vorlage: server/.env.example), dann starte das Backend neu.",
    });
    return;
  }

  // 3. Grübelschleife: Client-Signal ODER serverseitige Phrasen/Intensität.
  const rumination =
    Boolean(ruminationHint) ||
    detectRuminationSignals(entry.text, entry.intensity);
  if (rumination) res.setHeader("X-Rumination", "1");

  const system = buildReflectionSystem({
    style: prefs.style,
    length: prefs.length,
    rumination,
    intensity: entry.intensity,
    anliegen: intent,
  });
  const userText = buildReflectionUser(
    // Felder, die der Prompt nutzt; restliche Entry-Felder sind für die Reflexion irrelevant.
    {
      id: "",
      createdAt: "",
      updatedAt: "",
      aiReflection: null,
      crisisFlag: false,
      ruminationFlag: false,
      ...entry,
    },
    { recentDigest: context.recentDigest, latestPattern: context.latestPattern },
  );

  try {
    await streamToResponse(res, {
      model: prefs.model,
      system,
      messages: singleUser(userText),
      maxTokens: maxTokensFor(prefs.length, rumination),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    if (!res.headersSent) {
      res.status(502).json({ error: `Claude-Fehler: ${message}` });
    } else {
      res.write(`\n\n[Fehler: ${message}]`);
      res.end();
    }
  }
});
