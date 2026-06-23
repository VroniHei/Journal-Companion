import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SleepQuality } from "@journal/shared";
import { Eyebrow, FieldLabel } from "../components/ui";
import { ScaleField } from "../components/fields/ScaleField";
import { ChipSelect } from "../components/fields/ChipSelect";
import { BoolField } from "../components/fields/BoolField";
import { DictationButton } from "../components/DictationButton";
import {
  BODY_SIGNALS,
  EMOTIONS,
  IMPULSES,
  INTENTIONS,
  NEEDS,
  TOPICS,
} from "../lib/options";
import { createEntry } from "../db/queries";
import { generateTitleFor } from "../lib/title";
import { intentLabel, isStartIntent } from "../lib/intents";

const SLEEP_OPTIONS = ["gut", "mittel", "schlecht"] as const;

// Schreib-Impulse: offene, ruhige Fragen (Vroni-Stimme, kein Ratschlag). Das
// kursive Akzentwort wird grün gesetzt (.g).
const WRITE_PROMPTS: { pre: string; accent: string; post: string }[] = [
  { pre: "Was beschäftigt dich ", accent: "gerade", post: " am meisten?" },
  { pre: "Wie ", accent: "geht", post: " es dir heute wirklich?" },
  { pre: "Was war heute ", accent: "schön", post: " — und was schwer?" },
  { pre: "Wofür bist du heute ", accent: "dankbar", post: "?" },
  { pre: "Was brauchst du ", accent: "gerade", post: ", das du dir nicht gibst?" },
  { pre: "Was geht dir ", accent: "nicht aus dem Kopf", post: "?" },
  { pre: "Was darf diese Woche ", accent: "liegen bleiben", post: "?" },
];

// Eine eingeklappte Sektion (Accordion) für die selteneren Felder.
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 [&::-webkit-details-marker]:hidden">
        <FieldLabel label={title} hint={hint} />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9a917f"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          aria-hidden="true"
          className="flex-none transition group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3 space-y-4">{children}</div>
    </details>
  );
}

