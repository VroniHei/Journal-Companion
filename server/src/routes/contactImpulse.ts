import { Router } from "express";
import { z } from "zod";
import type {
  ContactImpulseRecommendation,
  ContactImpulseResponse,
} from "@journal/shared";
import { hasApiKey } from "../env";
import { detectCrisis, CRISIS_MESSAGE } from "../safety/crisis";
import {
  buildContactImpulseSystem,
  buildContactImpulseUser,
} from "../prompts/builders";
import { generateText, singleUser } from "../services/claude";
import { extractJson } from "../lib/extractJson";

export const contactImpulseRouter = Router();

const RECOMMENDATIONS: ContactImpulseRecommendation[] = [
  "nicht-senden",
  "später-prüfen",
  "kurze-würdevolle-nachricht",
];

const schema = z.object({
  situation: z.string().min(1),
  goal: z.string(),
  activation: z.number().min(1).max(10),
  draft: z.string().optional(),
  prefs: z.object({
    style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
    length: z.enum(["kurz", "mittel", "ausführlich"]),
    model: z.string().min(1),
  }),
});

contactImpulseRouter.post("/contact-impulse", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { situation, goal, activation, draft, prefs } = parsed.data;

  // Krisen-Gate (deterministisch, ohne Claude/Key).
  if (detectCrisis(`${situation}\n${draft ?? ""}`).flagged) {
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
    const raw = await generateText({
      model: prefs.model,
      system: buildContactImpulseSystem(prefs.style),
      messages: singleUser(
        buildContactImpulseUser({ situation, goal, activation, draft }),
      ),
      maxTokens: 700,
    });

    let result: ContactImpulseResponse;
    try {
      const obj = extractJson(raw) as Partial<ContactImpulseResponse>;
      const recommendation = RECOMMENDATIONS.includes(
        obj.recommendation as ContactImpulseRecommendation,
      )
        ? (obj.recommendation as ContactImpulseRecommendation)
        : "später-prüfen";
      result = {
        recommendation,
        activationLevel:
          typeof obj.activationLevel === "number"
            ? obj.activationLevel
            : activation,
        likelyNeed: obj.likelyNeed ?? "",
        reflection: obj.reflection ?? "",
        why: obj.why ?? "",
        nextStep: obj.nextStep ?? "",
        // Nachricht nur, wenn eine würdevolle Kurzversion empfohlen ist.
        draftMessage:
          recommendation === "kurze-würdevolle-nachricht"
            ? obj.draftMessage
            : undefined,
      };
    } catch {
      // Fallback: lieber zurückhaltend („später prüfen") als drängen.
      result = {
        recommendation: "später-prüfen",
        activationLevel: activation,
        likelyNeed: "",
        reflection: raw.slice(0, 600),
        why: "Im Zweifel ist Abwarten der stabilere Schritt.",
        nextStep:
          "Einmal tief durchatmen und in 20 Minuten nochmal draufschauen.",
      };
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Claude-Fehler: ${message}` });
  }
});
