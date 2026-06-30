import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, Card, Eyebrow } from "../components/ui";
import {
  useDecisions,
  useEnergyLevels,
  useEntries,
  useOpenLoops,
} from "../hooks/useData";
import {
  getLatestPattern,
  listPatternInsights,
  listStabilityMoments,
} from "../db/queries";
import {
  collectSummary,
  downloadSummaryMarkdown,
  printSummary,
  SUMMARY_DISCLAIMER,
  SUMMARY_FRAMING,
  SUMMARY_INTRO,
  type SummaryExportModel,
  type SummaryTimeframe,
} from "../lib/summary";

const TIMEFRAMES: { id: SummaryTimeframe; label: string }[] = [
  { id: "7tage", label: "7 Tage" },
  { id: "30tage", label: "30 Tage" },
  { id: "alle", label: "Alle" },
];

export function SummaryExport() {
  const [tf, setTf] = useState<SummaryTimeframe>("30tage");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [disabled, setDisabled] = useState<Record<string, boolean>>({});
  const [freitext, setFreitext] = useState("");
  const [examples, setExamples] = useState<string[]>([]);

  const entries = useEntries();
  const energyLevels = useEnergyLevels();
  const openLoops = useOpenLoops();
  const decisions = useDecisions();
  const patternInsights = useLiveQuery(() => listPatternInsights(), [], []);
  const stabilityMoments = useLiveQuery(() => listStabilityMoments(), [], []);
  const patternSummary = useLiveQuery(() => getLatestPattern(), [], null);

  const result = useMemo(
    () =>
      collectSummary(
        {
          entries,
          energyLevels,
          patternInsights,
          patternSummary,
          openLoops,
          decisions,
          stabilityMoments,
        },
        tf,
      ),
    [
      entries,
      energyLevels,
      patternInsights,
      patternSummary,
      openLoops,
      decisions,
      stabilityMoments,
      tf,
    ],
  );

  // Zeitraumwechsel: Bearbeitungen/Abwahl/Beispiele zurücksetzen (neue Inhalte).
  useEffect(() => {
    setEdits({});
    setDisabled({});
    setExamples([]);
  }, [tf]);

  function toggleExample(id: string) {
    setExamples((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id],
    );
  }

  function buildModel(): SummaryExportModel {
    const sections: { title: string; body: string }[] = [];

    if (freitext.trim())
      sections.push({ title: "Das möchte ich ansprechen", body: freitext.trim() });

    for (const s of result.sections) {
      if (disabled[s.id]) continue;
      const body = (edits[s.id] ?? s.body).trim();
      if (body) sections.push({ title: s.title, body });
    }

    if (examples.length) {
      const chosen = result.exampleCandidates.filter((c) => examples.includes(c.id));
      const body = chosen.map((c) => `**${c.label}**\n${c.excerpt}`).join("\n\n");
      if (body.trim()) sections.push({ title: "Beispiel-Einträge", body });
    }

    return {
      title: `Zusammenfassung — ${result.periodLabel}`,
      framing: SUMMARY_FRAMING,
      disclaimer: SUMMARY_DISCLAIMER,
      sections,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const empty = result.sections.length === 0 && !freitext.trim();

  return (
    <section className="space-y-5">
      <div>
        <Eyebrow>Für dich oder zum Mitnehmen</Eyebrow>
        <h1 className="serif mt-2 text-3xl font-semibold">Zusammenfassung</h1>
      </div>

      <Card>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{SUMMARY_INTRO}</p>
      </Card>

      {/* Zeitraum */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--muted)]">Zeitraum:</span>
        {TIMEFRAMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTf(t.id)}
            aria-pressed={tf === t.id}
            className="rounded-full border px-4 py-2 text-sm transition"
            style={{
              borderColor: tf === t.id ? "var(--accent)" : "var(--border)",
              background: tf === t.id ? "var(--accent-soft)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {empty && (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            Für diesen Zeitraum gibt es noch zu wenig, das sich bündeln lässt. Wähle
            einen größeren Zeitraum oder schreib zuerst ein paar Einträge.
          </p>
        </Card>
      )}

      {/* Datengetriebene Abschnitte — abwählbar und editierbar (kürzen/ändern). */}
      {result.sections.map((s) => {
        const off = Boolean(disabled[s.id]);
        return (
          <Card key={s.id} className="space-y-2">
            <label className="flex items-center gap-2 text-[15px] font-medium">
              <input
                type="checkbox"
                checked={!off}
                onChange={() =>
                  setDisabled((d) => ({ ...d, [s.id]: !off }))
                }
              />
              {s.title}
            </label>
            {!off && (
              <textarea
                value={edits[s.id] ?? s.body}
                onChange={(e) => setEdits((m) => ({ ...m, [s.id]: e.target.value }))}
                rows={Math.min(8, (edits[s.id] ?? s.body).split("\n").length + 1)}
                className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
              />
            )}
          </Card>
        );
      })}

      {/* Beispiel-Einträge (max. 3) */}
      {result.exampleCandidates.length > 0 && (
        <Card className="space-y-2">
          <p className="text-[15px] font-medium">
            Beispiel-Einträge mitnehmen (bis zu 3)
          </p>
          <div className="space-y-2">
            {result.exampleCandidates.map((c) => {
              const on = examples.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer gap-2 rounded-lg border border-[var(--border)] p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleExample(c.id)}
                    disabled={!on && examples.length >= 3}
                  />
                  <span>
                    <span className="font-medium">{c.label}</span>
                    <br />
                    <span className="text-[var(--muted)]">{c.excerpt}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {/* Eigenes Anliegen */}
      <Card className="space-y-2">
        <label className="text-[15px] font-medium">Das möchte ich ansprechen</label>
        <textarea
          value={freitext}
          onChange={(e) => setFreitext(e.target.value)}
          rows={3}
          placeholder="Optional. Was du im Gespräch zuerst ansprechen möchtest."
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
        />
      </Card>

      {/* Export */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => downloadSummaryMarkdown(buildModel(), today)}
          disabled={empty}
        >
          Als Markdown speichern
        </Button>
        <Button variant="ghost" onClick={() => printSummary(buildModel())} disabled={empty}>
          Als PDF speichern (Druckdialog)
        </Button>
      </div>
      <p className="text-[13px] text-[var(--muted)]">
        Nichts wird automatisch verschickt. Die Datei bleibt auf deinem Gerät, bis du
        sie selbst weitergibst.
      </p>
    </section>
  );
}
