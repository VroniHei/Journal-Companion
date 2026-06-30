import type { Table } from "dexie";
import type { ChatMessage, JournalEntry, PatternSummary } from "@journal/shared";
import { db } from "../db/dexie";
import { formatDateTime } from "./format";
import { notifyDataChanged } from "./sync";

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

/** Lädt beliebigen Text als lokale Datei herunter (z. B. eine Zusammenfassung). */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/markdown",
): void {
  download(filename, content, mime);
}

function line(label: string, values: string[]): string {
  return values.length ? `- **${label}:** ${values.join(", ")}\n` : "";
}

export function entryToMarkdown(
  entry: JournalEntry,
  messages: ChatMessage[] = [],
): string {
  let md = `# Eintrag vom ${formatDateTime(entry.createdAt)}\n\n`;
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
  const md = `# Wochenrückblick ${p.periodStart.slice(0, 10)} bis ${p.periodEnd.slice(0, 10)}\n\n${p.summary}\n`;
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
  const [
    entries,
    chatMessages,
    patternSummaries,
    settings,
    stabilityMoments,
    patternInsights,
    openLoops,
    decisions,
  ] = await Promise.all([
    db.entries.toArray(),
    db.chatMessages.toArray(),
    db.patternSummaries.toArray(),
    db.settings.toArray(),
    db.stabilityMoments.toArray(),
    db.patternInsights.toArray(),
    db.openLoops.toArray(),
    db.decisions.toArray(),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    version: 2,
    entries,
    chatMessages,
    patternSummaries,
    settings,
    stabilityMoments,
    patternInsights,
    openLoops,
    decisions,
  };
  download(
    `journal-companion-export-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

// --- Import (Sicherung zurückspielen) -------------------------------------

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
}

interface Versioned {
  id: string;
  updatedAt?: string;
  createdAt?: string;
}

const versionOf = (r: Versioned): string =>
  String(r.updatedAt ?? r.createdAt ?? "");

/**
 * Spielt eine zuvor exportierte JSON-Sicherung zurück. Zusammenführend (merge):
 * vorhandene Einträge bleiben erhalten; ein Datensatz wird nur überschrieben,
 * wenn die Sicherung neueren oder gleichen Stand hat. Einstellungen werden
 * bewusst NICHT importiert (geräte-spezifisch, z.B. Stimme).
 */
export async function importAllJson(file: File): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("Die Datei ist keine gültige JSON-Sicherung.");
  }
  const data = parsed as Record<string, unknown>;

  const t = (x: unknown) => x as unknown as Table<Versioned, string>;
  const tables: { key: string; table: Table<Versioned, string> }[] = [
    { key: "entries", table: t(db.entries) },
    { key: "chatMessages", table: t(db.chatMessages) },
    { key: "patternSummaries", table: t(db.patternSummaries) },
    { key: "stabilityMoments", table: t(db.stabilityMoments) },
    { key: "patternInsights", table: t(db.patternInsights) },
    { key: "openLoops", table: t(db.openLoops) },
    { key: "decisions", table: t(db.decisions) },
  ];

  const known = tables.some((t) => Array.isArray(data[t.key]));
  if (!known) {
    throw new Error("In dieser Datei sind keine Einträge zum Importieren.");
  }

  const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
  for (const { key, table } of tables) {
    const rows = Array.isArray(data[key]) ? (data[key] as Versioned[]) : [];
    for (const row of rows) {
      if (!row || typeof row.id !== "string") {
        result.skipped++;
        continue;
      }
      const existing = (await table.get(row.id)) as Versioned | undefined;
      if (!existing) {
        await table.put(row);
        result.added++;
      } else if (versionOf(row) >= versionOf(existing)) {
        await table.put(row);
        result.updated++;
      } else {
        result.skipped++;
      }
    }
  }

  notifyDataChanged();
  return result;
}
