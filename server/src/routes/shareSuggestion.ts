import { Router } from "express";
import { z } from "zod";
import type { ShareSuggestionResponse } from "@journal/shared";
import { hasApiKey } from "../env";
import {
  buildShareSuggestionSystem,
  buildShareSuggestionUser,
} from "../prompts/builders";
import { generateText, LIGHT_MODEL, singleUser } from "../services/claude";
import { extractJson } from "../lib/extractJson";
import { detectCrisis } from "../safety/crisis";

// KI-Vorschlag für die Zitat-Karte: ein ruhiger, personalisierter Satz +
// passende Affirmation aus den Journal-Mustern. On-demand (Datenschutz: Text
// verlässt das Gerät nur auf Anforderung). Bei Krisensignalen: sanfter Fallback
// statt KI (keine muntere Affirmation auf schweren Eintragstext).
export const shareSuggestionRouter = Router();

const prefsSchema = z.object({
  style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
  length: z.enum(["kurz", "mittel", "ausführlich"]),
  model: z.string().min(1),
});

const entrySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  mood: z.number(),
  intensity: z.number(),
  emotions: z.array(z.string()),
  bodySignals: z.array(z.string()),
  topics: z.array(z.string()),
  needs: z.array(z.string()),
  impulse: z.string(),
  text: z.string(),
});

const schema = z.object({
  entries: z.array(entrySchema).min(1),
  prefs: prefsSchema,
});

// Sanfter Fallback bei Krisensignalen — kein KI-Aufruf, keine Bewertung.
const SAFE_FALLBACK: ShareSuggestionResponse = {
  sentence: "Es ist gerade *viel*. Das darf sein.",
  affirmation: "Ich darf mir Halt holen.",
  safe: false,
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max).trim();
}

shareSuggestionRouter.post("/share-suggestion", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { entries, prefs } = parsed.data;

  // Sicherheitsnetz: Krisensignale im Eintragstext → kein KI-Vorschlag.
  const combined = entries.map((e) => e.text).join("\n");
  if (detectCrisis(combined).flagged) {
    res.json(SAFE_FALLBACK);
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
    const raw = await generateText({
      // Mechanischer Kurztext (Karte) → fest LIGHT_MODEL, nicht das tiefe Modell.
      model: LIGHT_MODEL,
      system: buildShareSuggestionSystem(prefs.style),
      messages: singleUser(buildShareSuggestionUser(entries)),
      maxTokens: 320,
      effort: "low",
      think: false,
    });
    const obj = extractJson(raw) as {
      sentence?: unknown;
      affirmation?: unknown;
    };
    const sentence =
      typeof obj.sentence === "string" ? clip(obj.sentence, 160) : "";
    const affirmation =
      typeof obj.affirmation === "string" ? clip(obj.affirmation, 80) : "";

    // Robuster Fallback, falls das Modell nichts Brauchbares liefert.
    const response: ShareSuggestionResponse = {
      sentence: sentence || "Es darf heute *leicht* sein.",
      affirmation: affirmation || "Ich gehe freundlich mit mir um.",
      safe: true,
    };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Claude-Fehler: ${message}` });
  }
});
