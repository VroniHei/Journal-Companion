import { Router } from "express";
import { z } from "zod";
import { hasApiKey } from "../env";
import { generateText, singleUser } from "../services/claude";

// Erzeugt einen kurzen, treffenden Titel für einen Eintrag (winziger Claude-Aufruf).
// Bei fehlendem Key antwortet die Route mit 503; der Client nutzt dann den
// heuristischen Fallback.
export const titleRouter = Router();

const schema = z.object({
  text: z.string().min(1).max(6000),
  model: z.string().optional(),
});

const SYSTEM = `Erzeuge einen sehr kurzen, treffenden Titel für einen Tagebucheintrag.
- 3 bis 6 Wörter, Deutsch.
- Fasst das Kernthema oder Gefühl zusammen, NICHT die ersten Wörter des Textes.
- Keine Anführungszeichen, kein abschließender Punkt, keine Emojis, kein Präfix.
- Gib ausschließlich den Titel aus, sonst nichts.`;

titleRouter.post("/title", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  if (!hasApiKey()) {
    res.status(503).json({ error: "Kein API-Key konfiguriert." });
    return;
  }
  try {
    const raw = await generateText({
      model: parsed.data.model || "claude-sonnet-4-6",
      system: SYSTEM,
      messages: singleUser(parsed.data.text.slice(0, 4000)),
      maxTokens: 24,
    });
    const title = raw
      .split("\n")[0]
      .replace(/^["'„»«\s]+/, "")
      .replace(/["'“”»«\s.]+$/, "")
      .trim()
      .slice(0, 80);
    res.json({ title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Titel-Fehler: ${message}` });
  }
});
