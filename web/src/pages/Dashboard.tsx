import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "../components/ui";
import { JournalCard } from "../components/JournalCard";
import { useDailyRitual, useEntries, useSettings } from "../hooks/useData";
import { dayKey, listStabilityMoments } from "../db/queries";
import { entryMode } from "../lib/entryCard";
import {
  buildInsights,
  computeStreak,
  moodByDay,
  moodSeries,
  recentStats,
  type MoodDay,
} from "../lib/insights";

// Ruhige Mood-Skala (4 Stufen): clay → gold → sage → grün.
const MOOD_COLORS = ["#CD8A5B", "#B79A66", "#9BA383", "#A8E84F"];

// Schreib-Impulse für „Heute im Blick" (sanft, konkret, nicht coachig).
const PROMPTS: { pre: string; accent: string; post: string }[] = [
  { pre: "Was war heute ", accent: "leichter", post: ", als du erwartet hast?" },
  { pre: "Worüber hast du heute mehr ", accent: "nachgedacht", post: " als sonst?" },
  { pre: "Was möchtest du festhalten, bevor der Tag ", accent: "kippt", post: "?" },
  { pre: "Was hat dich heute kurz ", accent: "innehalten", post: " lassen?" },
];

type TimeOfDay = "morgen" | "tag" | "abend";

function timeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 11) return "morgen";
  if (h < 18) return "tag";
  return "abend";
}

function greetingWord(t: TimeOfDay): string {
  if (t === "tag") return "Schön, dass du da bist";
  if (t === "abend") return "Guten Abend";
  return "Guten Morgen";
}

const QUOTES: Record<TimeOfDay, { pre: string; accent: string }> = {
  morgen: { pre: "Heute reicht ein ehrlicher Satz. ", accent: "So wie er kommt." },
  tag: { pre: "Nicht alles auf einmal. ", accent: "Eins nach dem anderen." },
  abend: { pre: "Der Tag darf jetzt leiser werden. ", accent: "Stück für Stück." },
};

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function moodTrend(series: number[]): string {
  if (series.length < 3) return "Noch wenig Verlauf";
  const half = Math.floor(series.length / 2);
  const d = avg(series.slice(half)) - avg(series.slice(0, half));
  if (d >= 0.6) return "Ruhiger geworden";
  if (d <= -0.6) return "Bewegter zuletzt";
  return "Recht stabil";
}

const FILTERS: { id: string; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "bereit", label: "Reflexion bereit" },
  { id: "gesprochen", label: "Gesprochen" },
];

const SPAN: Record<number, string> = {
  7: "sm:col-span-7",
  5: "sm:col-span-5",
};

