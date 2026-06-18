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

export interface GenInput {
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
}

/** Bequemer Helfer: ein einzelner User-Text wird zu einer Nachricht. */
export function singleUser(text: string): ChatTurn[] {
  return [{ role: "user", content: text }];
}

/**
 * Streamt eine Claude-Antwort als text/plain in die Express-Response.
 * Adaptives Thinking; keine Sampling-Parameter (siehe docs/DECISIONS.md).
 */
export async function streamToResponse(res: Response, input: GenInput): Promise<void> {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const stream = getClient().messages.stream({
    model: input.model,
    max_tokens: input.maxTokens,
    thinking: { type: "adaptive" },
    system: input.system,
    messages: input.messages,
  });

  stream.on("text", (delta) => res.write(delta));
  await stream.finalMessage();
  res.end();
}

/** Nicht-streamende Variante: liefert den vollständigen Antworttext. */
export async function generateText(input: GenInput): Promise<string> {
  const message = await getClient().messages.create({
    model: input.model,
    max_tokens: input.maxTokens,
    thinking: { type: "adaptive" },
    system: input.system,
    messages: input.messages,
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
