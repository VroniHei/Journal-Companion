import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import type { StartIntent } from "@journal/shared";
import { Card } from "../components/ui";
import { Sparkline } from "../components/Sparkline";
import { JournalCard } from "../components/JournalCard";
import { useEntries, useSettings } from "../hooks/useData";
import { listStabilityMoments } from "../db/queries";
import { formatShort } from "../lib/format";
import { entryMode } from "../lib/entryCard";
import { INTENT_OPTIONS } from "../lib/intents";
import {
  buildInsights,
  computeStreak,
  moodSeries,
  recentStats,
} from "../lib/insights";

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

export function Dashboard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const settings = useSettings();
  const moments = useLiveQuery(() => listStabilityMoments(), [], []);
  const [filter, setFilter] = useState("alle");

  const name = settings.userName?.trim();
  const tod = timeOfDay();
  const quote = QUOTES[tod];
  const hasData = entries.length > 0;

  const streak = computeStreak(entries);
  const week = recentStats(entries, 7);
  const series = moodSeries(entries, 14);
  const insights = buildInsights(entries);

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

  function choose(intent: StartIntent) {
    if (intent === "ihm-schreiben") navigate("/kontaktimpuls");
    else navigate(`/neu?intent=${intent}`);
  }

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

      {/* Schnellzugriff */}
      <div className="grid gap-3 sm:grid-cols-2">
        {INTENT_OPTIONS.map((o) => (
          <button
            key={o.intent}
            type="button"
            onClick={() => choose(o.intent)}
            className="lift rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left text-sm font-medium shadow-[var(--shadow-card)] hover:border-[var(--accent)]"
          >
            {o.label}
          </button>
        ))}
      </div>

      {hasData && (
        <>
          {/* AUSWERTUNG · 12-Spalten-Bento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <Card className="sm:col-span-6">
              <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Stimmung · 7 Tage
              </div>
              <div className="serif text-[26px] font-semibold leading-tight">
                {moodTrend(series)}
              </div>
              {series.length >= 2 && (
                <div className="mt-5">
                  <Sparkline values={series} />
                  <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
                    <span>früher</span>
                    <span>jetzt</span>
                  </div>
                </div>
              )}
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
                  Sobald sich etwas wiederholt, spiegele ich es dir hier — ganz
                  vorsichtig.
                </p>
              )}
            </Card>

            <Card className="sm:col-span-5">
              <div className="mb-5 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Stabile Schritte
              </div>
              {moments.length === 0 ? (
                <p className="text-[15px] text-[var(--muted)]">
                  Kleine hilfreiche Schritte tauchen hier auf — z.B. Impuls
                  gehalten oder Eintrag abgeschlossen.
                </p>
              ) : (
                <ul className="space-y-3.5">
                  {moments.slice(0, 4).map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-[15px] font-medium">{m.label}</span>
                      <span className="shrink-0 text-xs text-[var(--muted)]">
                        {formatShort(m.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
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
