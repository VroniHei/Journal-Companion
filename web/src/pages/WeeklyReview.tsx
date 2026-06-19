import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { PatternSummary } from "@journal/shared";
import { Button, Card } from "../components/ui";
import { FormattedText } from "../components/FormattedText";
import { useEntries, useSettings } from "../hooks/useData";
import { listPatternsDesc, savePattern, toDigest } from "../db/queries";
import { toPrefs } from "../lib/settings";
import { postWeeklyReview } from "../lib/apiClient";
import { aggregate } from "../lib/patterns";
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
          <p className="text-sm text-[var(--danger)]">{error}</p>
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