// Stimmungs-Verlauf als ruhige Flächen-Linie (aus den Tageswerten der letzten Woche).
function MoodSparkline({ days }: { days: MoodDay[] }) {
  const x0 = 16;
  const x1 = 484;
  const yTop = 18;
  const yBot = 80;
  const base = 90;
  const n = days.length;
  const xOf = (i: number) => (n <= 1 ? x0 : x0 + (i / (n - 1)) * (x1 - x0));
  const yOf = (v: number) => yBot - ((v - 1) / 9) * (yBot - yTop);
  const pts = days
    .map((d, i) => (d.value == null ? null : { x: xOf(i), y: yOf(d.value) }))
    .filter((p): p is { x: number; y: number } => p !== null);

  if (pts.length < 2) {
    return (
      <p className="mt-6 text-sm text-[var(--muted)]">
        Noch zu wenig Verlauf. Ab zwei Tagen mit Eintrag zeichne ich hier die
        Linie.
      </p>
    );
  }

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last.x},${base} L${pts[0].x},${base} Z`;

  return (
    <div className="mt-6">
      <svg viewBox="0 0 500 96" className="block w-full overflow-visible">
        <defs>
          <linearGradient id="moodfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#moodfill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--green-deep)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="5"
          fill="var(--surface)"
          stroke="var(--green-deep)"
          strokeWidth="2.6"
        />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
        {days.map((d, i) => (
          <span key={i}>{d.day}</span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const settings = useSettings();
  const ritual = useDailyRitual(dayKey());
  const moments = useLiveQuery(() => listStabilityMoments(), [], []);
  const [filter, setFilter] = useState("alle");
  const [promptIdx, setPromptIdx] = useState(0);
  const [moodViz, setMoodViz] = useState<"punkte" | "verlauf">("punkte");

  const name = settings.userName?.trim();
  const tod = timeOfDay();
  const quote = QUOTES[tod];
  const hasData = entries.length > 0;

  const streak = computeStreak(entries);
  const week = recentStats(entries, 7);
  const series = moodSeries(entries, 14);
  const moodDays = moodByDay(entries, 7);
  const insights = buildInsights(entries);
  const ritualMorning = tod !== "abend";
  const ritualFilled = ritualMorning
    ? (ritual?.gratitude?.length ?? 0) > 0
    : (ritual?.goodMoments?.length ?? 0) > 0;
  const ritualItems = ritualMorning
    ? (ritual?.gratitude ?? [])
    : (ritual?.goodMoments ?? []);
  const prompt = PROMPTS[promptIdx % PROMPTS.length];

  const closedIds = new Set<string>();
  for (const m of moments) {
    if (m.kind === "abschluss" && m.entryId) closedIds.add(m.entryId);
  }

  function matchesFilter(e: (typeof entries)[number]): boolean {
    if (filter === "bereit") return Boolean(e.aiReflection);
    if (filter === "gesprochen") return entryMode(e) === "voice";
    return true;
  }
  const shown = entries.filter(matchesFilter).slice(0, 6);

  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="space-y-5">
      {/* HERO · Zitat-Band */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] shadow-[var(--shadow-lift)]">
        <img
          src="/img/hero-see.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_85%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(28,33,22,0.88)] via-[rgba(28,33,22,0.62)] to-[rgba(28,33,22,0.30)]" />
        <div className="relative max-w-[620px] p-8 sm:p-11">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dateLabel}
            </span>
          </div>
          <h1 className="serif mb-3 text-3xl font-semibold text-white sm:text-[40px] sm:leading-[1.1]">
            {greetingWord(tod)}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mb-7 max-w-[480px] text-lg leading-snug text-white/90 sm:text-2xl">
            {quote.pre}
            <em className="g text-[var(--accent)]">{quote.accent}</em>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/neu")}
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[#bdf06a]"
            >
              Eintrag schreiben
            </button>
            <button
              type="button"
              onClick={() => navigate("/sprechen")}
              className="rounded-full border border-white/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[var(--foreground)]"
            >
              Sprach-Check-in
            </button>
          </div>
        </div>
      </div>

      {/* HEUTE IM BLICK · Schreib-Impuls */}
      <Card className="bg-[radial-gradient(420px_240px_at_0%_0%,rgba(168,232,79,0.10),transparent_60%)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Heute im Blick
              </span>
            </div>
            <p className="max-w-[520px] text-xl font-medium leading-snug">
              {prompt.pre}
              <em className="g text-[var(--accent-text)]">{prompt.accent}</em>
              {prompt.post}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPromptIdx((i) => i + 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--surface-2)]"
            >
              ↻ Anderer Impuls
            </button>
            <button
              type="button"
              onClick={() => navigate("/neu")}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5 hover:bg-[#bdf06a]"
            >
              Damit schreiben
            </button>
          </div>
        </div>
      </Card>

      {hasData && (
        <>
          {/* AUSWERTUNG · 12-Spalten-Bento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <Card className="sm:col-span-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Stimmung · 7 Tage
                  </div>
                  <div className="serif text-[26px] font-semibold leading-tight">
                    {moodTrend(series)}
                  </div>
                </div>
                {/* Umschalter: Punkte / Verlauf */}
                <div className="inline-flex shrink-0 rounded-full bg-[var(--surface-2)] p-1">
                  {(["punkte", "verlauf"] as const).map((v) => {
                    const active = moodViz === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMoodViz(v)}
                        aria-pressed={active}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-card)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {v === "punkte" ? "Punkte" : "Verlauf"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {moodViz === "verlauf" ? (
                <MoodSparkline days={moodDays} />
              ) : (
                <div className="mt-6 flex items-end justify-between">
                  {moodDays.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2.5">
                      <span
                        className="h-5 w-5 rounded-full"
                        style={{
                          background:
                            d.level === null
                              ? "var(--surface-2)"
                              : MOOD_COLORS[d.level],
                        }}
                        title={d.level === null ? "kein Eintrag" : undefined}
                      />
                      <span className="text-xs text-[var(--muted)]">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Legende: Schwer → Leicht */}
              <div className="mt-5 flex items-center gap-2.5 border-t border-[var(--border)] pt-4">
                <span className="text-xs text-[var(--muted)]">Schwer</span>
                <div className="flex gap-1.5">
                  {MOOD_COLORS.map((c) => (
                    <span
                      key={c}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--muted)]">Leicht</span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between sm:col-span-3">
              <div className="flex items-center gap-2 text-[var(--clay)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path d="M4 16 C8 16 9 7 12 7 C15 7 16 17 20 11" />
                </svg>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  In Folge
                </span>
              </div>
              <div className="mt-6">
                <div className="text-5xl font-extrabold leading-none tracking-tight tabular-nums">
                  {streak}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {streak === 1 ? "Tag am Stück" : "Tage am Stück"}
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between sm:col-span-3">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Diese Woche
              </span>
              <div className="mt-6">
                <div className="text-5xl font-extrabold leading-none tracking-tight tabular-nums">
                  {week.count}
                  <span className="text-2xl font-semibold text-[var(--muted)]">
                    /7
                  </span>
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  Tage mit Eintrag
                </div>
              </div>
            </Card>
          </div>

          {/* INSIGHT + STABILE SCHRITTE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <Card className="sm:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[var(--clay)]" />
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Was sich zeigt
                </span>
              </div>
              {insights.length > 0 ? (
                <>
                  <p className="max-w-[560px] text-xl leading-relaxed">
                    {insights[0]}
                  </p>
                  <Link
                    to="/muster"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:gap-2.5"
                  >
                    Im Muster ansehen →
                  </Link>
                </>
              ) : (
                <p className="text-[15px] text-[var(--muted)]">
                  Sobald sich etwas wiederholt, spiegele ich es dir hier. Ganz
                  vorsichtig.
                </p>
              )}
            </Card>

            <Card className="flex flex-col sm:col-span-5">
              <div className="mb-3 inline-flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Tagesritual
                </span>
              </div>
              <p className="serif text-[22px] font-semibold leading-snug">
                {ritualMorning
                  ? "Wofür bist du heute dankbar?"
                  : "Was war heute schön?"}
              </p>
              {ritualFilled ? (
                <ul className="mt-3 space-y-1.5 text-[15px]">
                  {ritualItems.slice(0, 3).map((it, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--accent-text)]">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[15px] text-[var(--muted)]">
                  {ritualMorning
                    ? "Drei kurze Dinge reichen. Ein guter Start in den Tag."
                    : "Ein wertschätzender Abschluss. Was ist dir heute begegnet?"}
                </p>
              )}
              <Link
                to="/ritual"
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[var(--accent-text)] hover:gap-2.5"
              >
                {ritualFilled ? "Ritual ansehen" : "Ritual ausfüllen"} →
              </Link>
            </Card>
          </div>
        </>
      )}

      {/* LETZTE EINTRÄGE */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <h2 className="serif text-2xl font-semibold">Letzte Einträge</h2>
        {hasData && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="rounded-full border px-4 py-1.5 text-[13.5px] font-semibold transition"
                  style={{
                    background: active ? "var(--foreground)" : "var(--surface)",
                    color: active ? "var(--background)" : "var(--muted)",
                    borderColor: active ? "var(--foreground)" : "var(--border)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="grid grid-cols-1 overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] sm:grid-cols-[1fr_300px]">
          <div className="flex flex-col justify-center p-8 sm:p-11">
            <h3 className="serif mb-3 text-2xl font-semibold">
              Noch nichts notiert. <em className="g text-[var(--green-deep)]">Auch gut.</em>
            </h3>
            <p className="mb-6 max-w-[400px] text-[15px] leading-relaxed text-[var(--muted)]">
              Ein Satz reicht für den Anfang. Was geht dir gerade durch den Kopf,
              so wie es ist?
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate("/neu")}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[#bdf06a]"
              >
                Ersten Eintrag schreiben
              </button>
            </div>
          </div>
          <img
            src="/img/journaling-desk.webp"
            alt=""
            aria-hidden="true"
            className="hidden h-full w-full object-cover sm:block"
          />
        </div>
      ) : shown.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Keine Einträge in diesem Filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {shown.map((e, i) => (
            <div key={e.id} className={SPAN[[7, 5, 5, 7][i % 4]]}>
              <JournalCard entry={e} closedIds={closedIds} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
