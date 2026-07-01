import { Router } from "express";
import { z } from "zod";
import { hasApiKey } from "../env";
import {
  CONVERSATION_SUMMARY_SYSTEM,
  buildConversationSummaryUser,
} from "../prompts/builders";
import { generateText, LIGHT_MODEL, singleUser } from "../services/claude";

// Verdichtet ein laufendes Gespräch zu einer kurzen, fortschreibbaren
// Zusammenfassung (mechanisch, schlankes Modell → fest LIGHT_MODEL). So bleibt
// der teure Chat-Prompt kompakt, ohne älteren Kontext zu verlieren. Bei
// fehlendem Key antwortet die Route mit 503; der Client behält dann einfach die
// bisherige (oder keine) Zusammenfassung — nie blockierend.
export const summarizeConversationRouter = Router();

const schema = z.object({
  entry: z.object({
    text: z.string(),
    topics: z.array(z.string()),
    emotions: z.array(z.string()),
    needs: z.array(z.string()),
  }),
  previousSummary: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1)
    .max(60),
});

const SUMMARY_MAX_TOKENS = 320;

summarizeConversationRouter.post("/summarize-conversation", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  if (!hasApiKey()) {
    res.status(503).json({ error: "Kein API-Key konfiguriert." });
    return;
  }

  const { entry, previousSummary, messages } = parsed.data;
  try {
    const raw = await generateText({
      model: LIGHT_MODEL,
      system: CONVERSATION_SUMMARY_SYSTEM,
      messages: singleUser(
        buildConversationSummaryUser({ entry, previousSummary, messages }),
      ),
      maxTokens: SUMMARY_MAX_TOKENS,
      effort: "low",
    });
    res.json({ summary: raw.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Zusammenfassungs-Fehler: ${message}` });
  }
});
