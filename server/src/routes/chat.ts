import { Router } from "express";
import { z } from "zod";
import { hasApiKey } from "../env";
import { detectCrisis, CRISIS_MESSAGE } from "../safety/crisis";
import { buildChatSystem } from "../prompts/builders";
import { streamToResponse, tuningFor, type ChatTurn } from "../services/claude";

export const chatRouter = Router();

const prefsSchema = z.object({
  style: z.enum(["sanft", "klar", "direkt", "sehr-direkt-warm"]),
  length: z.enum(["kurz", "mittel", "ausführlich"]),
  model: z.string().min(1),
});

const chatSchema = z.object({
  entry: z.object({
    text: z.string(),
    mood: z.number(),
    intensity: z.number(),
    emotions: z.array(z.string()),
    bodySignals: z.array(z.string()),
    topics: z.array(z.string()),
    needs: z.array(z.string()),
    impulse: z.string(),
    intention: z.array(z.string()),
  }),
  conversationSummary: z.string().optional(),
  recentMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20),
  userMessage: z.string().min(1),
  prefs: prefsSchema,
});

const CHAT_MAX_TOKENS = 900;
const RECENT_LIMIT = 8; // nicht den ganzen Verlauf schicken (Kosten/Fokus)

chatRouter.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { entry, conversationSummary, recentMessages, userMessage, prefs } =
    parsed.data;

  // Krisen-Gate auch im Gespräch (auf die neue Nachricht).
  if (detectCrisis(userMessage).flagged) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Crisis", "1");
    res.send(CRISIS_MESSAGE);
    return;
  }

  if (!hasApiKey()) {
    res.status(503).json({
      error:
        "Es ist kein API-Key gesetzt. Lege `ANTHROPIC_API_KEY` in server/.env an, dann starte das Backend neu.",
    });
    return;
  }

  const system = buildChatSystem({
    style: prefs.style,
    entry: {
      id: "",
      createdAt: "",
      updatedAt: "",
      aiReflection: null,
      crisisFlag: false,
      ruminationFlag: false,
      ...entry,
    },
    conversationSummary,
  });

  const messages: ChatTurn[] = [
    ...recentMessages.slice(-RECENT_LIMIT),
    { role: "user", content: userMessage },
  ];

  const tuning = tuningFor(prefs.model);
  try {
    await streamToResponse(res, {
      model: prefs.model,
      system,
      messages,
      maxTokens: CHAT_MAX_TOKENS,
      // Gespräch soll snappy sein.
      effort: "low",
      think: tuning.think,
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
