import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import type {
  JournalEntry,
  PatternDepth,
  PatternEntryInput,
  PatternInsight,
  PatternTimeframe,
  PatternType,
} from "@journal/shared";
import { Button, Card, Eyebrow } from "../components/ui";
import { MoodCard } from "../components/MoodCard";
import { useEntries, useSettings } from "../hooks/useData";
import {
  deletePatternInsight,
  listPatternInsights,
  listStabilityMoments,
  savePatternInsights,
  setPatternFeedback,
  setPatternNotes,
} from "../db/queries";
import { aggregate } from "../lib/patterns";
import {
  buildInsights,
  computeStreak,
  themeClusters,
  wordsOfWeek,
} from "../lib/insights";
import { ThemeMiniCard } from "../components/ThemeMiniCard";
import { toPrefs } from "../lib/settings";
import { postPatternInsights } from "../lib/apiClient";
import { formatDateTime } from "../lib/format";

function Chips({ items }: { items: [string, number][] }) {
  if (!items.length) return <span className="text-sm text-[var(--muted)]">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, n]) => (
        <span
          key={label}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
        >
          {label} · {n}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

const TYPE_LABEL: Record<PatternType, string> = {
  rumination: "Grübeln",
  avoidance: "Vermeidung",
  "action-pressure": "Handlungsdruck",
  "contact-impulse": "Kontaktimpuls",
  "self-worth": "Selbstwert",
  regulation: "Regulation",
  relationship: "Beziehung",
  "decision-making": "Entscheidung",
  overload: "Überlastung",
  other: "Sonstiges",
};

function toInputs(
  entries: JournalEntry[],
  timeframe: PatternTimeframe,
): PatternEntryInput[] {
  const now = Date.now();
  const cutoff =
    timeframe === "7tage"
      ? now - 7 * 86_400_000
      : timeframe === "30tage"
        ? now - 30 * 86_400_000
        : 0;
  return entries
    .filter((e) => new Date(e.createdAt).getTime() >= cutoff)
    .slice(0, 60)
    .map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      mood: e.mood,
      intensity: e.intensity,
      emotions: e.emotions,
      bodySignals: e.bodySignals,
      topics: e.topics,
      needs: e.needs,
      impulse: e.impulse,
      text: e.text.slice(0, 600),
    }))
    .reverse();
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {title}
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={`${title}-${i}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FEEDBACKS: { key: "passt" | "teilweise" | "passt-nicht"; label: string }[] =
  [
    { key: "passt", label: "Passt" },
    { key: "teilweise", label: "Teilweise" },
    { key: "passt-nicht", label: "Passt nicht" },
  ];

function PatternCard({ p }: { p: PatternInsight }) {
  const [notes, setNotes] = useState(p.userNotes ?? "");

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{p.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">
              {TYPE_LABEL[p.patternType]}
            </span>
            <span>Sicherheit: {p.confidence}</span>
          </div>
        </div>
      </div>

      {p.description && <p className="text-[15px] leading-relaxed">{p.description}</p>}

      {p.typicalSequence.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Typischer Ablauf
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {p.typicalSequence.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <FieldList title="Frühe Warnzeichen" items={p.earlyWarningSigns} />

      <div className="grid gap-4 sm:grid-cols-2">
        {p.helpfulSide && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--accent-text)]">
              Hilfreiche Seite
            </p>
            <p className="text-sm">{p.helpfulSide}</p>
          </div>
        )}
        {p.difficultSide && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Schwierige Seite
            </p>
            <p className="text-sm">{p.difficultSide}</p>
          </div>
        )}
      </div>

      <FieldList title="Was jetzt helfen könnte" items={p.interruptionStrategies} />

      {p.dontDoNow.length > 0 && (
        <div className="rounded-lg border-l-2 border-l-[var(--danger)] bg-[var(--surface-2)] p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--danger)]">
            Was jetzt eher nicht hilft
          </p>
          <ul className="space-y-1 text-sm">
            {p.dontDoNow.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {p.suggestedExperiment && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Kleines Experiment
          </p>
          <p className="text-sm">{p.suggestedExperiment}</p>
        </div>
      )}

      {p.reflectionQuestion && (
        <p className="text-sm italic text-[var(--muted)]">
          {p.reflectionQuestion}
        </p>
      )}

      {/* Feedback + Notizen */}
      <div className="space-y-3 border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Passt dieses Muster?</span>
          {FEEDBACKS.map((f) => {
            const active = p.userFeedback === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setPatternFeedback(p.id, f.key)}
                className="rounded-full border px-3 py-1 text-sm transition"
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  background: active ? "var(--accent-soft)" : "transparent",
                }}
              >
                {f.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => deletePatternInsight(p.id)}
            className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--danger)]"
          >
            Entfernen
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => setPatternNotes(p.id, notes)}
          rows={2}
          placeholder="Eigene Notiz zu diesem Muster…"
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>
    </Card>
  );
}

export function Patterns() {
  const entries = useEntries();
  const settings = useSettings();
  const a = aggregate(entries);
  const moments = useLiveQuery(() => listStabilityMoments(), [], []);
  const insights = useLiveQuery(() => listPatternInsights(), [], []);

  const [timeframe, setTimeframe] = useState<PatternTimeframe>("30tage");
  const [depth, setDepth] = useState<PatternDepth>("mittel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (loading) return;
    const inputs = toInputs(entries, timeframe);
    if (!inputs.length) {
      setError("Im gewählten Zeitraum gibt es keine Einträge.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postPatternInsights({
        entries: inputs,
        existingPatterns: insights.map((p) => ({
          title: p.title,
          patternType: p.patternType,
          userFeedback: p.userFeedback ?? null,
        })),
        timeframe,
        depth,
        prefs: toPrefs(settings),
      });
      if (res.patterns.length === 0) {
        setError(
          "Es haben sich noch keine klaren Muster gezeigt. Schreib weiter, dann wird es mit der Zeit deutlicher.",
        );
      } else {
        await savePatternInsights(res.patterns);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  if (entries.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="serif text-3xl font-semibold">Muster</h1>
        <Card>
          <p className="text-[var(--muted)]">
            Noch keine Einträge. Sobald du schreibst, zeigen sich hier
            Stimmung, Themen, Bedürfnisse und stabilisierende Handlungen.
          </p>
        </Card>
      </section>
    );
  }

  const selectClass =
    "rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

  // Bento-Daten (Desktop nutzt die volle Breite als mehrspaltiges Raster).
  const clusters = themeClusters(entries);
  const topCluster = clusters[0];
  const words = wordsOfWeek(entries);
  const streak = computeStreak(entries);

  // „Was sich zeigt"-Kachel (Claude Design Juni 2026): Einsicht + Mini-Karte.
  const wsInsights = buildInsights(entries);
  const wsText =
    wsInsights[0] ??
    "Sobald sich Themen über mehrere Einträge wiederholen, zeigt sich hier, was sich durchzieht.";
  const wsKeywordRaw = words[0]?.word ?? topCluster?.title ?? "Heute";
  const wsKeyword =
    wsKeywordRaw.charAt(0).toUpperCase() + wsKeywordRaw.slice(1);

  return (
    <section className="space-y-8">
      <div>
        <Eyebrow>Deine Muster</Eyebrow>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-[-0.02em]">
          Was sich bei dir <em className="g">durchzieht</em>
        </h1>
      </div>

      {/* Bento: Desktop volle Breite (12-Spalten), Mobile gestapelt. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-[18px]">
        {/* Stimmung · 14 Tage (Punkt-Default; 14 statt 30, damit die Punkte
            nicht über die Karte laufen — einheitlich mit dem Rückblick) */}
        <div className="lg:col-span-7">
          <MoodCard
            entries={entries}
            dayCount={14}
            defaultView="punkte"
            title="Stimmung · 14 Tage"
          />
        </div>

        {/* Was sich zeigt — fasst das Muster zusammen; Mini-Karte + Drill-in zum
            Roten Faden + Teilen (Claude Design Juni 2026). */}
        <div className="flex flex-col rounded-[20px] border border-[var(--border)] bg-[radial-gradient(300px_170px_at_90%_0%,rgba(205,138,91,0.07),transparent_62%)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] lg:col-span-5">
          <div className="mb-2.5 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--clay,#CD8A5B)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Was sich zeigt
            </span>
          </div>
          <p className="text-[16px] font-[450] leading-[1.5] text-[var(--foreground)]">
            {wsText}
          </p>
          {words.length > 0 && (
            <div className="mt-3 flex gap-1.5 overflow-hidden">
              {words.slice(0, 4).map((w) => (
                <span
                  key={w.word}
                  className="whitespace-nowrap rounded-full bg-[var(--sand)] px-[11px] py-1 text-[12px] font-medium text-[var(--foreground)]"
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center gap-3.5 border-t border-[var(--border)] pt-3.5">
            <ThemeMiniCard
              keyword={wsKeyword}
              wordSize={18}
              className="h-[76px] w-[110px] flex-none sm:h-[60px] sm:w-[86px]"
            />
            <div className="flex flex-1 flex-col gap-2.5">
              <Link
                to="/roter-faden"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--green-text,#447510)]"
              >
                Roter Faden ansehen
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                  <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
                </svg>
              </Link>
              <Link
                to="/teilen"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[7px] text-[12px] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                  <path d="M12 14V4M8.5 7.5 12 4l3.5 3.5" />
                  <path d="M5 12.5V18.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12.5" />
                </svg>
                Als Karte teilen
              </Link>
            </div>
          </div>
        </div>

        {/* Verlauf ansehen */}
        <Link
          to="/verlauf"
          className="lift flex flex-col rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] lg:col-span-4"
        >
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Verlauf ansehen
          </div>
          <p className="text-[14px] leading-[1.5] text-[var(--muted)]">
            Wie hat sich deine Stimmung über Monate <em className="g">verändert</em>?
          </p>
          <span className="mt-auto pt-4 text-[14px] font-semibold text-[var(--green-text,#447510)]">
            6-Monats-Verlauf →
          </span>
        </Link>

        {/* Häufige Worte */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] lg:col-span-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Häufige Worte
          </div>
          {words.length ? (
            <div className="flex flex-wrap gap-1.5">
              {words.map((w) => (
                <span
                  key={w.word}
                  className="rounded-full bg-[var(--sand)] px-[11px] py-1 text-[12px] font-medium text-[var(--foreground)]"
                >
                  {w.word}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-[var(--muted)]">Noch keine Worte.</p>
          )}
        </div>

        {/* In Folge */}
        <div className="flex flex-col rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] lg:col-span-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            In Folge
          </div>
          <div className="text-[40px] font-extrabold leading-none tracking-[-0.02em] text-[var(--green-deep,#6E9B2C)]">
            {streak}
          </div>
          <div className="mt-1 text-[13px] text-[var(--muted)]">Tage am Stück</div>
        </div>
      </div>

      {/* Quantitative Übersicht — Desktop/Tablet. Mobil kompakt wie Prototyp:
          Muster = Drill-ins + Stimmung; die Detailauswertung ab sm. */}
      <div className="hidden space-y-6 sm:block">
        <Card>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Einträge" value={String(a.count)} />
            <Stat label="Ø Stimmung" value={a.avgMood?.toString() ?? "—"} />
            <Stat label="Ø Intensität" value={a.avgIntensity?.toString() ?? "—"} />
            <Stat label="Kontaktimpulse" value={String(a.contactImpulses)} />
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
              Häufigste Emotionen
            </h2>
            <Chips items={a.topEmotions} />
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
              Häufigste Themen
            </h2>
            <Chips items={a.topTopics} />
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
              Häufigste Bedürfnisse
            </h2>
            <Chips items={a.topNeeds} />
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
            Stabilisierende Handlungen
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Tage mit Bewegung" value={String(a.movementDays)} />
            <Stat label="Tage draußen" value={String(a.outsideDays)} />
            <Stat label="erkannte Schleifen" value={String(a.ruminations)} />
          </div>
        </Card>

        {moments.length > 0 && (
          <Card>
            <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
              Stabile Momente
            </h2>
            <ul className="space-y-1.5 text-sm">
              {moments.slice(0, 12).map((m) => (
                <li key={m.id} className="flex items-baseline gap-2">
                  <span style={{ color: "var(--accent-text)" }}>•</span>
                  <span>{m.label}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatDateTime(m.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Qualitative Muster (zweite Ebene) */}
      <div className="space-y-4">
        <Eyebrow>Erkannte Muster</Eyebrow>
        <Card className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Diese Ebene sucht in mehreren Einträgen nach wiederkehrenden Abläufen:
            wie sich Themen, Gefühle, Impulse und Handlungen verketten.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              Zeitraum
              <select
                className={selectClass}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as PatternTimeframe)}
              >
                <option value="7tage">letzte 7 Tage</option>
                <option value="30tage">letzte 30 Tage</option>
                <option value="alle">alle Einträge</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              Tiefe
              <select
                className={selectClass}
                value={depth}
                onChange={(e) => setDepth(e.target.value as PatternDepth)}
              >
                <option value="kurz">kurz</option>
                <option value="mittel">mittel</option>
                <option value="tief">tief</option>
              </select>
            </label>
            <Button onClick={analyze} disabled={loading}>
              {loading ? "Analysiere…" : "Muster tiefer analysieren"}
            </Button>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </Card>

        {insights.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Noch keine tiefen Muster. Starte oben eine Analyse.
          </p>
        ) : (
          <div className="space-y-4">
            {insights.map((p) => (
              <PatternCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {a.highIntensity.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Einträge mit hoher Intensität
          </h2>
          <div className="space-y-2">
            {a.highIntensity.slice(0, 8).map((e) => (
              <Link key={e.id} to={`/eintrag/${e.id}`} className="block">
                <Card className="lift hover:border-[var(--accent)]">
                  <div className="text-xs text-[var(--muted)]">
                    {formatDateTime(e.createdAt)} · Intensität {e.intensity}
                  </div>
                  <p className="line-clamp-1 text-sm">{e.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