export function NewEntry() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawIntent = params.get("intent");
  const intent = isStartIntent(rawIntent) ? rawIntent : undefined;
  const label = intentLabel(intent);
  // Optionaler Auftakt-Impuls (Deep-Link aus den Impuls-Paketen).
  const promptParam = params.get("prompt")?.trim();

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
  const [usedVoice, setUsedVoice] = useState(false);
  const [saving, setSaving] = useState(false);

  // Schreib-Impuls: Deep-Link-Prompt zuerst, danach durch die Sammlung rotieren.
  const [promptIdx, setPromptIdx] = useState(0);
  const [cycled, setCycled] = useState(false);
  const showParam = !!promptParam && !cycled;
  const cur = showParam
    ? { pre: "", accent: promptParam as string, post: "" }
    : WRITE_PROMPTS[promptIdx % WRITE_PROMPTS.length];
  function cyclePrompt() {
    if (showParam) {
      // Vom Deep-Link-Impuls in die Sammlung wechseln.
      setCycled(true);
      setPromptIdx(0);
    } else {
      setPromptIdx((i) => i + 1);
    }
  }

  const now = useMemo(() => new Date(), []);
  const dateLabel = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

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
      inputType: usedVoice ? "voice" : "text",
      transcript: usedVoice ? text.trim() : undefined,
      startIntent: intent,
      sleepQuality: (sleep[0] as SleepQuality | undefined) ?? null,
      movementToday,
      outsideToday,
      cannabisToday,
    });
    // KI-Titel im Hintergrund erzeugen (blockt die Navigation nicht).
    void generateTitleFor(entry.id, entry.text);
    navigate(`/eintrag/${entry.id}`);
  }

  // Speichern-Block (Desktop unter der Textarea, Mobile am Ende).
  const saveBlock = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={save}
        disabled={!text.trim() || saving}
        className="flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-[16px] font-semibold text-[#23221A] shadow-[0_8px_22px_rgba(110,155,44,.32)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
        style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
      >
        {saving ? "Speichern…" : "Eintrag speichern"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
          <path d="M5 12.5l4 4 10-10" />
        </svg>
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate("/")}
          disabled={saving}
          className="text-[14px] font-medium text-[#9a917f] transition hover:text-[var(--foreground)] disabled:opacity-50"
        >
          Verwerfen
        </button>
      </div>
      <p className="text-center text-[12.5px] leading-[1.5] text-[#9a917f]">
        Dein Eintrag bleibt auf diesem Gerät. Nur wenn du eine Reflexion
        anforderst, geht der Text an die KI.
      </p>
    </div>
  );

  return (
    <section className="space-y-6">
      {/* Kopf */}
      <div>
        <Eyebrow>Neuer Eintrag · {dateLabel}</Eyebrow>
        <h1 className="serif mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
          Was beschäftigt dich <em className="g">heute</em>?
        </h1>
        {label && (
          <p className="mt-1.5 text-sm text-[var(--muted)]">Anliegen: {label}</p>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
        {/* Linke Spalte: Schreiben */}
        <div className="space-y-4">
          {/* Schreib-Impuls */}
          <div
            className="relative overflow-hidden rounded-[20px] border p-[16px_18px] shadow-[0_8px_24px_rgba(120,86,52,.10)]"
            style={{
              borderColor: "rgba(205,138,91,.22)",
              background: "linear-gradient(135deg,#F8EFDF,#F4F0E6)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-5 -top-7 h-[120px] w-[120px] rounded-full blur-[22px]"
              style={{ background: "radial-gradient(circle,rgba(224,170,80,.28),transparent 68%)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9c6b3f]">
                  Schreib-Impuls
                </div>
                <p className="text-[16px] font-[450] leading-[1.5] text-[#3a2e22] sm:text-[17px]">
                  {cur.pre}
                  <em className="g">{cur.accent}</em>
                  {cur.post}
                </p>
              </div>
              <button
                type="button"
                onClick={cyclePrompt}
                className="mt-0.5 inline-flex flex-none items-center gap-1.5 rounded-full border px-[11px] py-[6px] text-[12.5px] font-semibold text-[#9c6b3f] transition hover:bg-white/70"
                style={{ borderColor: "rgba(205,138,91,.22)", background: "rgba(255,255,255,.55)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 8V3h5" />
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                </svg>
                <span className="hidden sm:inline">Anderer Impuls</span>
                <span className="sm:hidden">Anderer</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)] focus-within:shadow-[0_0_0_3px_rgba(168,232,79,.22),0_6px_22px_rgba(35,34,26,.05)]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreib einfach drauflos. Kein Muss, kein richtig oder falsch."
              className="min-h-[200px] w-full resize-none border-none bg-transparent text-[16px] leading-[1.72] text-[var(--foreground)] outline-none placeholder:text-[#9a917f] sm:min-h-[260px] sm:text-[17px]"
            />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(35,34,26,.07)] pt-2.5">
              <DictationButton
                value={text}
                onChange={setText}
                onActivate={() => setUsedVoice(true)}
              />
              <span className="text-right text-[12px] text-[#9a917f]">
                {wordCount} {wordCount === 1 ? "Wort" : "Wörter"} · {dateLabel} · {timeLabel}
              </span>
            </div>
          </div>

          {/* Speichern (Desktop unter der Textarea) */}
          <div className="hidden lg:block">{saveBlock}</div>
        </div>

        {/* Rechte Spalte: Kontext-Panel (Stimmung, Gefühl, eingeklappte Felder) */}
        <div className="mt-4 lg:mt-0">
          <div
            className="space-y-5 rounded-[22px] border p-5"
            style={{ background: "#FAFAF7", borderColor: "rgba(35,34,26,.1)" }}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
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

            {/* Gefühl — offen */}
            <div className="space-y-4 border-t border-[rgba(35,34,26,.1)] pt-5">
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
            </div>

            {/* Worum es geht — eingeklappt */}
            <div className="border-t border-[rgba(35,34,26,.1)] pt-4">
              <Section title="Worum es geht" hint="optional">
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
              </Section>
            </div>

            {/* Impuls & Absicht — eingeklappt */}
            <div className="border-t border-[rgba(35,34,26,.1)] pt-4">
              <Section title="Impuls & Absicht" hint="optional">
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
              </Section>
            </div>

            {/* Alltag heute — eingeklappt */}
            <div className="border-t border-[rgba(35,34,26,.1)] pt-4">
              <Section title="Alltag heute" hint="optional">
                <ChipSelect
                  label="Schlaf"
                  options={SLEEP_OPTIONS}
                  selected={sleep}
                  onChange={setSleep}
                  multi={false}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <BoolField label="Bewegung" value={movementToday} onChange={setMovement} />
                  <BoolField label="Draußen" value={outsideToday} onChange={setOutside} />
                  <BoolField label="Kiffen" value={cannabisToday} onChange={setCannabis} />
                </div>
              </Section>
            </div>
          </div>

          {/* Speichern (Mobile am Ende) */}
          <div className="mt-5 lg:hidden">{saveBlock}</div>
        </div>
      </div>
    </section>
  );
}
