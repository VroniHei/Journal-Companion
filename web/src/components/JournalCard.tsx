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
  type EntryStatus,
} from "../lib/entryCard";

const STATUS_STYLE: Record<EntryStatus, { bg: string; color: string }> = {
  offen: { bg: "var(--surface-2)", color: "var(--muted)" },
  sortiert: { bg: "var(--accent-soft)", color: "var(--accent-text)" },
  abgeschlossen: { bg: "var(--accent-soft)", color: "var(--green-deep)" },
};

export function JournalCard({
  entry,
  closedIds,
}: {
  entry: JournalEntry;
  closedIds: Set<string>;
}) {
  const e = entry;
  const status = entryStatus(e, closedIds);
  const mode = entryMode(e);
  const topics = e.topics.slice(0, 3);

  return (
    <Link to={`/eintrag/${e.id}`} className="block">
      <Card className="lift space-y-2.5 hover:border-[var(--accent)]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug">{entryTitle(e)}</h3>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].color }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-medium">
            {MODE_LABEL[mode]}
          </span>
          <span>{formatDateTime(e.createdAt)}</span>
          <span>· Stimmung {e.mood}</span>
          <span>· Intensität {e.intensity}</span>
          {e.crisisFlag && (
            <span className="text-[var(--danger)]">· Schutzhinweis</span>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-[var(--foreground)]">
          {entrySummaryText(e)}
        </p>

        {topics.length > 0 && (
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
        )}

        {e.supportiveImpulse && (
          <p className="text-xs text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">
              Nächster Schritt:
            </span>{" "}
            {e.supportiveImpulse}
          </p>
        )}
      </Card>
    </Link>
  );
}
