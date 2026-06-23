import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SleepQuality } from "@journal/shared";
import { detectCrisis } from "@journal/shared/crisis";
import { Eyebrow } from "../components/ui";
import { BoolField } from "../components/fields/BoolField";
import { CrisisNotice } from "../components/CrisisNotice";
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

// Schreib-Impulse: offene, ruhige Fragen (Vroni-Stimme, kein Ratschlag); das
// kursive Akzentwort wird grün gesetzt (.g).
const WRITE_PROMPTS: { pre: string; accent: string; post: string }[] = [
  { pre: "Was war heute ", accent: "leichter", post: ", als du erwartet hast?" },
  { pre: "Wovon möchtest du morgen ", accent: "ein bisschen mehr", post: "?" },
  { pre: "Was hat dir heute ", accent: "gutgetan", post: ", ganz unspektakulär?" },
  { pre: "Was beschäftigt dich ", accent: "gerade", post: " am meisten?" },
  { pre: "Was darf diese Woche ", accent: "liegen bleiben", post: "?" },
  { pre: "Was geht dir ", accent: "nicht aus dem Kopf", post: "?" },
];

// Skala 1–10 im Editor-Stil: gefüllte Sand-Kreise, Auswahl als grüner Verlauf
// (nie dunkel), gleichmäßig über die Breite verteilt.
function Scale({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="text-[12px] font-[650] text-[#23221A]">{label}</span>
        <span className="text-[11.5px] text-[#b0a896]">{hint}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              aria-label={`${label}: ${n}`}
              onClick={() => onChange(n)}
              className="flex aspect-square min-w-0 flex-1 items-center justify-center rounded-full p-0 text-[12.5px] transition"
              style={{
                background: active
                  ? "linear-gradient(135deg,#B4ED63,#A8E84F)"
                  : "#F1ECE0",
                color: active ? "#23221A" : "#9a917f",
                fontWeight: active ? 700 : 500,
                boxShadow: active ? "0 3px 8px rgba(110,155,44,.32)" : "none",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Chip-Gruppe im Editor-Stil: weiß + leichter Schatten, Auswahl als grüner
// Verlauf mit grünem Rand (kein Haken, nie dunkel).
function Chips({
  label,
  options,
  selected,
  onChange,
  multi = true,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  function toggle(opt: string) {
    if (multi) {
      onChange(
        selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt],
      );
    } else {
      onChange(selected.includes(opt) ? [] : [opt]);
    }
  }
  return (
    <div>
      <div className="mb-2 text-[12px] font-[650] text-[#5d564a]">{label}</div>
      <div className="flex flex-wrap gap-[7px]">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt)}
              className="rounded-full px-[13px] py-[6px] text-[13px] transition"
              style={
                active
                  ? {
                      background: "linear-gradient(135deg,#EEF6E0,#E6F0D4)",
                      border: "1.5px solid #A8E84F",
                      color: "#23221A",
                      fontWeight: 600,
                      boxShadow: "0 2px 6px rgba(110,155,44,.12)",
                    }
                  : {
                      background: "#fff",
                      border: "1px solid rgba(35,34,26,.1)",
                      color: "#5d564a",
                      fontWeight: 500,
                      boxShadow: "0 1px 3px rgba(35,34,26,.04)",
                    }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Eingeklappte Sektion: farbiger Punkt + Eyebrow + Chevron (details/summary).
function Collapsible({
  dot,
  label,
  color,
  children,
}: {
  dot: string;
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-0.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: dot }} />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
            {label}
          </span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#9a917f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true" className="flex-none transition group-open:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3.5 space-y-4">{children}</div>
    </details>
  );
}

export function NewEntry() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawIntent = params.get("intent");
  const intent = isStartIntent(rawIntent) ? rawIntent : undefined;
  const label = intentLabel(intent);
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

  // Niederschwellige, nicht-blockierende Hilfe bei sehr belastetem Zustand:
  // Krisen-Stichworte im Text ODER sehr niedrige Stimmung + sehr hohe Intensität.
  const textCrisis = detectCrisis(text);
  const crisisLevel =
    textCrisis.level !== "none"
      ? textCrisis.level
      : mood <= 2 && intensity >= 9
        ? "concern"
        : "none";

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
    void generateTitleFor(entry.id, entry.text);
    navigate(`/eintrag/${entry.id}`);
  }

  const hair = "h-px bg-[rgba(35,34,26,.1)]";

  return (
    <section className="space-y-5">
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

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-[22px]">
        {/* Linke Spalte: Schreiben */}
        <div className="space-y-4">
          {/* Schreib-Impuls */}
          <div
            className="flex items-start justify-between gap-4 rounded-[18px] border p-[16px_20px]"
            style={{
              borderColor: "rgba(205,138,91,.18)",
              background: "linear-gradient(135deg,#F8EFDF,#F4EBE0)",
            }}
          >
            <p className="text-[16px] font-[450] leading-[1.5] text-[#3a2e22] sm:text-[17px]">
              {cur.pre}
              <em className="g" style={{ color: "#9c6b3f" }}>{cur.accent}</em>
              {cur.post}
            </p>
            <button
              type="button"
              onClick={cyclePrompt}
              className="mt-0.5 inline-flex flex-none items-center gap-1.5 rounded-full border px-3 py-[5px] text-[12px] font-semibold text-[#9c6b3f] transition hover:bg-white/70"
              style={{ borderColor: "rgba(205,138,91,.2)", background: "rgba(255,255,255,.55)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v5h-5" />
              </svg>
              <span className="hidden sm:inline">Anderer Impuls</span>
              <span className="sm:hidden">Anderer</span>
            </button>
          </div>

          {/* Textarea */}
          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-[22px] pt-[22px] shadow-[var(--shadow-card)] focus-within:shadow-[0_0_0_3px_rgba(168,232,79,.22),0_6px_22px_rgba(35,34,26,.05)]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreib einfach drauflos – oder sprich es ein."
              className="block min-h-[200px] w-full resize-none border-none bg-transparent text-[16px] leading-[1.72] text-[var(--foreground)] outline-none placeholder:text-[#9a917f] sm:min-h-[300px] sm:text-[17px]"
            />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(35,34,26,.07)] py-3">
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

          <CrisisNotice level={crisisLevel} />

          {/* Speichern + Verwerfen */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={save}
              disabled={!text.trim() || saving}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15.5px] font-semibold text-[#23221A] shadow-[0_6px_18px_rgba(110,155,44,.3)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <path d="M5 12.5l4 4 10-10" />
              </svg>
              {saving ? "Speichern…" : "Eintrag speichern"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={saving}
              className="rounded-full border border-[rgba(35,34,26,.12)] px-5 py-[11px] text-[14.5px] font-medium text-[#9a917f] transition hover:text-[var(--foreground)] disabled:opacity-50"
            >
              Verwerfen
            </button>
          </div>

          {/* Datenschutz */}
          <div className="flex items-start gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#b0a896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="mt-[2px] flex-none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 8v4l3 2" />
            </svg>
            <p className="text-[12px] leading-[1.55] text-[#b0a896]">
              Der Eintrag bleibt lokal auf deinem Gerät. Nur wenn du eine
              Reflexion anforderst, wird er kurz an die KI gesendet.
            </p>
          </div>
        </div>

        {/* Rechte Spalte: Kontext-Panel (Stimmung, Gefühl, eingeklappte Felder) */}
        <div
          className="mt-4 overflow-hidden rounded-[22px] border shadow-[0_4px_18px_rgba(35,34,26,.07)] lg:mt-0"
          style={{ background: "#FAFAF7", borderColor: "rgba(35,34,26,.1)" }}
        >
          {/* Stimmung + Intensität */}
          <div className="space-y-3.5 p-5">
            <Scale label="Stimmung" hint="1 schwer · 10 leicht" value={mood} onChange={setMood} />
            <div className={hair} />
            <Scale label="Emotionale Intensität" hint="1 ruhig · 10 stark" value={intensity} onChange={setIntensity} />
          </div>
          <div className={`${hair} mx-5`} />

          {/* Gefühl — offen */}
          <div className="space-y-3.5 p-5">
            <div className="flex items-center gap-1.5">
              <span className="h-[7px] w-[7px] flex-none rounded-full bg-[#CD8A5B]" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#9c6b3f]">
                Gefühl
              </span>
            </div>
            <Chips label="Emotionen" options={EMOTIONS} selected={emotions} onChange={setEmotions} />
            <Chips label="Körpergefühl" options={BODY_SIGNALS} selected={bodySignals} onChange={setBodySignals} />
          </div>
          <div className={`${hair} mx-5`} />

          {/* Worum es geht — eingeklappt */}
          <div className="p-5">
            <Collapsible dot="#6E9B2C" color="#447510" label="Worum es geht">
              <Chips label="Themen" options={TOPICS} selected={topics} onChange={setTopics} />
              <Chips label="Bedürfnisse" options={NEEDS} selected={needs} onChange={setNeeds} />
            </Collapsible>
          </div>
          <div className={`${hair} mx-5`} />

          {/* Impuls & Absicht — eingeklappt */}
          <div className="p-5">
            <Collapsible dot="#DDB14B" color="#a08020" label="Impuls & Absicht">
              <Chips label="Impuls" options={IMPULSES} selected={impulse} onChange={setImpulse} multi={false} />
              <Chips label="Absicht" options={INTENTIONS} selected={intention} onChange={setIntention} />
            </Collapsible>
          </div>
          <div className={`${hair} mx-5`} />

          {/* Alltag heute — eingeklappt */}
          <div className="p-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#5d564a]">Alltag heute</span>
                  <span className="rounded-full bg-[#F1ECE0] px-[9px] py-0.5 text-[12px] text-[#b0a896]">optional</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#9a917f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true" className="flex-none transition group-open:rotate-180">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="mt-3.5 space-y-4">
                <Chips label="Schlaf" options={SLEEP_OPTIONS} selected={sleep} onChange={setSleep} multi={false} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <BoolField label="Bewegung" value={movementToday} onChange={setMovement} />
                  <BoolField label="Draußen" value={outsideToday} onChange={setOutside} />
                  <BoolField label="Kiffen" value={cannabisToday} onChange={setCannabis} />
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
