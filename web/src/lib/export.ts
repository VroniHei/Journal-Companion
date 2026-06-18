import type { ChatMessage, JournalEntry, PatternSummary } from "@journal/shared";
import { db } from "../db/dexie";
import { formatDateTime } from "./format";

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function line(label: string, values: string[]): string {
  return values.length ? `- **${label}:** ${values.join(", ")}\n` : "";
}

export function entryToMarkdown(
  entry: JournalEntry,
  messages: ChatMessage[] = [],
): string {
  let md = `# Eintrag — ${formatDateTime(entry.createdAt)}\n\n`;
  md += `- **Stimmung:** ${entry.mood}/10 · **Intensität:** ${entry.intensity}/10\n`;
  md += line("Emotionen", entry.emotions);
  md += line("Körper", entry.bodySignals);
  md += line("Themen", entry.topics);
  md += line("Bedürfnisse", entry.needs);
  md += entry.impulse ? `- **Impuls:** ${entry.impulse}\n` : "";
  md += line("Absicht", entry.intention);
  md += `\n## Eintrag\n\n${entry.text}\n`;
  if (entry.aiReflection) {
    md += `\n## Reflexion des Begleiters\n\n${entry.aiReflection}\n`;
  }
  if (messages.length) {
    md += `\n## Gespräch\n\n`;
    for (const m of messages) {
      md += `**${m.role === "user" ? "Ich" : "Begleiter"}:** ${m.content}\n\n`;
    }
  }
  return md;
}

export async function downloadEntryMarkdown(entry: JournalEntry): Promise<void> {
  const messages = await db.chatMessages
    .where("entryId")
    .equals(entry.id)
    .sortBy("createdAt");
  download(
    `eintrag-${entry.createdAt.slice(0, 10)}.md`,
    entryToMarkdown(entry, messages),
    "text/markdown",
  );
}

export function patternToMarkdown(p: PatternSummary): string {
  const md = `# Wochenrückblick — ${p.periodStart.slice(0, 10)} bis ${p.periodEnd.slice(0, 10)}\n\n${p.summary}\n`;
  return md;
}

export function downloadPatternMarkdown(p: PatternSummary): void {
  download(
    `wochenrueckblick-${p.periodStart.slice(0, 10)}.md`,
    patternToMarkdown(p),
    "text/markdown",
  );
}

export async function exportAllJson(): Promise<void> {
  const [entries, chatMessages, patternSummaries, settings, stabilityMoments] =
    await Promise.all([
      db.entries.toArray(),
      db.chatMessages.toArray(),
      db.patternSummaries.toArray(),
      db.settings.toArray(),
      db.stabilityMoments.toArray(),
    ]);
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    entries,
    chatMessages,
    patternSummaries,
    settings,
    stabilityMoments,
  };
  download(
    `journal-companion-export-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}
