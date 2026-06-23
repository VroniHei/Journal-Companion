import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui";
import { Icon, ICONS, tileRelief } from "../components/icons";
import { JournalCard } from "../components/JournalCard";
import { ThemeMiniCard } from "../components/ThemeMiniCard";
import {
  useDailyRitual,
  useEnergyToday,
  useEntries,
  useRestDays,
  useSettings,
} from "../hooks/useData";
import { addRestDay, dayKey, setEnergyLevel } from "../db/queries";
import { ritualTheme } from "../lib/daypart";
import { entryKind } from "../lib/entryCard";
import {
  computeStreak,
  moodByDay,
  pauseDaysAvailable,
  recentStats,
  showcaseInsight,
  wordsOfWeek,
  type MoodDay,
} from "../lib/insights";

// Mood-Skala (APP-STYLE §3): clay → gold → sage → grün.
const MOOD_COLORS = ["#CD8A5B", "#DDB14B", "#9BA383", "#A8E84F"];

// Punkt-Farben der drei Ritual-Recap-Antworten (clay · gold · sage).
const RITUAL_DOTS = ["#CD8A5B", "#DDB14B", "#9BA383"];

// Schreib-Impulse für „Heute im Blick" (sanft, konkret, nicht coachig; offen,
// ohne Drängen — vieles darf auch klein oder leicht sein). Der Default rotiert
// täglich automatisch (siehe `dayIndex`), die Reihenfolge bleibt pro Tag stabil.
const PROMPTS: { pre: string; accent: string; post: string }[] = [
  { pre: "Was war heute ", accent: "leichter", post: ", als du erwartet hast?" },
  { pre: "Worüber hast du heute mehr ", accent: "nachgedacht", post: " als sonst?" },
  { pre: "Was möchtest du festhalten, bevor der Tag ", accent: "kippt", post: "?" },
  { pre: "Was hat dich heute kurz ", accent: "innehalten", post: " lassen?" },
  { pre: "Wofür warst du heute, ganz unspektakulär, ", accent: "dankbar", post: "?" },
  { pre: "Was hat dir heute ", accent: "gutgetan", post: ", auch wenn es klein war?" },
  { pre: "Was darf heute einfach ", accent: "so sein", post: ", wie es ist?" },
  { pre: "Welcher Moment heute war ", accent: "ruhiger", post: " als der Rest?" },
  { pre: "Was hast du heute ", accent: "gebraucht", post: ", und bekommen oder nicht?" },
  { pre: "Was möchtest du heute ", accent: "loslassen", post: ", bevor du zur Ruhe kommst?" },
  { pre: "Wer oder was hat dir heute ", accent: "Halt", post: " gegeben?" },
  { pre: "Was hat dich heute ", accent: "überrascht", post: "?" },
  { pre: "Worauf hast du dich heute ", accent: "gefreut", post: "? Und wie war es dann?" },
  { pre: "Wo hast du heute ", accent: "Nein", post: " gesagt, oder gern gesagt?" },
  { pre: "Was war heute ", accent: "genug", post: ", auch wenn es sich nicht so anfühlte?" },
  { pre: "Welches Gefühl begleitet dich gerade ", accent: "am stärksten", post: "?" },
  { pre: "Was hat dein Körper dir heute ", accent: "gesagt", post: "?" },
  { pre: "Was würdest du deinem Morgen-Ich von heute jetzt ", accent: "sagen", post: "?" },
];

// Tage seit Epoche (lokale Mitternacht) — stabiler Tages-Index, mit dem der
// Schreib-Impuls jeden Tag automatisch um eins weiterrückt.
function dayIndex(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(midnight.getTime() / 86_400_000);
}

type TimeOfDay = "morgen" | "tag" | "abend";

function timeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 11) return "morgen";
  if (h < 18) return "tag";
  return "abend";
}

// Warme, persönliche Begrüßung — variiert leicht je Tag (deterministisch), in
// „Vroni-Voice": nah, freundlich, nie aufdringlich.
const GREETINGS: Record<TimeOfDay, string[]> = {
  morgen: ["Guten Morgen", "Hej", "Schön, dass du wach bist"],
  tag: ["Hej", "Schön, dass du da bist", "Hallo"],
  abend: ["Guten Abend", "Hej", "Schön, dass du da bist"],
};
function greetingWord(t: TimeOfDay, seed = 0): string {
  const pool = GREETINGS[t];
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

// Einladende, sanfte Frage als zweite Zeile (rotiert täglich). Bewusst ohne
// Druck — „möchtest du …", „wenn dir danach ist": Opt-out ist immer mitgedacht
// (therapist-safety: einladend, kein Muss, keine Bewertung/Diagnose).
const WELCOME_LINES: { pre: string; accent: string; post: string }[] = [
  { pre: "Wie geht es dir ", accent: "gerade", post: "?" },
  { pre: "Sollen wir gemeinsam auf deine ", accent: "Gedanken", post: " schauen?" },
  { pre: "Möchtest du dir etwas von der ", accent: "Seele", post: " schreiben?" },
  { pre: "Magst du deine Gedanken ein Stück weit ", accent: "sortieren", post: "?" },
  { pre: "Was möchtest du heute ", accent: "festhalten", post: "?" },
  { pre: "Wenn dir danach ist, schreib einfach ", accent: "los", post: "." },
  { pre: "Nimm dir einen Moment, ganz ", accent: "für dich", post: "." },
  { pre: "Was beschäftigt dich ", accent: "heute", post: "?" },
];


const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 150, 200, 365];
function nextMilestone(streak: number): number {
  return MILESTONES.find((m) => m > streak) ?? Math.ceil((streak + 1) / 100) * 100;
}
function milestoneLabel(m: number): string {
  if (m === 365) return "1-Jahres-Marke";
  if (m % 7 === 0 && m <= 28) return `${m / 7}-Wochen-Marke`;
  return `${m}-Tage-Marke`;
}

