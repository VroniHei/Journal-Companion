import { Link, useNavigate } from "react-router-dom";
import type { StartIntent } from "@journal/shared";
import { Card, Eyebrow } from "../components/ui";
import { Sparkline } from "../components/Sparkline";
import { useEntries } from "../hooks/useData";
import { formatDateTime } from "../lib/format";
import { INTENT_OPTIONS } from "../lib/intents";
import {
  buildInsights,
  computeStreak,
  moodSeries,
  recentStats,
} from "../lib/insights";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
}

function topTopics(topics: string[][]): [string, number][] {
  const counts = new Map<string, number>();
  for (const list of topics)
    for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="text-center">
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{label}</div>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const last5 = entries.slice(0, 5);
  const topics = topTopics(entries.map((e) => e.topics));
  const hasData = entries.length > 0;

  const streak = computeStreak(entries);
  const week = recentStats(entries, 7);
  const series = moodSeries(entries, 14);
  const insights = buildInsights(entries);

  function choose(intent: StartIntent) {
    if (intent === "ihm-schreiben") {
      navigate("/kontaktimpuls");
    } else {
      navigate(`/neu?intent=${intent}`);
    }
  }

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[26px] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <img
          src="/img/hero-see.webp"
          alt=""
          aria-hidden="true"
          className="h-44 w-full object-cover object-[center_60%] sm:h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,26,20,0.62)] via-[rgba(28,26,20,0.18)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-5 sm:p-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Dein Raum
          </span>
          <h1 className="serif text-3xl font-semibold text-white">
            {greeting()}.
          </h1>
          <p className="text-sm text-white/90">
            Was brauchst du <span className="g">gerade</span>?
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {INTENT_OPTIONS.map((o) => (
          <button
            key={o.intent}
            type="button"
            onClick={() => choose(o.intent)}
            className="lift glass rounded-2xl border border-[var(--border)] px-4 py-3.5 text-left text-sm font-medium shadow-[var(--shadow-card)] hover:border-[var(--accent)]"
          >
            {o.label}
          </button>
        ))}
      </div>

      {hasData && (
        <div className="space-y-4">
          <Eyebrow>Deine Auswertung</Eyebrow>

          <div className="grid grid-cols-3 gap-3">
            <StatTile
              value={String(streak)}
              label={streak === 1 ? "Tag in Folge" : "Tage in Folge"}
            />
            <StatTile value={String(week.count)} label="Einträge · 7 Tage" />
            <StatTile
              value={week.avgMood?.toString() ?? "—"}
              label="Ø Stimmung · 7 T"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
                Stimmungsverlauf
              </h2>
              {series.length >= 2 ? (
                <>
                  <Sparkline values={series} />
                  <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
                    <span>früher</span>
                    <span>schwer 1 – 10 leicht</span>
                    <span>jetzt</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Sobald du ein paar Einträge hast, zeigt sich hier dein Verlauf.
                </p>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
                Häufige Themen
              </h2>
              {topics.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Noch keine Daten.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topics.map(([t, n]) => (
                    <span
                      key={t}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
                    >
                      {t} · {n}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {insights.length > 0 && (
            <Card className="space-y-3">
              <h2 className="text-sm font-medium text-[var(--muted)]">
                Was sich zeigt
              </h2>
              <ul className="space-y-2 text-sm">
                {insights.map((t) => (
                  <li key={t} className="flex items-baseline gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/muster"
                className="inline-block text-sm font-medium text-[var(--accent-text)] hover:underline"
              >
                Mehr Muster ansehen →
              </Link>
            </Card>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Letzte Einträge
        </h2>
        {last5.length === 0 ? (
          <div className="glass overflow-hidden rounded-[26px] border border-[var(--border)] shadow-[var(--shadow-card)]">
            <img
              src="/img/journaling-desk.webp"
              alt=""
              aria-hidden="true"
              className="h-44 w-full object-cover object-[center_35%]"
            />
            <div className="p-6">
              <p className="text-[var(--muted)]">
                Noch keine Einträge. Dein erster Gedanke ist nur ein paar Zeilen
                entfernt.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {last5.map((e) => (
              <Link key={e.id} to={`/eintrag/${e.id}`} className="block">
                <Card className="lift hover:border-[var(--accent)]">
                  <div className="mb-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>{formatDateTime(e.createdAt)}</span>
                    <span>· Stimmung {e.mood}</span>
                    {e.crisisFlag && (
                      <span className="text-[var(--danger)]">· Schutzhinweis</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm">{e.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
