import { useMemo, useState } from "react";
import type { JournalEntry } from "@journal/shared";
import { moodByDay } from "../lib/insights";

// Mood-Skala (APP-STYLE §3): clay (schwer) → gold → sage → grün (leicht).
function moodColor(v: number): string {
  if (v <= 3.5) return "#CD8A5B";
  if (v <= 5.5) return "#DDB14B";
  if (v <= 7.5) return "#9BA383";
  return "#A8E84F";
}

const LEGEND = [
  { c: "#CD8A5B", label: "schwer" },
  { c: "#DDB14B", label: "gemischt" },
  { c: "#9BA383", label: "okay" },
  { c: "#A8E84F", label: "leicht" },
];

// „Stimmung · 7 Tage": Punkte oder Verlauf, umschaltbar, mit Legende (App-Style).
// Optional auf 30 Tage / Verlauf-Default umstellbar (Desktop-Muster-Bento).
export function MoodCard({
  entries,
  dayCount = 7,
  defaultView = "punkte",
  title,
  className = "",
  hideToggle = false,
  hideLegend = false,
}: {
  entries: JournalEntry[];
  dayCount?: number;
  defaultView?: "punkte" | "verlauf";
  title?: string;
  className?: string;
  hideToggle?: boolean;
  hideLegend?: boolean;
}) {
  const [view, setView] = useState<"punkte" | "verlauf">(defaultView);
  const days = useMemo(() => moodByDay(entries, dayCount), [entries, dayCount]);
  const showDayLabels = days.length <= 10;
  const heading = title ?? `Stimmung · ${dayCount} Tage`;

  // Sparkline-Punkte aus den Tageswerten.
  const W = 320;
  const H = 90;
  const pts = days.map((d, i) => {
    const x = 10 + (i * (W - 20)) / Math.max(1, days.length - 1);
    const y = d.value == null ? null : H - 18 - ((d.value - 1) / 9) * (H - 36);
    return { x: Math.round(x), y: y == null ? null : Math.round(y) };
  });
  const line = pts.filter((p): p is { x: number; y: number } => p.y != null);
  const poly = line.map((p) => `${p.x},${p.y}`).join(" ");
  const area = line.length
    ? `M${line[0].x},${line[0].y} ${line.map((p) => `L${p.x},${p.y}`).join(" ")} L${line[line.length - 1].x},${H} L${line[0].x},${H} Z`
    : "";
  const last = line[line.length - 1];

  return (
    <div className={`rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {heading}
        </span>
        <div className={`flex gap-[3px] rounded-full bg-[var(--sand)] p-[3px] ${hideToggle ? "hidden" : ""}`}>
          {(["punkte", "verlauf"] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="rounded-full px-[13px] py-1.5 text-[12px] transition"
                style={{
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--foreground)" : "var(--muted)",
                  fontWeight: active ? 600 : 500,
                  boxShadow: active ? "0 2px 6px rgba(35,34,26,.08)" : "none",
                }}
              >
                {v === "punkte" ? "Punkte" : "Verlauf"}
              </button>
            );
          })}
        </div>
      </div>

      {view === "punkte" ? (
        <div className="flex items-end justify-between">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className="h-[18px] w-[18px] rounded-full"
                style={{
                  background: d.value != null ? moodColor(d.value) : "transparent",
                  border: d.value != null ? "none" : "1.5px dashed rgba(35,34,26,.16)",
                }}
              />
              <span className="text-[10.5px] text-[#9a917f]">{d.day}</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="90" preserveAspectRatio="none">
            <defs>
              <linearGradient id="moodfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(168,232,79,.28)" />
                <stop offset="1" stopColor="rgba(168,232,79,0)" />
              </linearGradient>
            </defs>
            {area && <path d={area} fill="url(#moodfill)" />}
            {line.length > 1 && (
              <polyline
                points={poly}
                fill="none"
                stroke="#6E9B2C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {last && <circle cx={last.x} cy={last.y} r="4.5" fill="#A8E84F" stroke="#fff" strokeWidth="2" />}
          </svg>
          {showDayLabels && (
            <div className="mt-1 flex justify-between">
              {days.map((d, i) => (
                <span key={i} className="text-[10.5px] text-[#9a917f]">
                  {d.day}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legende */}
      <div className={`mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-[var(--border)] pt-3.5 ${hideLegend ? "hidden" : ""}`}>
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.c }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
