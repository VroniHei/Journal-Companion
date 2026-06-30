import Anthropic from "@anthropic-ai/sdk";
import type { Response } from "express";
import { env } from "../env";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface GenInput {
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
  /** Tiefe/Token-Aufwand. Niedriger = schneller. Default: kein output_config. */
  effort?: Effort;
  /** Adaptives Thinking aktivieren (langsamer, gründlicher). Default: aus. */
  think?: boolean;
}

/** Bequemer Helfer: ein einzelner User-Text wird zu einer Nachricht. */
export function singleUser(text: string): ChatTurn[] {
  return [{ role: "user", content: text }];
}

// Modell-Staffelung (vgl. CLAUDE.md):
// - DEEP_MODEL: tiefe, emotional bedeutsame Reflexion (Reflexion, Chat,
//   Wochenrückblick, Sprach-Reflexion, Kontaktimpuls, Muster). Qualität = Kern
//   des Produkts → Opus. Standardwahl der Nutzerin; per Einstellung änderbar.
// - LIGHT_MODEL: rein mechanische Kurztexte (Eintrags-Titel, Teilen-Karte). Hier
//   bringt Opus keinen Mehrwert → fest Sonnet, unabhängig von der Modellwahl.
export const DEEP_MODEL = "claude-opus-4-8";
export const LIGHT_MODEL = "claude-sonnet-4-6";

/**
 * Latenz/Qualität nach Modell: Sonnet (schlank) schnell, Opus (Standard für
 * tiefe Reflexion) gründlicher. Aufrufer können `effort` überschreiben.
 */
export function tuningFor(model: string): { effort: Effort; think: boolean } {
  const isOpus = model.includes("opus");
  return isOpus ? { effort: "high", think: true } : { effort: "medium", think: false };
}

// Die SDK-Typen dieser Version führen output_config/effort noch nicht; daher
// gezielt als Zusatzfeld anhängen (vom Endpoint unterstützt).
function buildParams(input: GenInput): Record<string, unknown> {
  const params: Record<string, unknown> = {
    model: input.model,
    max_tokens: input.maxTokens,
    system: input.system,
    messages: input.messages,
  };
  if (input.think) params.thinking = { type: "adaptive" };
  if (input.effort) params.output_config = { effort: input.effort };
  return params;
}

/**
 * Streamt eine Claude-Antwort als text/plain in die Express-Response.
 * Adaptives Thinking; keine Sampling-Parameter (siehe docs/DECISIONS.md).
 */
export async function streamToResponse(res: Response, input: GenInput): Promise<void> {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  // Auf Vercel ist echtes HTTP-Streaming über die gewrappte Express-Funktion
  // unzuverlässig (führt zu 500). Dort den vollständigen Text in einem Stück
  // senden — der Client liest den Body weiterhin als Stream (nur nicht Token für
  // Token). Lokal/Express bleibt es echtes Streaming für die feinere UX.
  if (process.env.VERCEL) {
    const text = await generateText(input);
    res.send(text);
    return;
  }

  const client = getClient();
  const stream = client.messages.stream(
    buildParams(input) as unknown as Parameters<typeof client.messages.stream>[0],
  );

  stream.on("text", (delta) => res.write(delta));
  await stream.finalMessage();
  res.end();
}

/** Nicht-streamende Variante: liefert den vollständigen Antworttext. */
export async function generateText(input: GenInput): Promise<string> {
  const client = getClient();
  const message = (await client.messages.create(
    buildParams(input) as unknown as Parameters<typeof client.messages.create>[0],
  )) as Anthropic.Message;
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
