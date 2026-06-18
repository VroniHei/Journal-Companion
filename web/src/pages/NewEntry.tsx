import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SleepQuality } from "@journal/shared";
import { Button, Card, FieldLabel } from "../components/ui";
import { ScaleField } from "../components/fields/ScaleField";
import { ChipSelect } from "../components/fields/ChipSelect";
import { BoolField } from "../components/fields/BoolField";
import {
  BODY_SIGNALS,
  EMOTIONS,
  IMPULSES,
  INTENTIONS,
  NEEDS,
  TOPICS,
} from "../lib/options";
import { createEntry } from "../db/queries";
import { intentLabel, isStartIntent } from "../lib/intents";

const SLEEP_OPTIONS = ["gut", "mittel", "schlecht"] as const;

export function NewEntry() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawIntent = params.get("intent");
  const intent = isStartIntent(rawIntent) ? rawIntent : undefined;
  const label = intentLabel(intent);

  const [text, setText] = useState("");
  const [mood, setMood] = useState(5);
  const [intensity, setIntensity] = useState(5);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [bodySignals, setBodySignals] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [impulse, setImpulse] = useState<string[]>([]);
  const [intention, setIntention] = useState<string[]>([]);
  const [sleep, setSleep] = useState<string[]>([]);
  const [movementToday, setMovement] = useState<boolean | null>(null);
  const [outsideToday, setOutside] = useState<boolean | null>(null);
  const [cannabisToday, setCannabis] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true);
    const entry = await createEntry({
      text: text.trim(),
      mood,
      intensity,
      emotions,
      bodySignals,
      topics,
      needs,
      impulse: impulse[0] ?? "",
      intention,
      startIntent: intent,
      sleepQuality: (sleep[0] as SleepQuality | undefined) ?? null,
      movementToday,
      outsideToday,
      cannabisToday,
    });
    navigate(`/eintrag/${entry.id}`);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Was ist gerade los?</h1>
        {label && (
          <p className="mt-1 text-sm text-[var(--muted)]">Anliegen: {label}</p>
        )}
      </div>

      <Card className="space-y-6">
        <textarea
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          placeholder="Schreib einfach drauflos – so ungeordnet, wie es gerade ist."
          rows={7}
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-3 outline-none focus:border-[var(--accent)]"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <ScaleField
            label="Stimmung"
            hint="1 schwer · 10 leicht"
            value={mood}
            onChange={setMood}
          />
          <ScaleField
            label="Emotionale Intensität"
            hint="1 ruhig · 10 stark"
            value={intensity}
            onChange={setIntensity}
          />
        </div>

        <ChipSelect
          label="Emotionen"
          options={EMOTIONS}
          selected={emotions}
          onChange={setEmotions}
        />
        <ChipSelect
          label="Körpergefühl"
          options={BODY_SIGNALS}
          selected={bodySignals}
          onChange={setBodySignals}
        />
        <ChipSelect
          label="Themen"
          options={TOPICS}
          selected={topics}
          onChange={setTopics}
        />
        <ChipSelect
          label="Bedürfnisse"
          options={NEEDS}
          selected={needs}
          onChange={setNeeds}
        />
        <ChipSelect
          label="Impuls"
          hint="einer reicht"
          options={IMPULSES}
          selected={impulse}
          onChange={setImpulse}
          multi={false}
        />
        <ChipSelect
          label="Absicht"
          options={INTENTIONS}
          selected={intention}
          onChange={setIntention}
        />

        <div className="space-y-4 border-t border-[var(--border)] pt-5">
          <FieldLabel label="Alltag heute" hint="optional" />
          <ChipSelect
            label="Schlaf"
            options={SLEEP_OPTIONS}
            selected={sleep}
            onChange={setSleep}
            multi={false}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <BoolField
              label="Bewegung"
              value={movementToday}
              onChange={setMovement}
            />
            <BoolField
              label="Draußen"
              value={outsideToday}
              onChange={setOutside}
            />
            <BoolField
              label="Kiffen"
              value={cannabisToday}
              onChange={setCannabis}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate("/")} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={!text.trim() || saving}>
            {saving ? "Speichern…" : "Eintrag speichern"}
          </Button>
        </div>
      </Card>
    </section>
  );
}
