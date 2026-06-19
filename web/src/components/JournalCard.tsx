import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { Card } from "./ui";
import { formatShort } from "../lib/format";
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
  text: "var(--sage, #9BA383)",
  voice: "var(--clay)",
  contact: "var(--clay)",
  rumination: "var(--danger)",
};

const STATUS_STYLE: Record<EntryStatus, { bg: string; color: string }> = {
  offen: { bg: "var(--surface-2)", color: "var(--muted)" },
  sortiert: { bg: "var(--accent-soft)", color: "var(--accent-text)" },
  abgeschlossen: { bg: "var(--accent-soft)", color: "var(--green-deep)" },
};

function moodDot(mood: number): string {
  if (mood >= 7) return "var(--green-deep)";
  if (mood <= 4) return "var(--clay)";
  return "var(--sage, #9BA383)";
}

function moodPill(mood: number): { bg: string; color: string } {
  if (mood >= 7) return { bg: "var(--accent-soft)", color: "var(--accent-text)" };
  if (mood <= 4)
    return {
      bg: "color-mix(in srgb, var(--clay) 14%, transparent)",
      color: "#8a4f2a",
    };
  return {
    bg: "color-mix(in srgb, var(--sage, #9BA383) 16%, transparent)",
    color: "#4d5340",
  };
}

export function JournalCard({
  entry,
  closedIds,
}: {
  entry: JournalEntry;
  closedIds: Set<string>;
  featured?: boolean;
}) {
  const e = entry;
  const status = entryStatus(e, closedIds);
  const mode = entryMode(e);
  const pill = moodPill(e.mood);

  return (
    <Link to={`/eintrag/${e.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-lift)]">
        {/* Kopf: Modus + Status */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: MODE_COLOR[mode] }}
            />
            {MODE_LABEL[mode]}
          </span>
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
            style={{
              background: STATUS_STYLE[status].bg,
              color: STATUS_STYLE[status].color,
              borderColor: "transparent",
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        <h3 className="serif mb-2 text-[18px] font-semibold leading-snug">
          {entryTitle(e)}
        </h3>
        <p className="mb-5 line-clamp-3 flex-1 text-[15px] leading-relaxed text-[var(--muted)]">
          {entrySummaryText(e)}
        </p>

        {/* Fuß: Stimmungs-Pille + Zeit */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold"
            style={{ background: pill.bg, color: pill.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: moodDot(e.mood) }}
            />
            Stimmung {e.mood}
          </span>
          <span className="text-[13px] text-[var(--muted)]">
            {formatShort(e.createdAt)}
            {e.crisisFlag && (
              <span className="text-[var(--danger)]"> · Schutzhinweis</span>
            )}
          </span>
        </div>
      </Card>
    </Link>
  );
}
