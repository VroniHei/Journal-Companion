import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import {
  entryKind,
  entryKindIcon,
  entrySummaryText,
  entryTitle,
  KIND_LABEL,
  KIND_STYLE,
} from "../lib/entryCard";

// Sonnenaufgang (wie das Tagesritual-Badge) — für den Wiedererkennungswert.
function SunIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
      <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
    </svg>
  );
}

// Mood-Skala (APP-STYLE §3): clay (schwer) → gold → sage → grün (leicht).
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

// Eintrags-Kachel nach Prototyp (Innerline App.dc.html · Letzte Einträge):
// Mood-Punkt + Tages-Label, KI-Titel, kurzer Anriss. Radius 24, weicher Lift.
export function JournalCard({ entry }: { entry: JournalEntry }) {
  const e = entry;
  const kind = entryKind(e);
  const kindStyle = KIND_STYLE[kind];
  const isRitual = kind === "ritual";
  return (
    <Link to={`/eintrag/${e.id}`} className="block h-full">
      <div className="lift flex h-full flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-[22px] shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-[9px]">
            {isRitual ? (
              <span
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "#F6ECE0" }}
              >
                <SunIcon size={11} color="#CD8A5B" />
              </span>
            ) : (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: moodColor(e.mood) }}
              />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a917f]">
              {dayLabel(e.createdAt)}
              {e.crisisFlag && (
                <span className="text-[var(--danger)]"> · Schutzhinweis</span>
              )}
            </span>
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: kindStyle.bg, color: kindStyle.text }}
          >
            {entryKindIcon(kind) === "sun" && (
              <SunIcon size={11} color={kindStyle.text} />
            )}
            {KIND_LABEL[kind]}
          </span>
        </div>
        <div className="mb-2 text-[17px] font-[650] leading-snug tracking-[-0.01em] text-[var(--foreground)]">
          {entryTitle(e)}
        </div>
        <p className="text-[14px] leading-[1.55] text-[var(--muted)]">
          {entrySummaryText(e)}
        </p>
      </div>
    </Link>
  );
}
