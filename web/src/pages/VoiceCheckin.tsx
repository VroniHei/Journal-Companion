import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { VoiceReflectResponse } from "@journal/shared";
import { Button, Card, FieldLabel } from "../components/ui";
import { ScaleField } from "../components/fields/ScaleField";
import { DictationButton } from "../components/DictationButton";
import { SpeakButton } from "../components/SpeakButton";
import { useSettings } from "../hooks/useData";
import { toPrefs } from "../lib/settings";
import { postVoiceReflect } from "../lib/apiClient";
import { createEntry, updateEntry } from "../db/queries";
import { generateTitleFor } from "../lib/title";

function resultToReflectionText(r: VoiceReflectResponse): string {
  return [
    r.entrySummary,
    r.mainEmotions.length ? `Emotionen: ${r.mainEmotions.join(", ")}` : "",
    r.mainNeed ? `Bedürfnis darunter: ${r.mainNeed}` : "",
    r.mainTrigger ? `Auslöser: ${r.mainTrigger}` : "",
    r.keyInsights.length ? `Erkenntnisse:\n- ${r.keyInsights.join("\n- ")}` : "",
    r.supportiveImpulse ? `Was jetzt hilft: ${r.supportiveImpulse}` : "",
    r.dontDoNow.length
      ? `Was jetzt eher nicht hilfreich wäre:\n- ${r.dontDoNow.join("\n- ")}`
      : "",
    r.nextStep ? `Kleiner nächster Schritt: ${r.nextStep}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {title}
      </p>
      {children}
    </div>
  );
}

export function VoiceCheckin() {
  const navigate = useNavigate();
  const settings = useSettings();

  const [transcript, setTranscript] = useState("");
  const [mood, setMood] = useState(5);
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceReflectResponse | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function evaluate() {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCrisis(null);
    try {
      const res = await postVoiceReflect({
        transcript: transcript.trim(),
        prefs: toPrefs(settings),
      });
      if ("crisis" in res) setCrisis(res.message);
      else setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAsEntry() {
    if (!result || saving) return;
    setSaving(true);
    const entry = await createEntry({
      text: transcript.trim(),
      mood,
      intensity,
      emotions: result.mainEmotions,
      bodySignals: [],
      topics: [],
      needs: result.mainNeed ? [result.mainNeed] : [],
      impulse: "",
      intention: [],
      inputType: "voice",
      transcript: transcript.trim(),
    });
    await updateEntry(entry.id, {
      aiReflection: resultToReflectionText(result),
      entrySummary: result.entrySummary,
      keyInsights: result.keyInsights,
      dontDoNow: result.dontDoNow,
      supportiveImpulse: result.supportiveImpulse,
      mainTrigger: result.mainTrigger,
      mainNeed: result.mainNeed,
    });
    void generateTitleFor(entry.id, transcript.trim());
    navigate(`/eintrag/${entry.id}`);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Sprach-Check-in</h1>
        <p className="mt-1 text-[var(--muted)]">
          Erzähl einfach frei, was gerade los ist. Ich sortiere es danach mit dir.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-2">
          <FieldLabel label="Was ist gerade los?" />
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            placeholder="Sprich los – oder tippe. Du kannst den Text danach noch anpassen."
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          <DictationButton value={transcript} onChange={setTranscript} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <ScaleField label="Stimmung" hint="1 schwer · 10 leicht" value={mood} onChange={setMood} />
          <ScaleField
            label="Intensität"
            hint="1 ruhig · 10 stark"
            value={intensity}
            onChange={setIntensity}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={evaluate} disabled={!transcript.trim() || loading}>
            {loading ? "Werte aus…" : "Auswerten"}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Auswertung
            </p>
            <SpeakButton text={resultToReflectionText(result)} />
          </div>
          {result.entrySummary && (
            <p className="text-[15px] leading-relaxed">{result.entrySummary}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.mainEmotions.length > 0 && (
              <Block title="Emotionen">
                <p className="text-sm">{result.mainEmotions.join(", ")}</p>
              </Block>
            )}
            {result.mainNeed && (
              <Block title="Bedürfnis darunter">
                <p className="text-sm">{result.mainNeed}</p>
              </Block>
            )}
            {result.mainTrigger && (
              <Block title="Auslöser">
                <p className="text-sm">{result.mainTrigger}</p>
              </Block>
            )}
            {result.nextStep && (
              <Block title="Kleiner nächster Schritt">
                <p className="text-sm">{result.nextStep}</p>
              </Block>
            )}
          </div>

          {result.keyInsights.length > 0 && (
            <Block title="Erkenntnisse">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {result.keyInsights.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </Block>
          )}

          {result.supportiveImpulse && (
            <Block title="Was jetzt hilft">
              <p className="text-sm">{result.supportiveImpulse}</p>
            </Block>
          )}

          {result.dontDoNow.length > 0 && (
            <div className="rounded-lg border-l-2 border-l-[var(--accent)] bg-[var(--surface-2)] p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--accent-text)]">
                Was jetzt eher nicht hilfreich wäre
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {result.dontDoNow.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={saveAsEntry} disabled={saving}>
              {saving ? "Speichern…" : "Als Eintrag speichern"}
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}
