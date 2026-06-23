import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import type { PatternSummary } from "@journal/shared";
import { Button, Card } from "../components/ui";
import { FormattedText } from "../components/FormattedText";
import { MoodCard } from "../components/MoodCard";
import { useEntries, useRestDays, useSettings } from "../hooks/useData";
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
  const restDays = useRestDays();
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
  const streak = computeStreak(entries, restDays.map((r) => r.date));
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
    <section className="space-y-8">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Diese Woche · {rangeLabel}
        </div>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-[-0.02em]">
          Was sich <em className="g">gezeigt</em> hat
        </h1>
      </div>

      {/* Bento: Desktop volle Breite (12-Spalten), Mobile gestapelt. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-[18px]">
        {/* Große, warme Zusammenfassung — Mobile mit Foto-Band oben (Master),
            Desktop ohne Foto (großes Insight-Panel). */}
        <div
          className="flex flex-col overflow-hidden rounded-[24px] border lg:col-span-7"
          style={{
            borderColor: "rgba(205,138,91,.22)",
            background:
              "radial-gradient(420px 220px at 88% -10%, rgba(221,177,75,.16), transparent 70%), linear-gradient(160deg,#FBF4E8,#F6F1E8)",
          }}
        >
          <div className="h-[118px] flex-none overflow-hidden lg:h-[248px]">
            <img
              src="/img/hero-see.webp"
              alt=""
              aria-hidden="true"
              className="img-zoom h-full w-full object-cover"
              style={{ objectPosition: "center 82%" }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center p-7">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c6b3f]">
              Im Kern
            </div>
            <p className="lead text-[19px] leading-[1.5] text-[var(--foreground)]">
              {insights[0] ?? (
                <>
                  Sobald sich über die Woche etwas wiederholt, fasse ich es hier{" "}
                  <em className="g">ruhig</em> zusammen.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Rechte Spalte: Kennzahlen + Stimmungsverlauf */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-[18px]">
          <div className="grid grid-cols-3 divide-x divide-[rgba(35,34,26,0.08)] rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]">
            <div className="px-4 first:pl-0 last:pr-0">
              <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--green-deep,#6E9B2C)]">
                {inRange.length}
              </div>
              <div className="text-[13px] text-[var(--muted)]">Einträge</div>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--foreground)]">
                {streak}
              </div>
              <div className="text-[13px] text-[var(--muted)]">Tage Serie</div>
            </div>
            <div className="px-4 first:pl-0 last:pr-0">
              <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em] text-[var(--clay,#CD8A5B)]">
                {ritualDays}
              </div>
              <div className="text-[13px] text-[var(--muted)]">Ritual-Tage</div>
            </div>
          </div>
          <MoodCard
            entries={entries}
            dayCount={14}
            defaultView="punkte"
            title="Stimmung · 14 Tage"
          />
        </div>

        {/* Wochen-Brief — auf Mobile ans untere Ende (über der Tab-Leiste),
            auf Desktop behält es seine Bento-Position (Navigationskarte §00). */}
        <Link
          to="/wochen-brief"
          className="lift order-last flex flex-col overflow-hidden rounded-[20px] border p-[18px] shadow-[0_10px_28px_rgba(120,86,52,.1)] lg:order-none lg:col-span-7"
          style={{
            borderColor: "rgba(205,138,91,.22)",
            background: "linear-gradient(160deg,#FBF4E8,#F8F3EA)",
          }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c6b3f]">
            <span className="h-2 w-2 rounded-full bg-[var(--clay,#CD8A5B)]" />
            Dein Wochen-Brief
          </div>
          <p className="text-[14px] leading-[1.5] text-[#6f5640]">
            Ein paar <em className="g">ehrliche</em> Zeilen statt Statistik, mit
            einer Frage.
          </p>
          <span className="mt-auto pt-3 text-[14px] font-semibold text-[#9c6b3f]">
            Ganzen Brief lesen →
          </span>
        </Link>

        {/* Worte der Woche */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] lg:col-span-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Worte der Woche
          </div>
          {words.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span
                  key={w.word}
                  className="rounded-full bg-[var(--sand)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)]"
                  style={{ opacity: 0.6 + 0.4 * (w.count / maxWord) }}
                >
                  {w.word}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-[var(--muted)]">Noch keine Worte.</p>
          )}
        </div>
      </div>

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
            <span className="text-[13px] text-[var(--muted)]">
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
              <div className="text-[13px] text-[var(--muted)]">
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
