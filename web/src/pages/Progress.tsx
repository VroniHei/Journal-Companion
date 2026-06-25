import { useMemo, useState } from "react";
import { useEntries } from "../hooks/useData";
import { withAccents } from "../lib/accents";
import {
  moodTrend,
  themeShifts,
  trendStory,
  type TrendRange,
} from "../lib/insights";

const RANGES: { id: TrendRange; label: string }[] = [
  { id: 1, label: "Monat" },
  { id: 6, label: "6 Monate" },
  { id: 12, label: "Jahr" },
];

// Verlauf („Wie habe ich mich verändert?"): Zeitraum-Analyse über Monat / 6
// Monate / Jahr — Stimmung & Themen-Verschiebungen, ohne Bewertung.
export function Progress() {
  const entries = useEntries();
  const [range, setRange] = useState<TrendRange>(6);

  const buckets = useMemo(() => moodTrend(entries, range), [entries, range]);
  const shifts = useMemo(() => themeShifts(entries, range), [entries, range]);
  const story = useMemo(() => trendStory(entries, range), [entries, range]);

  // Sparkline-Pfad aus den Bucket-Werten (1..10 → y).
  const W = 320;
  const H = 90;
  const vals = buckets.map((b) => b.value);
  const pts = vals.map((v, i) => {
    const x = 8 + (i * (W - 16)) / Math.max(1, vals.length - 1);
    const y = v == null ? H - 10 : H - 14 - ((v - 1) / 9) * (H - 28);
    return { x: Math.round(x), y: Math.round(y), has: v != null };
  });
  const line = pts.filter((p) => p.has);
  const poly = line.map((p) => `${p.x},${p.y}`).join(" ");
  const area = line.length
    ? `M${line[0].x},${line[0].y} ${line.map((p) => `L${p.x},${p.y}`).join(" ")} L${line[line.length - 1].x},${H} L${line[0].x},${H} Z`
    : "";
  const last = line[line.length - 1];

  return (
    <section className="space-y-5">
      <div>
        <h1 className="serif text-3xl font-semibold">Verlauf</h1>
        <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
          Wie hat sich deine Stimmung <em className="g">verändert</em>?
        </p>
      </div>

      {/* Segmented Control: Zeitraum */}
      <div className="flex gap-[3px] rounded-full bg-[var(--sand)] p-1">
        {RANGES.map((r) => {
          const active = r.id === range;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className="flex-1 rounded-full py-2 text-center text-[13px] transition"
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted)",
                fontWeight: active ? 600 : 500,
                boxShadow: active ? "0 2px 8px rgba(35,34,26,.08)" : "none",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Verlaufs-Karte */}
      <div
        className="rounded-[20px] border border-[var(--border)] p-[18px] shadow-[var(--shadow-card)]"
        style={{
          background:
            "radial-gradient(280px 160px at 100% 0%, rgba(168,232,79,.12), transparent 62%), var(--surface)",
        }}
      >
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
          {story.range}
        </div>
        <p className="lead mb-4 text-[18px] leading-[1.5] text-[var(--foreground)]">
          {withAccents(story.lead, "lead")}
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="84" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(168,232,79,.26)" />
              <stop offset="1" stopColor="rgba(168,232,79,0)" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill="url(#vfill)" />}
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
          {last && (
            <circle cx={last.x} cy={last.y} r="4.5" fill="#A8E84F" stroke="#fff" strokeWidth="2" />
          )}
        </svg>
        <div className="mt-1 flex justify-between">
          {buckets.map((b, i) => (
            <span key={i} className="text-[11px] text-[#9a917f]">
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Was sich verschoben hat */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
        Was sich verschoben hat
      </div>
      {shifts.length === 0 ? (
        <p className="text-[14px] leading-relaxed text-[var(--muted)]">
          Noch keine deutlichen Verschiebungen. Mit mehr Einträgen wird sichtbar,
          was kommt und geht.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shifts.map((s) => {
            const up = s.direction === "up";
            return (
              <div
                key={s.word}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-[15px] shadow-[var(--shadow-card)]"
              >
                <span
                  className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px]"
                  style={{
                    background: up ? "#F2F6E8" : "#F1ECE0",
                    color: up ? "#6E9B2C" : "#9a917f",
                  }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    {up ? (
                      <>
                        <path d="M4 16l6-6 4 4 6-8" />
                        <path d="M20 6v4h-4" />
                      </>
                    ) : (
                      <>
                        <path d="M4 8l6 6 4-4 6 8" />
                        <path d="M20 18v-4h-4" />
                      </>
                    )}
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="text-[14.5px] font-semibold text-[var(--foreground)]">
                    {up ? `„${s.word}" kommt häufiger` : `„${s.word}" seltener`}
                  </div>
                  <div className="mt-px text-[13px] text-[#9a917f]">
                    {s.from}× → {s.to}× pro Monat
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Abschluss-Notiz */}
      <div
        className="rounded-2xl border p-4 shadow-[var(--shadow-card)]"
        style={{
          background: "linear-gradient(135deg,#F4F8EC,var(--surface))",
          borderColor: "rgba(110,155,44,.2)",
        }}
      >
        <p className="text-[14.5px] leading-[1.55] text-[var(--foreground)]">
          {story.conclusion}
        </p>
      </div>
    </section>
  );
}
