import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui";
import { JournalCard } from "../components/JournalCard";
import { useDailyRitual, useEntries, useSettings } from "../hooks/useData";
import { dayKey } from "../db/queries";
import { ritualTheme } from "../lib/daypart";
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

const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 150, 200, 365];
function nextMilestone(streak: number): number {
  return MILESTONES.find((m) => m > streak) ?? Math.ceil((streak + 1) / 100) * 100;
}
function milestoneLabel(m: number): string {
  if (m === 365) return "1-Jahres-Marke";
  if (m % 7 === 0 && m <= 28) return `${m / 7}-Wochen-Marke`;
  return `${m}-Tage-Marke`;
}

const FILTERS: { id: string; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "bereit", label: "Reflexion bereit" },
  { id: "gesprochen", label: "Gesprochen" },
];

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
  const [filter, setFilter] = useState("alle");
  const [promptIdx, setPromptIdx] = useState(0);
  const [moodViz, setMoodViz] = useState<"punkte" | "verlauf">("punkte");

  const name = settings.userName?.trim();
  const tod = timeOfDay();
  const quote = QUOTES[tod];
  const hasData = entries.length > 0;

  const streak = computeStreak(entries);
  const streakNext = nextMilestone(streak);
  const streakLeft = streakNext - streak;
  const streakPct = Math.min(100, Math.round((streak / streakNext) * 100));
  const streakMilestoneLabel = milestoneLabel(streakNext);
  const week = recentStats(entries, 7);
  const series = moodSeries(entries, 14);
  const moodDays = moodByDay(entries, 7);
  const insights = buildInsights(entries);
  const ritualMorning = tod !== "abend";
  const ritualFilled = ritualMorning
    ? (ritual?.gratitude?.length ?? 0) > 0
    : (ritual?.goodMoments?.length ?? 0) > 0;
  const ritualT = ritualTheme(!ritualMorning);
  const prompt = PROMPTS[promptIdx % PROMPTS.length];


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
      {/* Mobile: helle Begrüßung auf Creme (nach Prototyp) */}
      <div className="sm:hidden">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9a917f]">
          {dateLabel}
        </div>
        <h1 className="serif mt-1.5 text-[22px] font-semibold leading-tight sm:text-[28px]">
          {greetingWord(tod)}
          {name ? `, ${name}` : ""}
        </h1>

        {settings.focusArea && (
          <Link
            to="/einstellungen"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[#5d4f3f] transition hover:opacity-80"
            style={{ background: "#F1ECE0" }}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-[var(--clay)]" />
            Dein Fokus: {settings.focusArea}
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="#9a917f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="ml-0.5"
            >
              <path d="M14 5l5 5M4 20l1-4L15.5 4.5l3.5 3.5L7.5 19.5 4 20z" />
            </svg>
          </Link>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
          <button
            type="button"
            onClick={() => navigate("/neu")}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
              boxShadow: "0 5px 14px rgba(110,155,44,.28)",
            }}
          >
            Eintrag schreiben
          </button>
          <button
            type="button"
            onClick={() => navigate("/sprechen")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Sprach-Check-in
          </button>
        </div>
      </div>

      {/* Desktop: Foto-Hero mit Overlay (nach Prototyp) */}
      <div className="relative hidden overflow-hidden rounded-[28px] shadow-[0_22px_48px_rgba(35,34,26,0.13)] sm:block">
        <img
          src="/img/hero-see.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.2,.7,.15,1)] hover:scale-105"
          style={{ objectPosition: "center 82%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(28,33,22,.9) 0%, rgba(28,33,22,.62) 52%, rgba(28,33,22,.22) 100%)",
          }}
        />
        <div className="relative max-w-[600px] p-10 lg:p-[46px]">
          <div className="mb-3.5 inline-flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full bg-[var(--accent)]"
              style={{ boxShadow: "0 0 12px rgba(168,232,79,.8)" }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dateLabel}
            </span>
          </div>
          <h1 className="serif mb-3 text-[39px] font-semibold leading-[1.08] text-[#F8F5EE]">
            {greetingWord(tod)}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="lead mb-6 max-w-[470px] text-[22px] leading-snug text-[#F8F5EE]">
            {quote.pre}
            <em className="g text-[var(--accent)]">{quote.accent}</em>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/neu")}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
                boxShadow: "0 5px 14px rgba(110,155,44,.28)",
              }}
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
            <p className="lead max-w-[520px] text-xl leading-snug">
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

      {/* TAGESRITUAL · prominentes, warmes Tages-Tool (nach Prototyp) */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 28,
          border: `1px solid ${ritualT.border}`,
          boxShadow: "0 20px 46px rgba(120,86,52,0.16)",
          background: ritualT.surface,
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            top: -60,
            left: -30,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: ritualT.orbWarm,
            filter: "blur(34px)",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: -40,
            bottom: -70,
            width: 230,
            height: 230,
            borderRadius: "50%",
            background: ritualT.orbCool,
            filter: "blur(38px)",
          }}
        />
        <div className="relative flex items-stretch">
          <div className="min-w-0 flex-1 p-7 sm:p-8">
            {/* Badge */}
            <div
              className="mb-4 inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3"
              style={{
                background: "rgba(255,255,255,0.7)",
                borderColor: "rgba(205,138,91,0.3)",
              }}
            >
              <span
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white"
                style={{ background: ritualT.badge }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ritualMorning ? (
                    <>
                      <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
                      <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
                    </>
                  ) : (
                    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
                  )}
                </svg>
              </span>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: ritualT.eyebrow }}
              >
                Tägliches Ritual
              </span>
              <span
                className="border-l pl-2 text-[10.5px] font-semibold"
                style={{ color: "#b08a64", borderColor: "rgba(205,138,91,0.3)" }}
              >
                6 Min · Dein Begleiter
              </span>
            </div>

            {/* Status */}
            <div
              className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold"
              style={{ color: ritualT.eyebrow }}
            >
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: ritualMorning ? "#CD8A5B" : "#CBBEF4" }}
              />
              {ritualFilled ? (
                "Heute schon ausgefüllt"
              ) : (
                <>
                  Heute noch offen
                  <span style={{ color: "#b08a64", fontWeight: 500 }}>
                    {" "}
                    · kein Muss
                  </span>
                </>
              )}
            </div>

            <h2
              className="serif mb-2 text-[26px] font-semibold leading-tight"
              style={{ color: ritualT.title }}
            >
              Sechs Minuten, die den Tag{" "}
              <em className="g">{ritualMorning ? "sortieren" : "abschließen"}</em>.
            </h2>
            <p
              className="mb-5 max-w-[480px] text-[15px] leading-relaxed"
              style={{ color: "#6a5a48" }}
            >
              {ritualMorning
                ? "Drei kleine Fragen, bevor es losgeht. Kein Pflichtprogramm. Nur ein ruhiger Anfang."
                : "Drei kleine Fragen zum Abend. Kein Pflichtprogramm. Nur ein ruhiger Ausklang."}
            </p>

            {/* Themen-Chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(ritualMorning
                ? [
                    { label: "Wofür dankbar?", dot: "#CD8A5B" },
                    { label: "Was macht den Tag gut?", dot: "#DDB14B" },
                    { label: "Ein guter Satz an dich", dot: "#9BA383" },
                  ]
                : [
                    { label: "Was Gutes getan?", dot: "#CD8A5B" },
                    { label: "Was wäre besser?", dot: "#DDB14B" },
                    { label: "Schöne Momente", dot: "#9BA383" },
                  ]
              ).map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium"
                  style={{
                    background: "rgba(255,255,255,0.66)",
                    borderColor: "rgba(35,34,26,0.07)",
                    color: "#5d4f3f",
                  }}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: c.dot }}
                  />
                  {c.label}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/ritual")}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{
                color: "#23221A",
                background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
                boxShadow: "0 6px 18px rgba(110,155,44,0.32)",
              }}
            >
              {ritualFilled ? "Ritual ansehen" : "Ritual starten"} →
            </button>
          </div>

          {/* Bild (ab Tablet) */}
          <div className="relative hidden w-[38%] max-w-[420px] shrink-0 sm:block">
            <div
              className="absolute overflow-hidden"
              style={{
                top: 22,
                right: 22,
                bottom: 22,
                left: 0,
                borderRadius: 20,
                boxShadow: "0 12px 30px rgba(120,86,52,0.2)",
                border: "1px solid rgba(255,255,255,0.5)",
                outline: "1px solid rgba(205,138,91,0.16)",
                outlineOffset: -1,
              }}
            >
              <img
                src="/img/journaling-desk.webp"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
                style={{ objectPosition: "center 46%" }}
              />
            </div>
          </div>
        </div>
      </div>

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
                <div className="text-5xl font-extrabold leading-none tracking-tight tabular-nums text-[var(--green-deep)]">
                  {streak}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {streak === 1 ? "Tag am Stück" : "Tage am Stück"}
                </div>
                <div className="mt-4">
                  <div className="h-[7px] overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${streakPct}%`,
                        background: "linear-gradient(90deg,#CD8A5B,#A8E84F)",
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    Noch {streakLeft} {streakLeft === 1 ? "Tag" : "Tage"} bis zur{" "}
                    {streakMilestoneLabel}
                  </div>
                  <div
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{ color: "#6E9B2C", background: "#F2F6E8" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14M16 5v14" />
                    </svg>
                    1 Pausentag in Reserve
                  </div>
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

          {/* WAS SICH ZEIGT */}
          <Card className="bg-[radial-gradient(420px_240px_at_100%_0%,rgba(205,138,91,0.10),transparent_62%)]">
            <div className="mb-4 inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--clay)]" />
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Was sich zeigt
              </span>
            </div>
            {insights.length > 0 ? (
              <>
                <p className="lead max-w-[640px] text-xl leading-relaxed">
                  {insights[0]}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Link
                    to="/muster"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:gap-2.5"
                  >
                    Im Muster ansehen →
                  </Link>
                  <Link
                    to="/teilen"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Als Karte teilen
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-[15px] text-[var(--muted)]">
                Sobald sich etwas wiederholt, spiegele ich es dir hier. Ganz
                vorsichtig.
              </p>
            )}
          </Card>
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
                  className="rounded-full px-[14px] py-[7px] text-[12.5px] transition"
                  style={{
                    background: active ? "var(--sand)" : "transparent",
                    color: active ? "var(--foreground)" : "var(--muted)",
                    fontWeight: active ? 600 : 500,
                    border: active ? "1px solid transparent" : "1px solid rgba(35,34,26,.1)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
        {hasData && (
          <Link
            to="/archiv"
            className="text-sm font-semibold text-[var(--accent-text)] hover:underline"
          >
            Alle ansehen →
          </Link>
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
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <JournalCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </section>
  );
}
