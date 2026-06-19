import { Router } from "express";
import { z } from "zod";
import type {
  PatternConfidence,
  PatternInsightDraft,
  PatternType,
} from "@journal/shared";
import { hasApiKey } from "../env";
import {
  buildPatternInsightsSystem,
  buildPatternInsightsUser,
} from "../prompts/builders";
import { generateText, singleUser, tuningFor } from "../services/claude";
import { extractJson } from "../lib/extractJson";

export const patternInsightsRouter = Router();

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
  patternSummary: z.string().optional(),
  existingPatterns: z
    .array(
      z.object({
        title: z.string(),
        patternType: z.string(),
        userFeedback: z.string().nullable().optional(),
      }),
    )
    .optional(),
  timeframe: z.enum(["7tage", "30tage", "alle"]),
  depth: z.enum(["kurz", "mittel", "tief"]),
  prefs: prefsSchema,
});

const PATTERN_TYPES: PatternType[] = [
  "rumination",
  "avoidance",
  "action-pressure",
  "contact-impulse",
  "self-worth",
  "regulation",
  "relationship",
  "decision-making",
  "overload",
  "other",
];
const CONFIDENCES: PatternConfidence[] = ["niedrig", "mittel", "hoch"];

function strArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function maxTokensFor(depth: "kurz" | "mittel" | "tief"): number {
  if (depth === "kurz") return 1000;
  if (depth === "mittel") return 1800;
  return 2800;
}

function sanitize(raw: unknown, knownIds: Set<string>): PatternInsightDraft[] {
  const obj = raw as { patterns?: unknown };
  const list = Array.isArray(obj.patterns) ? obj.patterns : [];
  const out: PatternInsightDraft[] = [];
  for (const item of list) {
    const p = item as Record<string, unknown>;
    const title = typeof p.title === "string" ? p.title.trim() : "";
    if (!title) continue;
    const patternType = PATTERN_TYPES.includes(p.patternType as PatternType)
      ? (p.patternType as PatternType)
      : "other";
    const confidence = CONFIDENCES.includes(p.confidence as PatternConfidence)
      ? (p.confidence as PatternConfidence)
      : "mittel";
    const draft: PatternInsightDraft = {
      title,
      shortName: typeof p.shortName === "string" ? p.shortName : undefined,
      description: typeof p.description === "string" ? p.description : "",
      patternType,
      confidence,
      triggerSignals: strArray(p.triggerSignals),
      typicalSequence: strArray(p.typicalSequence),
      emotionalSignals: strArray(p.emotionalSignals),
      bodySignals: strArray(p.bodySignals),
      needsBehindIt: strArray(p.needsBehindIt),
      helpfulSide: typeof p.helpfulSide === "string" ? p.helpfulSide : "",
      difficultSide: typeof p.difficultSide === "string" ? p.difficultSide : "",
      earlyWarningSigns: strArray(p.earlyWarningSigns),
      interruptionStrategies: strArray(p.interruptionStrategies),
      dontDoNow: strArray(p.dontDoNow),
      exampleEntryIds: strArray(p.exampleEntryIds).filter((id) =>
        knownIds.has(id),
      ),
      suggestedExperiment:
        typeof p.suggestedExperiment === "string"
          ? p.suggestedExperiment
          : undefined,
      reflectionQuestion:
        typeof p.reflectionQuestion === "string"
          ? p.reflectionQuestion
          : undefined,
    };
    out.push(draft);
  }
  return out;
}

patternInsightsRouter.post("/pattern-insights", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  const { entries, patternSummary, existingPatterns, timeframe, depth, prefs } =
    parsed.data;

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
      system: buildPatternInsightsSystem(prefs.style, depth),
      messages: singleUser(
        buildPatternInsightsUser({
          entries,
          patternSummary,
          existingPatterns: existingPatterns as never,
          timeframe,
        }),
      ),
      maxTokens: maxTokensFor(depth),
      effort: tuning.think ? "medium" : "low",
      think: depth === "tief" && tuning.think,
    });

    const knownIds = new Set(entries.map((e) => e.id));
    const patterns = sanitize(extractJson(raw), knownIds);
    res.json({ patterns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Claude-Fehler: ${message}` });
  }
});
