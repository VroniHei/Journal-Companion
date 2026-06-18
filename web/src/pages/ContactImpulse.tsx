import { useState } from "react";
import type {
  ContactImpulseRecommendation,
  ContactImpulseResponse,
} from "@journal/shared";
import { Button, Card, FieldLabel } from "../components/ui";
import { DictationButton } from "../components/DictationButton";
import { ScaleField } from "../components/fields/ScaleField";
import { ChipSelect } from "../components/fields/ChipSelect";
import { useSettings } from "../hooks/useData";
import { toPrefs } from "../lib/settings";
import { postContactImpulse } from "../lib/apiClient";
import { recordStabilityMoment } from "../db/queries";
import {
  addDraft,
  isReady,
  listDrafts,
  minutesUntilTomorrowMorning,
  removeDraft,
  type ContactDraft,
} from "../lib/contactDrafts";

const GOALS = ["Klärung", "Verbindung", "Beruhigung"] as const;

const REC_META: Record<
  ContactImpulseRecommendation,
  { label: string; danger?: boolean }
> = {
  "nicht-senden": { label: "Nicht senden – erst regulieren", danger: true },
  "später-prüfen": { label: "Später prüfen" },
  "kurze-würdevolle-nachricht": { label: "Kurze, würdevolle Nachricht ist okay" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactImpulse() {
  const settings = useSettings();

  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState<string[]>([]);
  const [activation, setActivation] = useState(7);
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContactImpulseResponse | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ContactDraft[]>(() => listDrafts());

  async function check() {
    if (!situation.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCrisis(null);
    try {
      const res = await postContactImpulse({
        situation: situation.trim(),
        goal: goal[0] ?? "",
        activation,
        draft: draft.trim() || undefined,
        prefs: toPrefs(settings),
      });
      if ("crisis" in res) {
        setCrisis(res.message);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  const quarantineText = (result?.draftMessage ?? draft).trim();

  function quarantine(minutes: number) {
    if (!quarantineText) return;
    addDraft(quarantineText, minutes);
    recordStabilityMoment(
      "entwurf-statt-senden",
      "Nachricht in Quarantäne statt sofort gesendet",
    );
    setDrafts(listDrafts());
  }

  function recheck(d: ContactDraft) {
    setDraft(d.text);
    removeDraft(d.id);
    setDrafts(listDrafts());
    setResult(null);
    setCrisis(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Kontaktimpuls prüfen</h1>
        <p className="mt-1 text-[var(--muted)]">
          Bevor du etwas schreibst: kurz sortieren, was gerade los ist.
        </p>
      </div>

      <Card className="space-y-5">
        <div>
          <FieldLabel label="Worum geht es? An wen?" />
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={4}
            placeholder="Was möchtest du schreiben – und warum gerade jetzt?"
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="mt-2">
            <DictationButton
              onText={(seg) =>
                setSituation((p) => (p ? `${p} ${seg}` : seg))
              }
            />
          </div>
        </div>

        <ChipSelect
          label="Was suchst du gerade?"
          options={GOALS}
          selected={goal}
          onChange={setGoal}
          multi={false}
        />

        <ScaleField
          label="Wie hoch ist deine Aktivierung?"
          hint="1 ruhig · 10 sehr aufgewühlt"
          value={activation}
          onChange={setActivation}
        />

        <div>
          <FieldLabel label="Nachrichten-Entwurf" hint="optional" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Falls du schon Worte hast – hier rein (wird nicht gesendet)."
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={check} disabled={!situation.trim() || loading}>
            {loading ? "Schaue mit dir drauf…" : "Mit Abstand draufschauen"}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      )}

      {crisis && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p
            className="mb-1 text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--danger)" }}
          >
            Schutzhinweis
          </p>
          <p className="whitespace-pre-wrap text-sm">{crisis}</p>
        </Card>
      )}

      {result && (
        <Card className="space-y-4">
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-sm font-medium"
              style={{
                background: REC_META[result.recommendation].danger
                  ? "color-mix(in srgb, var(--danger) 14%, transparent)"
                  : "var(--accent-soft)",
                color: REC_META[result.recommendation].danger
                  ? "var(--danger)"
                  : "var(--foreground)",
              }}
            >
              {REC_META[result.recommendation].label}
            </span>
          </div>

          {result.reflection && (
            <p className="whitespace-pre-wrap text-[15px]">{result.reflection}</p>
          )}
          <div className="space-y-1 text-sm text-[var(--muted)]">
            {result.likelyNeed && (
              <p>
                <span className="font-medium text-[var(--foreground)]">
                  Bedürfnis darunter:
                </span>{" "}
                {result.likelyNeed}
              </p>
            )}
            {result.why && <p>{result.why}</p>}
            {result.nextStep && (
              <p>
                <span className="font-medium text-[var(--foreground)]">
                  Kleiner nächster Schritt:
                </span>{" "}
                {result.nextStep}
              </p>
            )}
          </div>

          {result.draftMessage && (
            <div className="rounded-lg border-l-2 border-l-[var(--accent)] bg-[var(--surface-2)] p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--accent-text)]">
                Würdevolle Kurzversion
              </p>
              <p className="whitespace-pre-wrap text-sm">{result.draftMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* Schutzraum: nicht sofort senden, erst in Quarantäne */}
      {quarantineText && (
        <Card className="space-y-3 bg-[var(--surface-2)]">
          <p className="text-sm">
            Gib dir Zeit. Wenn du die Nachricht in 20 Minuten noch stimmig
            findest, schaust du nochmal drauf. Diese Nachricht darf erstmal in
            Quarantäne.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => quarantine(20)}>
              20 Minuten warten
            </Button>
            <Button
              variant="ghost"
              onClick={() => quarantine(minutesUntilTomorrowMorning())}
            >
              Heute nicht senden – morgen prüfen
            </Button>
          </div>
        </Card>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            In Quarantäne
          </h2>
          {drafts.map((d) => {
            const ready = isReady(d);
            return (
              <Card key={d.id} className="space-y-2">
                <p className="whitespace-pre-wrap text-sm">{d.text}</p>
                <p className="text-xs text-[var(--muted)]">
                  {ready
                    ? "Wartezeit vorbei – du kannst jetzt mit Abstand draufschauen."
                    : `Frühestens prüfen ab ${formatTime(d.recheckAt)}.`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => recheck(d)}
                    disabled={!ready}
                  >
                    Jetzt prüfen
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      removeDraft(d.id);
                      setDrafts(listDrafts());
                    }}
                  >
                    Verwerfen
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
