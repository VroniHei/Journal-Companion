import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { Card } from "./ui";
import { formatDateTime } from "../lib/format";
import {
  entryMode,
  entryStatus,
  entrySummaryText,
  entryTitle,
  MODE_LABEL,
  STATUS_LABEL,
  type EntryMode,
  type EntryStatus,
} from "../lib/entryCard";

const MODE_COLOR: Record<EntryMode, string> = {
  text: "var(--ink-soft)",
  voice: "var(--green-deep)",
  contact: "var(--clay)",
  rumination: "var(--danger)",
};

const STATUS_STYLE: Record<EntryStatus, { bg: string; color: string }> = {
  offen: { bg: "var(--surface-2)", color: "var(--muted)" },
  sortiert: { bg: "var(--accent-soft)", color: "var(--accent-text)" },
  abgeschlossen: { bg: "var(--accent-soft)", color: "var(--green-deep)" },
};

function moodBg(mood: number): string {
  if (mood >= 7) return "var(--accent-soft)";
  if (mood <= 4) return "color-mix(in srgb, var(--clay) 16%, transparent)";
  return "var(--surface-2)";
}

export function JournalCard({
  entry,
  closedIds,
  featured = false,
}: {
  entry: JournalEntry;
  closedIds: Set<string>;
  featured?: boolean;
}) {
  const e = entry;
  const status = entryStatus(e, closedIds);
  const mode = entryMode(e);
  const topics = e.topics.slice(0, featured ? 4 : 3);

  return (
    <Link to={`/eintrag/${e.id}`} className="block h-full">
      <Card
        className={`flex h-full flex-col gap-3 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-lift)] ${
          featured ? "sm:p-7" : ""
        }`}
      >
        {/* Kopf: Modus + Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: MODE_COLOR[mode] }}
            />
            {MODE_LABEL[mode]}
          </span>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: STATUS_STYLE[status].bg,
              color: STATUS_STYLE[status].color,
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Titel + Zusammenfassung */}
        <div className="space-y-1.5">
          <h3
            className={`serif font-semibold leading-snug ${
              featured ? "text-xl" : "text-base"
            }`}
          >
            {entryTitle(e)}
          </h3>
          <p
            className={`text-sm text-[var(--muted)] ${
              featured ? "line-clamp-3" : "line-clamp-2"
            }`}
          >
            {entrySummaryText(e)}
          </p>
        </div>

        {/* Fuß: Themen-Chips + Stimmung */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
              style={{ background: moodBg(e.mood) }}
              title={`Stimmung ${e.mood}/10`}
            >
              {e.mood}
            </span>
          </div>
        </div>

        <div className="text-xs text-[var(--muted)]">
          {formatDateTime(e.createdAt)}
          {e.crisisFlag && (
            <span className="text-[var(--danger)]"> · Schutzhinweis</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