const FILTERS: { id: string; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "eintrag", label: "Eintrag" },
  { id: "reflexion", label: "Reflexion" },
  { id: "gespraech", label: "Gespräch" },
];

// Energie-Meter (Dashboard-Widget): 5 ansteigende Balken, Farbe je Stufe.
const ENERGY_HEIGHTS = [36, 52, 68, 84, 100];
const ENERGY_FILL = ["#E6D7C4", "#D8C291", "#B6CE72", "#9BD24E", "#A8E84F"];
const ENERGY_WORD = ["", "sehr wenig", "wenig", "mittlere", "gute", "volle"];

// Stimmungs-Verlauf als ruhige Flächen-Linie (aus den Tageswerten der letzten Woche).
function MoodSparkline({ days }: { days: MoodDay[] }) {
  const x0 = 16;
  const x1 = 484;
  const yTop = 18;
  const yBot = 80;
  const base = 90;
  const n = days.length;
  const xOf = (i: number) => (n <= 1 ? x0 : x0 + (i / (n - 1)) * (x1 - x0));
  const yOf = (v: number) => yBot - ((v - 1) / 9) * (yBot - yTop);
  const pts = days
    .map((d, i) => (d.value == null ? null : { x: xOf(i), y: yOf(d.value) }))
    .filter((p): p is { x: number; y: number } => p !== null);

  if (pts.length < 2) {
    return (
      <p className="mt-6 text-sm text-[var(--muted)]">
        Noch zu wenig Verlauf. Ab zwei Tagen mit Eintrag zeichne ich hier die
        Linie.
      </p>
    );
  }

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last.x},${base} L${pts[0].x},${base} Z`;

  return (
    <div className="mt-6">
      <svg viewBox="0 0 500 96" className="block w-full overflow-visible">
        <defs>
          <linearGradient id="moodfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#moodfill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--green-deep)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="5"
          fill="var(--surface)"
          stroke="var(--green-deep)"
          strokeWidth="2.6"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[13px] text-[var(--muted)]">
        {days.map((d, i) => (
          <span key={i}>{d.day}</span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const settings = useSettings();
  const ritual = useDailyRitual(dayKey());
  const today = dayKey();
  const energy = useEnergyToday(today);
  const energyLevel = energy?.level ?? 0;
  const restDays = useRestDays();
  const [filter, setFilter] = useState("alle");
  // Start-Impuls rotiert täglich automatisch; „Anderer Impuls" zählt von hier
  // aus weiter (PROMPTS[promptIdx % length]).
  const [promptIdx, setPromptIdx] = useState(() => dayIndex());
  const [moodViz, setMoodViz] = useState<"punkte" | "verlauf">("punkte");
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false);

  const name = settings.userName?.trim();
  const tod = timeOfDay();
  const greet = greetingWord(tod, dayIndex());
  const welcome = WELCOME_LINES[dayIndex() % WELCOME_LINES.length];
  const hasData = entries.length > 0;

  // Serie inkl. eingelöster Pausentage (schützen die Serie über Lücken).
  const restDayDates = restDays.map((r) => r.date);
  const streak = computeStreak(entries, restDayDates);
  const streakNext = nextMilestone(streak);
  const streakLeft = streakNext - streak;
  const streakPct = Math.min(100, Math.round((streak / streakNext) * 100));
  const streakMilestoneLabel = milestoneLabel(streakNext);
  // Pausentag-Logik: verfügbare Pausentage + „Serie in Gefahr"-Zustand.
  const pauseAvailable = pauseDaysAvailable(streak, restDays.length);
  const isSameLocalDay = (iso: string) =>
    new Date(iso).toDateString() === new Date().toDateString();
  const ritualDoneToday =
    (ritual?.gratitude?.length ?? 0) > 0 ||
    (ritual?.goodMoments?.length ?? 0) > 0;
  const activityToday =
    entries.some((e) => isSameLocalDay(e.createdAt)) ||
    ritualDoneToday ||
    restDayDates.includes(today);
  const streakInDanger =
    new Date().getHours() >= 18 &&
    streak > 0 &&
    pauseAvailable > 0 &&
    !activityToday;

  function takeRestDay() {
    void addRestDay(today);
    setPauseSheetOpen(false);
  }
  const week = recentStats(entries, 7);
  const moodDays = moodByDay(entries, 7);
  // „Was sich zeigt": datengetriebene Einsicht mit .g-Akzent, täglich rotierend.
  const showcase = showcaseInsight(entries, dayIndex());
  // Worte der Woche für die „Was sich zeigt"-Karte (Claude Design).
  const topWords = wordsOfWeek(entries, 4).map((w) => w.word);
  const ritualMorning = tod !== "abend";
  const ritualFilled = ritualMorning
    ? (ritual?.gratitude?.length ?? 0) > 0
    : (ritual?.goodMoments?.length ?? 0) > 0;
  const ritualT = ritualTheme(!ritualMorning);
  const prompt = PROMPTS[promptIdx % PROMPTS.length];

  // Fokus-Chip (Claude Design Juni 2026): kein eigener Onboarding-Wert mehr,
  // sondern Output des Tagesrituals (Schritt „Was macht den Tag gut?" = Fokus).
  // Zwei Zustände: gesetzt → Chip mit Fokus-Text; offen → leiser Hinweis.
  const todayFocus = ritual?.makeGreat?.trim();
  // Schlüsselwort für die Mini-Karten-Vorschau („Was sich zeigt").
  const keyword = topWords[0] ?? "Heute";
  const keywordCap = keyword.charAt(0).toUpperCase() + keyword.slice(1);

  // Gesicherte Antworten für den Erledigt-Zustand der Tagesritual-Karte.
  const ritualAnswers: { label: string; value: string }[] = ritual
    ? (ritualMorning
        ? [
            { label: "Dankbar für", value: (ritual.gratitude ?? []).join(", ") },
            { label: "Macht den Tag gut", value: ritual.makeGreat ?? "" },
            { label: "Ein guter Satz", value: ritual.affirmation ?? "" },
          ]
        : [
            { label: "Gutes getan", value: ritual.goodDeed ?? "" },
            { label: "Wäre besser", value: ritual.better ?? "" },
            { label: "Schöne Momente", value: (ritual.goodMoments ?? []).join(", ") },
          ]
      ).filter((a) => a.value.trim().length > 0)
    : [];


  function matchesFilter(e: (typeof entries)[number]): boolean {
    if (filter === "alle") return true;
    return entryKind(e) === filter;
  }
  const shown = entries.filter(matchesFilter).slice(0, 3);

  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    // flex-col + order: mobil kompakte Reihenfolge (Begrüßung → Ritual → Heute
    // im Blick → Energie → Stimmung); ab sm volles Bento in Prototyp-Reihenfolge.
    <section className="flex flex-col gap-5">
      {/* Mobile: warme, persönliche Begrüßung auf Creme (Tageszeit-Icon +
          einladende Frage; freundlicher Einstieg). */}
      <div className="order-1 sm:hidden">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl shadow-[0_4px_12px_rgba(110,155,44,0.16)]"
            style={{ background: "linear-gradient(145deg,#EEF5E0,#DFEDC6)", color: "#6E9B2C" }}
            aria-hidden="true"
          >
            {/* Lucide „smile" — freundlicher, warmer Einstieg; kollidiert nicht
                mit den Tageszeit-Icons (Sonne/Mond) des Rituals darunter. */}
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a917f]">
              {dateLabel}
            </div>
            <h1 className="serif text-[22px] font-semibold leading-tight">
              {greet}
              {name ? `, ${name}` : ""}
            </h1>
          </div>
        </div>
        {/* Fokus-Chip im oberen Bereich, direkt unter der Begrüßung. */}
        {todayFocus ? (
          <Link
            to="/ritual"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1.5 text-[13px] font-medium text-[#5d4f3f] transition hover:opacity-80"
            style={{ background: "#EFE4CF", borderColor: "rgba(120,86,52,0.2)" }}
          >
            <span className="h-[7px] w-[7px] flex-none rounded-full bg-[var(--clay)]" />
            <span className="truncate">Dein Fokus: {todayFocus}</span>
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="#9a917f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="ml-0.5 flex-none"
            >
              <path d="M14 5l5 5M4 20l1-4L15.5 4.5l3.5 3.5L7.5 19.5 4 20z" />
            </svg>
          </Link>
        ) : (
          <Link
            to="/ritual"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[13px] font-medium text-[#b0a896] transition hover:opacity-80"
            style={{ borderColor: "rgba(35,34,26,.16)" }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "#E0D8CE" }} />
            Fokus heute noch offen · im Ritual setzen
          </Link>
        )}

        <p className="lead mt-3 text-[15.5px] leading-snug text-[var(--foreground)]">
          {welcome.pre}
          <em className="g text-[var(--accent-text)]">{welcome.accent}</em>
          {welcome.post}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
          <button
            type="button"
            onClick={() => navigate("/neu")}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
              boxShadow: "0 5px 14px rgba(110,155,44,.28)",
            }}
          >
            Eintrag schreiben
          </button>
          <button
            type="button"
            onClick={() => navigate("/sprechen")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          >
            Sprach-Check-in
          </button>
        </div>
      </div>

      {/* Desktop: Foto-Hero mit Overlay (nach Prototyp) */}
      <div className="relative hidden overflow-hidden rounded-[28px] shadow-[0_22px_48px_rgba(35,34,26,0.13)] sm:order-1 sm:block">
        <img
          src="/img/hero-see.webp"
          alt=""
          aria-hidden="true"
          className="hero-zoom absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 82%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(28,33,22,.9) 0%, rgba(28,33,22,.62) 52%, rgba(28,33,22,.22) 100%)",
          }}
        />
        <div className="relative max-w-[600px] p-10 lg:p-[46px]">
          <div className="mb-3.5 inline-flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full bg-[var(--accent)]"
              style={{ boxShadow: "0 0 12px rgba(168,232,79,.8)" }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {dateLabel}
            </span>
          </div>
          <h1 className="serif mb-3 text-[39px] font-semibold leading-[1.08] text-[#F8F5EE]">
            {greet}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="lead mb-6 max-w-[470px] text-[22px] leading-snug text-[#F8F5EE]">
            {welcome.pre}
            <em className="g text-[var(--accent)]">{welcome.accent}</em>
            {welcome.post}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/neu")}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
                boxShadow: "0 5px 14px rgba(110,155,44,.28)",
              }}
            >
              Eintrag schreiben
            </button>
            <button
              type="button"
              onClick={() => navigate("/sprechen")}
              className="rounded-full border border-white/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[var(--foreground)]"
            >
              Sprach-Check-in
            </button>
          </div>
          {/* Fokus-Chip (Hero, Claude-Design-Optimierung): nur der Fokus-Text,
              auf Hero-Breite per Ellipsis gekürzt — ohne „Dein Fokus:"-Präfix
              und ohne Stift (kompakter auf dem dunklen Foto). */}
          {todayFocus ? (
            <Link
              to="/ritual"
              aria-label={`Dein Fokus: ${todayFocus}`}
              className="mt-5 inline-flex max-w-[400px] items-center gap-[9px] overflow-hidden rounded-full border py-2 pl-3.5 pr-[18px] text-[13.5px] font-medium transition hover:opacity-90"
              style={{
                color: "rgba(255,248,236,.78)",
                background: "rgba(255,248,236,.1)",
                borderColor: "rgba(255,248,236,.2)",
              }}
            >
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: "#CD8A5B" }} />
              <span className="truncate">{todayFocus}</span>
            </Link>
          ) : (
            <Link
              to="/ritual"
              className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed px-[15px] py-[7px] text-[13px] font-medium transition hover:opacity-90"
              style={{ color: "rgba(255,248,236,.35)", borderColor: "rgba(255,248,236,.2)" }}
            >
              Fokus noch offen · im Ritual setzen
            </Link>
          )}
        </div>
      </div>

      {/* GERADE IST VIEL? · Kopf leeren — feste Lilac-Karte (Mobile + Desktop,
          nach Claude Design) */}
      <Link
        to="/soforthilfe"
        className="lift order-2 flex items-center justify-between gap-4 rounded-[24px] border p-[18px] shadow-[0_6px_22px_rgba(90,70,130,.06)] sm:order-7 sm:px-7 sm:py-[22px]"
        style={{
          background: "linear-gradient(135deg,#F3EEF8,#fff)",
          borderColor: "rgba(157,139,201,.26)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          <span
            className="inline-flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px] text-[#7a6b96]"
            style={tileRelief("#EDE6F6")}
            aria-hidden="true"
          >
            <Icon d={ICONS.pulse} size={23} />
          </span>
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#9d8bc9]" />
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#7a6b96]">
                Gerade ist viel?
              </span>
            </div>
            {/* Mobile: kurz, einzeilig; Desktop: Headline nach Prototyp. */}
            <p className="truncate text-[15px] font-[450] leading-snug text-[#3a3247] sm:overflow-visible sm:whitespace-normal sm:text-[20px] sm:leading-[1.4] sm:tracking-[-0.01em]">
              <span className="sm:hidden">
                <em className="g">Kopf leeren</em> und sortieren.
              </span>
              <span className="hidden sm:inline">
                Kopf leeren und in <em className="g">zwei Minuten</em> sortieren.
              </span>
            </p>
          </div>
        </div>
        {/* Desktop: Button; Mobile: Chevron. */}
        <span
          className="hidden flex-none items-center gap-2 rounded-full border bg-white px-5 py-3 text-[14.5px] font-semibold text-[#3a3247] shadow-[0_4px_14px_rgba(90,70,130,.1)] sm:inline-flex"
          style={{ borderColor: "rgba(157,139,201,.4)" }}
        >
          Kopf leeren
          <Icon d={ICONS.arrowRight} size={15} />
        </span>
        <span aria-hidden="true" className="flex-none text-[#7a6b96] sm:hidden">
          →
        </span>
      </Link>

      {/* HEUTE IM BLICK · Schreib-Impuls */}
      <Card className="order-3 bg-[radial-gradient(420px_240px_at_0%_0%,rgba(168,232,79,0.10),transparent_60%)] sm:order-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Heute im Blick
              </span>
            </div>
            <p className="lead max-w-[520px] text-[16.5px] leading-snug sm:text-xl">
              {prompt.pre}
              <em className="g text-[var(--accent-text)]">{prompt.accent}</em>
              {prompt.post}
            </p>
          </div>
          {/* Aktionen: Impuls wechseln oder direkt damit schreiben. Mobil immer
              in EINER Zeile (kein Umbruch): „Dazu schreiben" füllt den Rest. */}
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => setPromptIdx((i) => i + 1)}
              className="inline-flex flex-none items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--surface-2)] sm:px-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v5h-5" />
              </svg>
              Anderer Impuls
            </button>
            <button
              type="button"
              onClick={() => navigate("/neu")}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:-translate-y-0.5 hover:bg-[#bdf06a] sm:flex-none"
            >
              Dazu schreiben
            </button>
          </div>
        </div>
      </Card>

      {/* TAGESRITUAL · prominentes, warmes Tages-Tool (nach Prototyp) */}
      <div
        className="order-2 relative overflow-hidden sm:order-3"
        style={{
          borderRadius: 28,
          border: `1px solid ${ritualT.border}`,
          boxShadow: "0 20px 46px rgba(120,86,52,0.16)",
          background: ritualT.surface,
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            top: -60,
            left: -30,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: ritualT.orbWarm,
            filter: "blur(34px)",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: -40,
            bottom: -70,
            width: 230,
            height: 230,
            borderRadius: "50%",
            background: ritualT.orbCool,
            filter: "blur(38px)",
          }}
        />
        <div className="relative flex items-stretch">
          <div className="min-w-0 flex-1 p-7 sm:p-8">
            {/* Badge — mobil: Eyebrow oben, Meta kleiner darunter (kein Umbruch
                in der Pille); ab sm: alles in einer Pille. */}
            <div className="mb-4 flex items-center gap-3">
            {/* Mobile-Thumbnail (Prototyp: 46px Notizbuch-Foto) */}
            <div className="group h-[46px] w-[46px] flex-none overflow-hidden rounded-[14px] sm:hidden">
              <img
                src="/img/journaling-desk.webp"
                alt=""
                aria-hidden="true"
                className="img-zoom h-full w-full object-cover"
              />
            </div>
            <div
              className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3"
              style={{
                background: "rgba(255,255,255,0.7)",
                borderColor: "rgba(205,138,91,0.3)",
              }}
            >
              <span
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white"
                style={{ background: ritualT.badge }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ritualMorning ? (
                    <>
                      <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
                      <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
                    </>
                  ) : (
                    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
                  )}
                </svg>
              </span>
              <span
                className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: ritualT.eyebrow }}
              >
                {/* Mobil kürzer, damit der Kopf einzeilig bleibt. */}
                <span className="sm:hidden">Tagesritual</span>
                <span className="hidden sm:inline">Tägliches Ritual</span>
              </span>
              <span
                className="whitespace-nowrap border-l pl-2 text-[11px] font-semibold"
                style={{ color: "#b08a64", borderColor: "rgba(205,138,91,0.3)" }}
              >
                {/* Mobil kurz „6 Min", Desktop mit Zusatz — einzeilig. */}
                <span className="sm:hidden">6 Min</span>
                <span className="hidden sm:inline">6 Min · Dein Begleiter</span>
              </span>
            </div>
            </div>

            {ritualFilled ? (
              /* ===== Erledigt-Zustand (Recap nach Claude-Design) ===== */
              <>
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--green-text,#447510)]">
                  <span
                    className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg,#B4ED63,#A8E84F)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#23221A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                      <path d="M5 12l5 5L20 6" />
                    </svg>
                  </span>
                  Heute erledigt
                  <span style={{ color: "#b08a64", fontWeight: 500 }}>
                    {" "}
                    · automatisch gesichert
                  </span>
                </div>

                <h2
                  className="serif mb-3 text-[24px] font-semibold leading-tight sm:text-[26px]"
                  style={{ color: ritualT.title }}
                >
                  Den Tag{" "}
                  <em className="g">{ritualMorning ? "sortieren" : "abschließen"}</em>.
                </h2>

                {/* Recap: eine Karte mit den 3 Antworten + farbigen Punkten */}
                {ritualAnswers.length > 0 ? (
                  <div
                    className="mb-5 flex max-w-[480px] flex-col divide-y divide-[rgba(205,138,91,0.16)] rounded-[14px] border px-[15px] py-1"
                    style={{
                      background: "rgba(255,255,255,0.72)",
                      borderColor: "rgba(205,138,91,0.2)",
                    }}
                  >
                    {ritualAnswers.map((a, i) => (
                      <div key={a.label} className="flex items-start gap-2.5 py-3">
                        <span
                          className="mt-1 h-[9px] w-[9px] flex-none rounded-full"
                          style={{ background: RITUAL_DOTS[i] ?? "#9BA383" }}
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9c6b3f]">
                            {a.label}
                          </div>
                          <div
                            className="mt-0.5 text-[13.5px] leading-[1.4] text-[#4a4034]"
                            style={
                              ritualMorning && i === 2
                                ? { fontFamily: "var(--font-serif)", fontStyle: "italic" }
                                : undefined
                            }
                          >
                            {a.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-5 text-[14.5px] text-[#6a5a48]">
                    Heute schon festgehalten. Schön.
                  </p>
                )}

                {/* Serie-Zeile (award) */}
                <div className="mb-5 flex items-center gap-2 text-[13px] font-medium text-[#6a5a48]">
                  <span className="flex-none" style={{ color: "#DDB14B" }}>
                    <Icon d={ICONS.award} size={16} />
                  </span>
                  <span>
                    <strong className="font-[650] text-[var(--foreground)]">
                      {streak} {streak === 1 ? "Tag" : "Tage"}
                    </strong>{" "}
                    in Folge{pauseAvailable > 0 ? " · 1 Pausentag in Reserve" : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/ritual")}
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{
                    color: "#23221A",
                    background: "rgba(255,255,255,0.7)",
                    borderColor: "rgba(35,34,26,0.12)",
                  }}
                >
                  Eintrag ansehen →
                </button>
              </>
            ) : (
              /* ===== Offen-Zustand ===== */
              <>
                <div
                  className="mb-3 flex items-center gap-2 text-[13px] font-semibold"
                  style={{ color: ritualT.eyebrow }}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: ritualMorning ? "#CD8A5B" : "#CBBEF4" }}
                  />
                  Heute noch offen
                  <span style={{ color: "#b08a64", fontWeight: 500 }}>
                    {" "}
                    · kein Muss
                  </span>
                </div>

                <h2
                  className="serif mb-2 text-[24px] font-semibold leading-tight sm:text-[26px]"
                  style={{ color: ritualT.title }}
                >
                  {/* Mobile: kurze Headline; Desktop: volle Headline (Prototyp). */}
                  <span className="sm:hidden">
                    Den Tag{" "}
                    <em className="g">{ritualMorning ? "sortieren" : "abschließen"}</em>.
                  </span>
                  <span className="hidden sm:inline">
                    Sechs Minuten, die den Tag{" "}
                    <em className="g">{ritualMorning ? "sortieren" : "abschließen"}</em>.
                  </span>
                </h2>
                <p
                  className="mb-5 max-w-[480px] text-[15px] leading-relaxed"
                  style={{ color: "#6a5a48" }}
                >
                  {ritualMorning
                    ? "Drei kleine Fragen, bevor es losgeht."
                    : "Drei kleine Fragen zum Abend."}{" "}
                  {/* Mobile: Themen im Fließtext (statt Chips). */}
                  <span className="sm:hidden">
                    {ritualMorning
                      ? "Dankbarkeit, ein Fokus, ein guter Satz an dich."
                      : "Was Gutes war, was besser ginge, schöne Momente."}
                  </span>
                  <span className="hidden sm:inline">
                    Kein Pflichtprogramm. Nur ein ruhiger{" "}
                    {ritualMorning ? "Anfang" : "Ausklang"}.
                  </span>
                </p>

                {/* Themen-Chips — nur Desktop/Tablet */}
                <div className="mb-6 hidden flex-wrap gap-2 sm:flex">
                  {(ritualMorning
                    ? [
                        { label: "Wofür dankbar?", dot: "#CD8A5B" },
                        { label: "Was macht den Tag gut?", dot: "#DDB14B" },
                        { label: "Ein guter Satz an dich", dot: "#9BA383" },
                      ]
                    : [
                        { label: "Was Gutes getan?", dot: "#CD8A5B" },
                        { label: "Was wäre besser?", dot: "#DDB14B" },
                        { label: "Schöne Momente", dot: "#9BA383" },
                      ]
                  ).map((c) => (
                    <span
                      key={c.label}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium"
                      style={{
                        background: "rgba(255,255,255,0.66)",
                        borderColor: "rgba(35,34,26,0.07)",
                        color: "#5d4f3f",
                      }}
                    >
                      <span
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ background: c.dot }}
                      />
                      {c.label}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/ritual")}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{
                    color: "#23221A",
                    background: "linear-gradient(180deg,#B4ED63,#A8E84F)",
                    boxShadow: "0 6px 18px rgba(110,155,44,0.32)",
                  }}
                >
                  Ritual starten →
                </button>

                {/* Serie in Gefahr (abends, kein Eintrag, Pausentag verfügbar):
                    Streak-Warnung mit „Pause nehmen". */}
                {streakInDanger && (
                  <div
                    className="mt-4 flex items-center justify-between gap-2.5 rounded-[14px] border px-3.5 py-[11px]"
                    style={{
                      background: "rgba(221,177,75,.1)",
                      borderColor: "rgba(221,177,75,.28)",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex-none" style={{ color: "#DDB14B" }}>
                        <Icon d={ICONS.pause} size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-[650] leading-tight" style={{ color: "#8a6b00" }}>
                          {streak} Tage · endet heute Nacht
                        </div>
                        <div className="mt-px text-[11px]" style={{ color: "#a08020" }}>
                          1 Pausentag verfügbar
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPauseSheetOpen(true)}
                      className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-[7px] text-[13px] font-[650]"
                      style={{
                        color: "#8a6b00",
                        background: "rgba(221,177,75,.15)",
                        borderColor: "rgba(221,177,75,.3)",
                      }}
                    >
                      Pause nehmen
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bild (ab Tablet) */}
          <div className="relative hidden w-[38%] max-w-[420px] shrink-0 sm:block">
            <div
              className="group absolute overflow-hidden"
              style={{
                top: 22,
                right: 22,
                bottom: 22,
                left: 0,
                borderRadius: 20,
                boxShadow: "0 12px 30px rgba(120,86,52,0.2)",
                border: "1px solid rgba(255,255,255,0.5)",
                outline: "1px solid rgba(205,138,91,0.16)",
                outlineOffset: -1,
              }}
            >
              <img
                src="/img/journaling-desk.webp"
                alt=""
                aria-hidden="true"
                className="img-zoom h-full w-full object-cover"
                style={{ objectPosition: "center 46%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {hasData && (
        <>
          {/* AUSWERTUNG · Bento (Claude Design: 1.3fr/1fr/1fr). Mobil nur
              Stimmung; Serie/Woche ab sm. Eyebrows mit Icon, Zahlen einheitlich
              46px und auf einer Linie. */}
          <div className="order-5 grid grid-cols-1 gap-4 sm:order-4 sm:grid-cols-[1.3fr_1fr_1fr] sm:gap-[18px]">
            <Card>
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--green-deep,#6E9B2C)]">
                  <Icon d={ICONS.wave} size={16} />
                  <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Stimmung · 7 Tage
                  </span>
                </div>
                {/* Umschalter: Punkte / Verlauf */}
                <div className="inline-flex shrink-0 rounded-full bg-[var(--surface-2)] p-[3px]">
                  {(["punkte", "verlauf"] as const).map((v) => {
                    const active = moodViz === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMoodViz(v)}
                        aria-pressed={active}
                        className={`rounded-full px-[13px] py-1.5 text-[13px] transition ${
                          active
                            ? "bg-[var(--surface)] font-semibold text-[var(--foreground)] shadow-[0_2px_6px_rgba(35,34,26,.08)]"
                            : "font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {v === "punkte" ? "Punkte" : "Verlauf"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {moodViz === "verlauf" ? (
                <MoodSparkline days={moodDays} />
              ) : (
                <div className="mt-2 flex items-end justify-between">
                  {moodDays.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2.5">
                      <span
                        className="h-5 w-5 rounded-full"
                        style={{
                          background:
                            d.level === null
                              ? "var(--surface-2)"
                              : MOOD_COLORS[d.level],
                        }}
                        title={d.level === null ? "kein Eintrag" : undefined}
                      />
                      <span className="text-[13px] text-[var(--muted)]">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Legende: Schwer → Leicht */}
              <div className="mt-5 flex items-center gap-2.5 border-t border-[var(--border)] pt-4">
                <span className="text-[13px] text-[var(--muted)]">Schwer</span>
                <div className="flex gap-1.5">
                  {MOOD_COLORS.map((c) => (
                    <span
                      key={c}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-[13px] text-[var(--muted)]">Leicht</span>
              </div>
            </Card>

            {/* In Folge */}
            <Card className="hidden sm:block">
              <div className="mb-3.5 flex items-center gap-2 text-[var(--clay,#CD8A5B)]">
                <Icon d={ICONS.flame} size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  In Folge
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-[46px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-[var(--green-deep,#6E9B2C)]">
                  {streak}
                </div>
                <div className="text-[13.5px] text-[var(--muted)]">
                  {streak === 1 ? "Tag am Stück" : "Tage am Stück"}
                </div>
              </div>
              <div className="mt-[18px]">
                <div className="h-[7px] overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${streakPct}%`,
                      background: "linear-gradient(90deg,#CD8A5B,#A8E84F)",
                    }}
                  />
                </div>
                <div className="mt-[9px] text-[13px] text-[#9a917f]">
                  Noch {streakLeft} {streakLeft === 1 ? "Tag" : "Tage"} bis zur{" "}
                  {streakMilestoneLabel}
                </div>
                {pauseAvailable > 0 && (
                  <div
                    className="mt-[11px] inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold"
                    style={{ color: "#6E9B2C", background: "#F2F6E8" }}
                  >
                    <Icon d={ICONS.pause} size={12} />
                    1 Pausentag in Reserve
                  </div>
                )}
              </div>
            </Card>

            {/* Diese Woche */}
            <Card className="hidden sm:block">
              <div className="mb-3.5 flex items-center gap-2 text-[#6E7449]">
                <Icon d={ICONS.calendarCheck} size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Diese Woche
                </span>
              </div>
              <div className="text-[46px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
                {week.count}
                <span className="ml-1.5 text-[20px] font-semibold text-[#9a917f]">
                  / 7
                </span>
              </div>
              <div className="mt-1 text-[13.5px] text-[var(--muted)]">
                mit Eintrag
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ENERGIE HEUTE · kompakter Tagesimpuls (immer sichtbar, auch ohne Einträge) */}
          <div className="order-4 lift flex flex-col gap-5 rounded-[24px] border border-[var(--border)] bg-[radial-gradient(360px_180px_at_100%_0%,rgba(168,232,79,0.12),transparent_64%)] bg-[var(--surface)] p-[22px_28px] shadow-[var(--shadow-card)] sm:order-5 sm:flex-row sm:items-center sm:justify-between sm:gap-7">
            <div className="min-w-0">
              {/* Mobil: kompakter Kopf (Label + Wert rechts); ab sm großer Satz. */}
              <div className="mb-[9px] flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Energie heute
                  </span>
                </span>
                <span className="text-[13px] font-[650] text-[var(--accent-text)] sm:hidden">
                  {energyLevel > 0 ? ENERGY_WORD[energyLevel] : "noch offen"}
                </span>
              </div>
              {energyLevel > 0 ? (
                <p className="mb-1 hidden text-[20px] font-[450] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)] sm:block">
                  Heute: <em className="g">{ENERGY_WORD[energyLevel]} Energie</em>. Plan
                  ruhig danach.
                </p>
              ) : (
                <p className="mb-1 hidden text-[20px] font-[450] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)] sm:block">
                  Wie viel Energie hast du <em className="g">heute</em>?
                </p>
              )}
              <p className="text-[13px] leading-[1.45] text-[#9a917f]">
                Tipp an, wie viel du heute hast. Deine Impulse passen sich daran an.
              </p>
            </div>
            <div className="flex h-[46px] w-full flex-none items-end gap-2 sm:w-[188px]">
              {ENERGY_HEIGHTS.map((h, i) => {
                const lvl = i + 1;
                const filled = lvl <= energyLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    aria-label={`Energie ${lvl} von 5`}
                    aria-pressed={energyLevel === lvl}
                    onClick={() => setEnergyLevel(today, lvl)}
                    className="flex h-full flex-1 items-end p-0"
                  >
                    <span
                      className="block w-full rounded-[7px] transition-[background]"
                      style={{
                        height: `${h}%`,
                        background: filled ? ENERGY_FILL[i] : "#EFEADD",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

      {hasData && (
        /* WAS SICH ZEIGT (Claude Design Juni 2026): Mobile gestapelt (Text →
           Tags → Mini-Karte + Links); Desktop als 3-Spalten-Raster (Einsicht ·
           Fokus-Themen · Mini-Karte + Teilen), Spalten durch Trennlinien. */
        <Card className="order-6 bg-[radial-gradient(440px_240px_at_92%_0%,rgba(205,138,91,0.07),transparent_62%)]">
          <div className="mb-3 inline-flex items-center gap-2.5 sm:mb-5">
            <span className="h-2 w-2 rounded-full bg-[var(--clay)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[11.5px]">
              Was sich zeigt
            </span>
          </div>

          {showcase ? (
            <>
              {/* Mobile */}
              <div className="sm:hidden">
                <p
                  className="mb-3 text-[16px] font-[450] leading-[1.5] text-[var(--foreground)]"
                  dangerouslySetInnerHTML={{ __html: showcase }}
                />
                {topWords.length > 0 && (
                  <div className="mb-3.5 flex flex-wrap gap-1.5">
                    {/* Mobil bewusst nur die 3 wichtigsten (häufigsten) Tags in
                        einer Zeile — kein abgeschnittener Chip. */}
                    {topWords.slice(0, 3).map((w) => (
                      <span
                        key={w}
                        className="whitespace-nowrap rounded-full bg-[#F1ECE0] px-3 py-1.5 text-[13px] font-medium text-[#5d4f3f]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-[13px] border-t border-[var(--border)] pt-[13px]">
                  <ThemeMiniCard
                    keyword={keywordCap}
                    wordSize={20}
                    className="h-[76px] w-[110px] flex-none"
                  />
                  <div className="flex flex-1 flex-col gap-2.5">
                    <Link
                      to="/roter-faden"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--green-text,#447510)]"
                    >
                      Roter Faden ansehen
                      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                        <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
                      </svg>
                    </Link>
                    <Link
                      to="/teilen"
                      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[7px] text-[13px] font-semibold text-[var(--muted)]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                        <path d="M12 14V4M8.5 7.5 12 4l3.5 3.5" />
                        <path d="M5 12.5V18.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12.5" />
                      </svg>
                      Als Karte teilen
                    </Link>
                  </div>
                </div>
              </div>

              {/* Desktop: 3 Spalten */}
              <div className="hidden grid-cols-[1.3fr_1fr_1fr] items-stretch sm:grid">
                <div className="flex items-center border-r border-[var(--border)] pr-7">
                  <p
                    className="text-[19px] font-[450] leading-[1.55] tracking-[-0.01em] text-[var(--foreground)]"
                    dangerouslySetInnerHTML={{ __html: showcase }}
                  />
                </div>
                <div className="flex flex-col justify-center gap-2.5 border-r border-[var(--border)] px-[26px]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a917f]">
                    Fokus-Themen
                  </span>
                  <div className="flex gap-1.5 overflow-hidden">
                    {topWords.map((w) => (
                      <span
                        key={w}
                        className="whitespace-nowrap rounded-full bg-[#F1ECE0] px-3.5 py-[7px] text-[13px] font-medium text-[#5d4f3f]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 pl-[26px]">
                  <ThemeMiniCard keyword={keywordCap} wordSize={30} fill />
                  <Link
                    to="/teilen"
                    className="flex w-full flex-none items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--foreground)]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                      <path d="M12 14V4M8.5 7.5 12 4l3.5 3.5" />
                      <path d="M5 12.5V18.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12.5" />
                    </svg>
                    Als Karte teilen
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[15px] text-[var(--muted)]">
              Sobald sich etwas wiederholt, spiegele ich es dir hier. Ganz
              vorsichtig.
            </p>
          )}
        </Card>
      )}

      {/* LETZTE EINTRÄGE — Mobile UND Desktop */}
      <div className="order-8 flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Letzte Einträge
        </span>
        {hasData && (
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="rounded-full px-[14px] py-[7px] text-[13px] transition"
                  style={{
                    background: active ? "var(--sand)" : "transparent",
                    color: active ? "var(--foreground)" : "var(--muted)",
                    fontWeight: active ? 600 : 500,
                    border: active ? "1px solid transparent" : "1px solid rgba(35,34,26,.1)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="mx-auto flex max-w-[560px] flex-col gap-3 lg:grid lg:max-w-[940px] lg:grid-cols-2 lg:items-start lg:gap-5">
          {/* Linke Spalte: Clay-Karte + Tagesritual-Zeile */}
          <div className="flex flex-col gap-3">
          {/* Clay-Gradient-Karte mit Stift-Icon (Master, kein Foto) */}
          <div
            className="relative overflow-hidden rounded-[24px] border p-6 sm:p-8"
            style={{
              borderColor: "rgba(205,138,91,0.24)",
              boxShadow: "0 16px 36px rgba(120,86,52,0.14)",
              background: "linear-gradient(135deg,#F8EFDF 0%,#F4F0E6 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-7 -top-11 h-40 w-40 rounded-full blur-[28px]"
              style={{ background: "radial-gradient(circle, rgba(224,170,80,.26), transparent 68%)" }}
            />
            <div className="relative">
              <span className="mb-3.5 inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white text-[#CD8A5B] shadow-[0_6px_16px_rgba(120,86,52,0.14)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </span>
              <h3 className="serif mb-2 text-[21px] font-[650] leading-[1.25] tracking-[-0.015em] text-[#3a2e22]">
                Noch nichts notiert. <em className="g">Auch gut.</em>
              </h3>
              <p className="mb-[18px] max-w-[290px] text-[15px] font-[450] leading-[1.5] text-[#6a5a48]">
                Ein Satz reicht für den Anfang. Was geht dir gerade durch den
                Kopf, so wie es ist?
              </p>
              <button
                type="button"
                onClick={() => navigate("/neu")}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold text-[#23221A] shadow-[0_6px_16px_rgba(110,155,44,0.3)] transition hover:-translate-y-0.5"
                style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
              >
                Ersten Eintrag schreiben
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tagesritual-Zeile */}
          <Link
            to="/ritual"
            className="flex items-center gap-[13px] rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-[15px] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
          >
            <span
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[#CD8A5B]"
              style={tileRelief("#F6ECE2")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
                <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
                Tagesritual starten
              </div>
              <div className="mt-px text-[13px] text-[#9a917f]">
                6 Minuten · ein ruhiger Anfang
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#9a917f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          </div>

          {/* Muster & Stimmung — gestrichelter Platzhalter (Desktop: rechte Spalte) */}
          <div
            className="rounded-[18px] border border-dashed p-[18px] lg:p-6"
            style={{ borderColor: "rgba(35,34,26,0.16)", background: "rgba(255,255,255,0.5)" }}
          >
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
              Muster &amp; Stimmung
            </div>
            <div className="mb-3 flex items-center justify-between">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="h-[15px] w-[15px] rounded-full" style={{ background: "#E6DFCF" }} />
              ))}
            </div>
            <p className="text-[13px] leading-[1.5] text-[#9a917f]">
              Sobald du ein paar Einträge hast, zeigen sich hier deine Muster und
              deine Stimmung.
            </p>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Keine Einträge in diesem Filter.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
            {shown.map((e) => (
              <JournalCard key={e.id} entry={e} />
            ))}
          </div>
          <div className="flex justify-end pt-1">
            <Link
              to="/archiv"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-[18px] py-[11px] text-[14px] font-semibold text-[var(--foreground)] shadow-[0_2px_10px_rgba(35,34,26,.04)] transition hover:-translate-y-0.5"
            >
              Alle Einträge ansehen
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
              </svg>
            </Link>
          </div>
        </>
      )}
      </div>

      {/* Pausentag-Bestätigung (Bottom-Sheet): Serie schützen, Pausentag einlösen */}
      {pauseSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setPauseSheetOpen(false)}
            className="absolute inset-0 bg-[rgba(35,34,26,0.46)]"
          />
          <div className="relative w-full rounded-t-[24px] bg-[var(--surface)] px-6 pb-9 pt-5 shadow-[0_-20px_48px_rgba(35,34,26,0.22)] sm:mb-0 sm:max-w-[440px] sm:rounded-[24px] sm:px-7 sm:pb-7">
            <div className="mx-auto mb-[22px] h-1 w-9 rounded-full bg-[#EFEADD] sm:hidden" />
            <div className="mb-4 flex items-center gap-3.5">
              <span
                className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-[14px] shadow-[0_4px_12px_rgba(221,177,75,.22)]"
                style={{ background: "linear-gradient(145deg,#FDF0D0,#FDEAB8)", color: "#DDB14B" }}
              >
                <Icon d={ICONS.pause} size={24} />
              </span>
              <div>
                <div className="text-[20px] font-[650] leading-tight tracking-[-0.02em] text-[var(--foreground)]">
                  Ruhetag nehmen?
                </div>
                <div className="mt-[3px] text-[13px] text-[var(--muted)]">
                  Deine {streak}-Tage-Serie bleibt erhalten.
                </div>
              </div>
            </div>
            <p className="mb-5 text-[14.5px] leading-[1.6] text-[#5d564a]">
              Manchmal ist aussetzen das Klügste. Heute zählt als{" "}
              <em className="g">Ruhetag</em>. Deine Serie läuft weiter.
            </p>
            <div className="mb-[22px] flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3.5 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9a917f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="flex-none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="text-[13px] leading-[1.4] text-[var(--muted)]">
                Nach dem Ruhetag brauchst du 7 neue Tage, um wieder einen
                Pausentag zu verdienen.
              </span>
            </div>
            <button
              type="button"
              onClick={takeRestDay}
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full py-[14px] text-[15.5px] font-[650] text-[#23221A] shadow-[0_6px_18px_rgba(110,155,44,0.3)]"
              style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
            >
              <Icon d={ICONS.pause} size={18} />
              Serie schützen · Ruhetag nehmen
            </button>
            <button
              type="button"
              onClick={() => {
                setPauseSheetOpen(false);
                navigate("/neu");
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 py-2 text-[14px] font-semibold text-[var(--green-text,#447510)]"
            >
              Doch lieber schreiben
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
