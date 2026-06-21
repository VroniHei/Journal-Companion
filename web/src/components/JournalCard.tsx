import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { Card } from "./ui";
import { entrySummaryText, entryTitle } from "../lib/entryCard";

// Mood-Skala (App-Style): clay (schwer) → gold → sage → grün (leicht).
function moodColor(m: number): string {
  if (m <= 3.5) return "#CD8A5B";
  if (m <= 5.5) return "#DDB14B";
  if (m <= 7.5) return "#9BA383";
  return "#A8E84F";
}

function dayLabel(iso: string): string {
  const startOf = (x: Date) => {
    const y = new Date(x);
    y.setHours(0, 0, 0, 0);
    return y;
  };
  const d = new Date(iso);
  const diff = Math.round(
    (startOf(new Date()).getTime() - startOf(d).getTime()) / 86_400_000,
  );
  if (diff <= 0) return "Heute";
  if (diff === 1) return "Gestern";
  if (diff < 7) return d.toLocaleDateString("de-DE", { weekday: "long" });
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

// Eintrags-Kachel nach App-Style: Mood-Punkt + Tages-Label, KI-Titel, Anriss.
export function JournalCard({ entry }: { entry: JournalEntry }) {
  const e = entry;
  return (
    <Link to={`/eintrag/${e.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-[22px]">
        <div className="mb-3 flex items-center gap-[9px]">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: moodColor(e.mood) }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a917f]">
            {dayLabel(e.createdAt)}
            {e.crisisFlag && (
              <span className="text-[var(--danger)]"> · Schutzhinweis</span>
            )}
          </span>
        </div>
        <h3 className="mb-2 text-[17px] font-[650] leading-[1.25] tracking-[-0.01em] text-[var(--foreground)]">
          {entryTitle(e)}
        </h3>
        <p className="line-clamp-2 text-[14px] leading-[1.55] text-[var(--muted)]">
          {entrySummaryText(e)}
        </p>
      </Card>
    </Link>
  );
}
