import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { ScaleField } from "../components/fields/ScaleField";
import { ChipSelect } from "../components/fields/ChipSelect";
import {
  BODY_SIGNALS,
  EMOTIONS,
  IMPULSES,
  INTENTIONS,
  NEEDS,
  TOPICS,
} from "../lib/options";
import { createEntry } from "../db/queries";

export function NewEntry() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [mood, setMood] = useState(5);
  const [intensity, setIntensity] = useState(5);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [bodySignals, setBodySignals] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [impulse, setImpulse] = useState<string[]>([]);
  const [intention, setIntention] = useState<string[]>([]);
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
    });
    navigate(`/eintrag/${entry.id}`);
  }

  return (
    <section className="space-y-6">
      <h1 className="serif text-3xl font-semibold">Was ist gerade los?</h1>

      <Card className="space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
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

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            disabled={saving}
          >
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
