import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import type { PatternSummary } from "@journal/shared";
import { Button, Card } from "../components/ui";
import { FormattedText } from "../components/FormattedText";
import { MoodCard } from "../components/MoodCard";
import { useEntries, useSettings } from "../hooks/useData";
import { db } from "../db/dexie";
import { dayKey, listPatternsDesc, savePattern, toDigest } from "../db/queries";
import { toPrefs } from "../lib/settings";
import { postWeeklyReview } from "../lib/apiClient";
import { aggregate } from "../lib/patterns";
import { buildInsights, computeStreak, wordsOfWeek } from "../lib/insights";
import { createId, nowIso } from "../lib/ids";
import { formatDate } from "../lib/format";
import { downloadPatternMarkdown } from "../lib/export";

const RANGES = [
  { label: "Letzte 7 Tage", days: 7 },
  { label: "Letzte 14 Tage", days: 14 },
  { label: "Letzte 30 Tage", days: 30 },
];

export function WeeklyReview() {
  const settings = useSettings();
  const entries = useEntries();
  const saved = useLiveQuery(() => listPatternsDesc(), [], []);

  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState(false);

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  const periodStart = start.toISOString();
  const periodEnd = now.toISOString();

  const inRange = entries.filter((e) => e.createdAt >= periodStart);
  const words = wordsOfWeek(inRange);
  const maxWord = words[0]?.count ?? 1;

  // Ruhige Zusammenfassung (Prototyp): Kennzahlen + Insight + Worte der Woche.
  const streak = computeStreak(entries);
  const insights = buildInsights(inRange);
  const ritualDays =
    useLiveQuery(async () => {
      const since = dayKey(start);
      const rits = await db.dailyRituals.where("date").aboveOrEqual(since).toArray();
      return rits.filter(
        (r) => (r.gratitude?.length ?? 0) > 0 || (r.goodMoments?.length ?? 0) > 0,
      ).length;
    }, [days]) ?? 0;
  const rangeLabel = `${start.toLocaleDateString("de-DE", { day: "numeric" })}. – ${now.toLocaleDateString(
    "de-DE",
    { day: "numeric", month: "long" },
  )}`;

  async function generate() {
    if (loading || inRange.length === 0) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    setSavedHint(false);
    try {
      const res = await postWeeklyReview({
        periodStart,
        periodEnd,
        digests: inRange.map(toDigest),
        prefs: toPrefs(settings),
      });
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!summary) return;
    const a = aggregate(inRange);
    const pattern: PatternSummary = {
      id: createId(),
      createdAt: nowIso(),
      periodStart,
      periodEnd,
      summary,
      recurringThemes: a.topTopics.map(([t]) => t),
      recurringNeeds: a.topNeeds.map(([n]) => n),
      stabilizingActions: [
        a.movementDays ? `Bewegung an ${a.movementDays} Tagen` : "",
        a.outsideDays ? `Draußen an ${a.outsideDays} Tagen` : "",
      ].filter(Boolean),
      riskPatterns: [
        a.contactImpulses ? `Kontaktimpulse (${a.contactImpulses})` : "",
        a.ruminations ? `Grübelschleifen (${a.ruminations})` : "",
      ].filter(Boolean),
      personalContextNotes: [],
      helpfulRegulationStrategies: [],
      contactImpulsePatterns: [],
      helpfulSentences: [],
      unhelpfulThoughtLoops: [],
      groundingActionsThatWorked: [],
      contactDecisionsThatFeltGoodLater: [],
    };
    await savePattern(pattern);
    setSavedHint(true);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Wochenrückblick</h1>
        <p className="mt-1 text-[var(--muted)]">
          Ein ruhiger, ehrlicher Blick auf das, was sich gezeigt hat.
        </p>
      </div>

      {/* Ruhige Zusammenfassung (Prototyp): Was sich gezeigt hat + Kennzahlen */}
      <Card className="space-y-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Diese Woche · {rangeLabel}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
            Was sich gezeigt hat
          </div>
          <p className="lead text-[17px] leading-[1.55] text-[var(--foreground)]">
            {insights[0] ?? (
              <>
                Sobald sich über die Woche etwas wiederholt, fasse ich es hier{" "}
                <em className="g">ruhig</em> zusammen.
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
          <div>
            <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--foreground)]">
              {inRange.length}
            </div>
            <div className="text-[12.5px] text-[var(--muted)]">Einträge</div>
          </div>
          <div>
            <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--foreground)]">
              {streak}
            </div>
            <div className="text-[12.5px] text-[var(--muted)]">Tage Serie</div>
          </div>
          <div>
            <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--foreground)]">
              {ritualDays}
            </div>
            <div className="text-[12.5px] text-[var(--muted)]">Ritual-Tage</div>
          </div>
        </div>
      </Card>

      {/* Stimmung · Verlauf */}
      <MoodCard entries={entries} />

      {/* Worte der Woche */}
      {words.length > 0 && (
        <Card>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Worte der Woche
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <span
                key={w.word}
                className="rounded-full bg-[var(--sand)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)]"
                style={{ opacity: 0.55 + 0.45 * (w.count / maxWord) }}
              >
                {w.word}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Wochen-Brief: warmer KI-Brief statt Statistik. */}
      <Link
        to="/wochen-brief"
        className="lift flex items-center justify-between gap-3 overflow-hidden rounded-[18px] border px-5 py-4 shadow-[0_10px_28px_rgba(120,86,52,.1)]"
        style={{
          borderColor: "rgba(205,138,91,.22)",
          background: "linear-gradient(160deg,#FBF4E8,#F8F3EA)",
        }}
      >
        <div>
          <div className="text-[15px] font-[650] tracking-[-0.01em] text-[#3a2e22]">
            Dein Wochen-Brief
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-[#7a5f44]">
            Ein paar <em className="g">ehrliche</em> Zeilen statt Statistik, mit einer
            Frage.
          </p>
        </div>
        <span aria-hidden="true" className="flex-none text-[#9c6b3f]">
          →
        </span>
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className="rounded-full border px-3 py-1 text-sm transition"
              style={{
                borderColor: days === r.days ? "var(--accent)" : "var(--border)",
                background: days === r.days ? "var(--accent-soft)" : "transparent",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--muted)]">
          {formatDate(periodStart)} – {formatDate(periodEnd)} · {inRange.length}{" "}
          Einträge
        </p>
        <div>
          <Button
            onClick={generate}
            disabled={loading || inRange.length === 0}
          >
            {loading ? "Erstelle Rückblick…" : "Rückblick erstellen"}
          </Button>
          {inRange.length === 0 && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              In diesem Zeitraum gibt es keine Einträge.
            </p>
          )}
        </div>
      </Card>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
        </Card>
      )}

      {summary && (
        <Card className="space-y-4">
          <FormattedText text={summary} className="text-[15px]" />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={save} disabled={savedHint}>
              {savedHint ? "Gespeichert ✓" : "Rückblick speichern"}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadPatternMarkdown({
                  id: "",
                  createdAt: nowIso(),
                  periodStart,
                  periodEnd,
                  summary,
                  recurringThemes: [],
                  recurringNeeds: [],
                  stabilizingActions: [],
                  riskPatterns: [],
                  personalContextNotes: [],
                  helpfulRegulationStrategies: [],
                  contactImpulsePatterns: [],
                  helpfulSentences: [],
                  unhelpfulThoughtLoops: [],
                  groundingActionsThatWorked: [],
                  contactDecisionsThatFeltGoodLater: [],
                })
              }
            >
              Als Markdown
            </Button>
            <span className="text-xs text-[var(--muted)]">
              Gespeicherte Muster fließen als Hintergrund in spätere Reflexionen.
            </span>
          </div>
        </Card>
      )}

      {saved.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            Gespeicherte Rückblicke
          </h2>
          {saved.slice(0, 6).map((p) => (
            <Card key={p.id} className="space-y-2">
              <div className="text-xs text-[var(--muted)]">
                {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                {p.summary}
              </p>
              <Button variant="ghost" onClick={() => downloadPatternMarkdown(p)}>
                Als Markdown
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
