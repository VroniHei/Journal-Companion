import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { detectCrisis } from "@journal/shared/crisis";
import { Button } from "../components/ui";
import { DesktopModal } from "../components/DesktopModal";
import { DictationButton } from "../components/DictationButton";
import { CrisisNotice } from "../components/CrisisNotice";
import { useDailyRitual, useEntries, useRestDays } from "../hooks/useData";
import { dayKey, syncRitualEntry, upsertDailyRitual } from "../db/queries";
import { isEveningNow, ritualTheme } from "../lib/daypart";
import { computeStreak, pauseDaysAvailable } from "../lib/insights";

type Period = "morning" | "evening";

const HERO: Record<Period, { pre: string; accent: string; post: string }> = {
  morning: { pre: "Ein ruhiger ", accent: "Anfang", post: "." },
  evening: { pre: "Ein ruhiger ", accent: "Ausklang", post: "." },
};

// Eine einzelne Eingabezeile im Ritual-Stil (gefüllt = warm, leer = gestrichelt).
function Line({
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
}) {
  const filled = value.trim().length > 0;
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full text-sm outline-none placeholder:text-[#9a917f] focus:border-[var(--accent-text)]"
        style={{
          background: filled ? "#FAF7F0" : "#fff",
          border: filled
            ? "1px solid rgba(35,34,26,.08)"
            : "1px dashed rgba(35,34,26,.18)",
          borderRadius: 12,
          padding: "11px 13px",
          color: "#3a352b",
        }}
      />
      <div className="mt-1.5 flex justify-end">
        <DictationButton
          value={value}
          onChange={onChange}
          onActivate={onBlur}
        />
      </div>
    </div>
  );
}

// Bis zu 3 Zeilen; die erste leere wird als „Noch etwas?" angeboten.
// WICHTIG: top-level definiert (nicht in Ritual), sonst remountet React die
// Inputs bei jedem Tastendruck und der Fokus geht nach einem Zeichen verloren.
function MultiLines({
  values,
  onChangeAt,
  onBlur,
}: {
  values: string[];
  onChangeAt: (i: number, v: string) => void;
  onBlur: () => void;
}) {
  const firstEmpty = values.findIndex((v) => !v.trim());
  return (
    <div className="flex flex-col gap-2">
      {values.map((v, i) => {
        if (!v.trim() && i !== firstEmpty) return null;
        return (
          <Line
            key={i}
            value={v}
            onChange={(val) => onChangeAt(i, val)}
            onBlur={onBlur}
            placeholder={i === 0 ? "Etwas Schönes …" : "Noch etwas? (optional)"}
          />
        );
      })}
    </div>
  );
}

export function Ritual() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Optional ein bestimmter Tag (Ritual-Verlauf); sonst heute.
  const date = params.get("date") ?? dayKey();
  const isToday = date === dayKey();
  const ritual = useDailyRitual(date);
  const entries = useEntries();
  const restDays = useRestDays();
  const streak = computeStreak(entries, restDays.map((r) => r.date));
  const pauseAvailable = pauseDaysAvailable(streak, restDays.length);

  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [makeGreat, setMakeGreat] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [goodDeed, setGoodDeed] = useState("");
  const [better, setBetter] = useState("");
  const [moments, setMoments] = useState(["", "", ""]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tageszeit als Default; Morgen/Abend ist umschaltbar, damit man beide Hälften
  // eines Tages ansehen und ändern kann (z. B. abends die Früh-Eingaben).
  const initialPeriod: Period =
    params.get("period") === "evening"
      ? "evening"
      : params.get("period") === "morning"
        ? "morning"
        : isToday && isEveningNow()
          ? "evening"
          : "morning";
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const theme = ritualTheme(period === "evening");
  const [open, setOpen] = useState(0);
  const [done, setDone] = useState(false);

  // Beim Wechsel des angesehenen Tages Felder leeren und neu befüllen.
  useEffect(() => {
    setHydrated(false);
    setGratitude(["", "", ""]);
    setMakeGreat("");
    setAffirmation("");
    setGoodDeed("");
    setBetter("");
    setMoments(["", "", ""]);
  }, [date]);

  useEffect(() => {
    if (ritual && !hydrated) {
      const g = ritual.gratitude ?? [];
      const m = ritual.goodMoments ?? [];
      setGratitude([g[0] ?? "", g[1] ?? "", g[2] ?? ""]);
      setMakeGreat(ritual.makeGreat ?? "");
      setAffirmation(ritual.affirmation ?? "");
      setGoodDeed(ritual.goodDeed ?? "");
      setBetter(ritual.better ?? "");
      setMoments([m[0] ?? "", m[1] ?? "", m[2] ?? ""]);
      setHydrated(true);
    }
  }, [ritual, hydrated]);

  async function commit() {
    await upsertDailyRitual(date, {
      gratitude: gratitude.map((s) => s.trim()).filter(Boolean),
      makeGreat: makeGreat.trim() || undefined,
      affirmation: affirmation.trim() || undefined,
      goodDeed: goodDeed.trim() || undefined,
      better: better.trim() || undefined,
      goodMoments: moments.map((s) => s.trim()).filter(Boolean),
    });
    // Als Tageseintrag spiegeln (erscheint in „Letzte Einträge"/Archiv, Serie).
    await syncRitualEntry(date);
    setSaved(true);
  }

  function setAt(
    arr: string[],
    set: (v: string[]) => void,
    i: number,
    v: string,
  ) {
    const next = [...arr];
    next[i] = v;
    set(next);
    setSaved(false);
  }

  // Drei Fragen je Tageszeit, jeweils mit Inhalt + „beantwortet?"-Signal.
  const questions: {
    title: ReactNode;
    answered: boolean;
    body: ReactNode;
  }[] =
    period === "morning"
      ? [
          {
            title: (
              <>
                Wofür bist du gerade <em className="g">dankbar</em>?
              </>
            ),
            answered: gratitude.some((s) => s.trim()),
            body: (
              <MultiLines
                values={gratitude}
                onChangeAt={(i, val) => setAt(gratitude, setGratitude, i, val)}
                onBlur={commit}
              />
            ),
          },
          {
            title: (
              <>
                Was würde den Tag <em className="g">gut</em> machen?
              </>
            ),
            answered: makeGreat.trim().length > 0,
            body: (
              <Line
                value={makeGreat}
                onChange={(v) => {
                  setMakeGreat(v);
                  setSaved(false);
                }}
                onBlur={commit}
                placeholder="Eine Sache, auf die du dich ausrichtest …"
              />
            ),
          },
          {
            title: (
              <>
                Ein guter <em className="g">Satz</em> für dich
              </>
            ),
            answered: affirmation.trim().length > 0,
            body: (
              <Line
                value={affirmation}
                onChange={(v) => {
                  setAffirmation(v);
                  setSaved(false);
                }}
                onBlur={commit}
                placeholder="Ich bin …"
              />
            ),
          },
        ]
      : [
          {
            title: (
              <>
                Was hast du heute <em className="g">Gutes</em> getan?
              </>
            ),
            answered: goodDeed.trim().length > 0,
            body: (
              <Line
                value={goodDeed}
                onChange={(v) => {
                  setGoodDeed(v);
                  setSaved(false);
                }}
                onBlur={commit}
                placeholder="Für jemanden, oder für dich selbst …"
              />
            ),
          },
          {
            title: (
              <>
                Was wäre noch <em className="g">besser</em> gegangen?
              </>
            ),
            answered: better.trim().length > 0,
            body: (
              <Line
                value={better}
                onChange={(v) => {
                  setBetter(v);
                  setSaved(false);
                }}
                onBlur={commit}
                placeholder="Ohne Härte, einfach ein Lernen …"
              />
            ),
          },
          {
            title: (
              <>
                Schöne <em className="g">Momente</em> heute
              </>
            ),
            answered: moments.some((s) => s.trim()),
            body: (
              <MultiLines
                values={moments}
                onChangeAt={(i, val) => setAt(moments, setMoments, i, val)}
                onBlur={commit}
              />
            ),
          },
        ];

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function switchPeriod(p: Period) {
    setPeriod(p);
    setOpen(0);
  }
  const hero = HERO[period];
  const step = open + 1;
  const allAnswered = questions.every((q) => q.answered);
  // Krisen-Check über alle Ritual-Freitexte (auch dieser Pfad umging das Netz).
  const crisis = detectCrisis(
    [...gratitude, makeGreat, affirmation, goodDeed, better, ...moments].join(
      " ",
    ),
  );

  function finish() {
    commit();
    setDone(true);
  }

  // Ruhiger „geschafft"-Moment, sobald alle drei Fragen beantwortet sind.
  if (done) {
    // Recap als EINE Karte mit drei Zeilen, je farbiger Punkt (Master).
    const recap = (
      period === "morning"
        ? [
            { label: "Dankbar", value: gratitude.find((s) => s.trim()), dot: "#CD8A5B", italic: false },
            { label: "Fokus", value: makeGreat.trim(), dot: "#DDB14B", italic: false },
            { label: "Ein guter Satz", value: affirmation.trim(), dot: "#9BA383", italic: true },
          ]
        : [
            { label: "Gutes getan", value: goodDeed.trim(), dot: "#CD8A5B", italic: false },
            { label: "Besser", value: better.trim(), dot: "#DDB14B", italic: false },
            { label: "Momente", value: moments.find((s) => s.trim()), dot: "#9BA383", italic: false },
          ]
    ).filter((r) => r.value);
    return (
      <DesktopModal onClose={() => navigate("/")}>
      <section>
        <div
          className="relative overflow-hidden p-8 text-center"
          style={{
            borderRadius: 28,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 20px 46px rgba(120,86,52,0.16)",
            background: theme.evening
              ? "linear-gradient(180deg,#EFEAF8 0%,#F1ECEC 46%,#F8F5EE 100%)"
              : "linear-gradient(180deg,#FBEFD9 0%,#F4F0E6 46%,#F8F5EE 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute"
            style={{
              top: -40,
              right: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: theme.orbWarm,
              filter: "blur(34px)",
            }}
          />
          <div className="relative mx-auto max-w-[460px]">
            <span
              className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full text-white"
              style={{
                background: theme.badge,
                boxShadow: "0 12px 28px rgba(120,86,52,0.32)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="34"
                height="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </span>
            <div
              className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.eyebrow }}
            >
              Tagesritual · {period === "morning" ? "Morgen" : "Abend"}
            </div>
            <h1
              className="serif mt-3 text-[26px] font-semibold leading-tight"
              style={{ color: theme.title }}
            >
              Geschafft.{" "}
              <em className="g">
                {period === "morning" ? "Schöner Anfang" : "Schöner Abend"}
              </em>
              .
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "#6a5a48" }}>
              Sechs Minuten für dich. Das zählt.
            </p>

            <div
              className="mt-6 rounded-[20px] border bg-white px-[18px] text-left"
              style={{
                borderColor: "rgba(35,34,26,0.07)",
                boxShadow: "0 8px 24px rgba(35,34,26,0.06)",
              }}
            >
              {recap.map((r, i) => (
                <div
                  key={r.label}
                  className="flex items-start gap-3 py-3.5"
                  style={
                    i < recap.length - 1
                      ? { borderBottom: "1px solid rgba(35,34,26,0.07)" }
                      : undefined
                  }
                >
                  <span
                    className="mt-[5px] h-[9px] w-[9px] flex-none rounded-full"
                    style={{ background: r.dot }}
                  />
                  <div>
                    <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a917f]">
                      {r.label}
                    </div>
                    <div className="text-[15px] leading-[1.4] text-[#23221A]">
                      {r.italic ? <em className="g">{r.value}</em> : r.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Serie-Zeile mit Blatt-Icon (echte Werte) */}
            <div className="mt-[18px] flex items-center justify-center gap-2 text-[13px] font-medium text-[#6a5a48]">
              {/* Serie/Streak = award (Lucide, 1:1) */}
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="#DDB14B"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
              <span>
                <strong className="font-[650] text-[#23221A]">
                  {streak} {streak === 1 ? "Tag" : "Tage"}
                </strong>{" "}
                in Folge{pauseAvailable > 0 ? " · 1 Pausentag in Reserve" : ""}
              </span>
            </div>

            <div className="mt-[18px]">
              <Button
                onClick={() => navigate("/")}
                className="w-full px-6 py-[15px] text-base shadow-[0_8px_22px_rgba(110,155,44,0.32)]"
              >
                Zurück zum Tag
                <svg
                  viewBox="0 0 18 18"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </DesktopModal>
    );
  }

  // B4: Auf Desktop eine echte 2-spaltige Seite (Inhalt links, Foto rechts),
  // nicht als Modal. Foto nach Tageszeit (Morgen Notizbuch, Abend Journal-Matte).
  const sidePhoto =
    period === "evening" ? "/img/journal-mat.webp" : "/img/notebook-still.webp";

  return (
    <div className="lg:grid lg:grid-cols-[1fr_432px] lg:items-start lg:gap-8">
    <section className="space-y-4">
      <div>
        <h1 className="serif text-3xl font-semibold">Tagesritual</h1>
        {isToday ? (
          <p className="mt-1 text-[var(--muted)]">
            Ein kleines Ritual für den Tag. Kein Muss. Tippe eine Frage an und
            fülle aus, was dir leichtfällt.
          </p>
        ) : (
          <p className="mt-1 text-[var(--muted)]">
            Du siehst den {dateLabel}. Du kannst hier nachsehen oder noch etwas
            ergänzen.{" "}
            <button
              type="button"
              onClick={() => navigate("/ritual")}
              className="font-semibold text-[var(--green-text,#447510)] hover:underline"
            >
              Zu heute
            </button>
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate("/ritual-verlauf")}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Frühere Rituale ansehen →
        </button>
      </div>

      {/* Hero mit Fortschritt (Tageszeit-Theming: morgens warm, abends Flieder) */}
      <div
        className="relative overflow-hidden p-6"
        style={{
          borderRadius: 22,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 14px 32px rgba(120,86,52,.14)",
          background: theme.hero,
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            top: -44,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: theme.orbWarm,
            filter: "blur(26px)",
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.eyebrow }}
            >
              {dateLabel}
            </div>
            {/* Morgen/Abend umschaltbar: beide Hälften ansehen & ändern. */}
            <div
              className="flex gap-[3px] rounded-full p-[3px]"
              style={{ background: "rgba(255,255,255,0.5)" }}
            >
              {(["morning", "evening"] as const).map((p) => {
                const active = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => switchPeriod(p)}
                    className="rounded-full px-3 py-1 text-[13px] transition"
                    style={{
                      background: active ? "var(--surface)" : "transparent",
                      color: active ? theme.title : theme.eyebrow,
                      fontWeight: active ? 600 : 500,
                      boxShadow: active ? "0 2px 6px rgba(120,86,52,.12)" : "none",
                    }}
                  >
                    {p === "morning" ? "Morgen" : "Abend"}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="serif my-2 text-2xl font-semibold"
            style={{ color: theme.title }}
          >
            {hero.pre}
            <em className="g">{hero.accent}</em>
            {hero.post}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{
                background: theme.evening
                  ? "rgba(123,107,150,.18)"
                  : "rgba(205,138,91,.18)",
              }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${(step / 3) * 100}%`,
                  background: theme.evening
                    ? "linear-gradient(90deg,#CBBEF4,#9d8fce)"
                    : "linear-gradient(90deg,#F0C36B,#CD8A5B)",
                }}
              />
            </div>
            <span
              className="text-[11.5px] font-semibold"
              style={{ color: theme.eyebrow }}
            >
              Schritt {step} von 3
            </span>
          </div>
        </div>
      </div>

      {/* Fragen — eine offen, die anderen eingeklappt */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                border: isOpen
                  ? `1px solid ${theme.border}`
                  : "1px solid rgba(35,34,26,.07)",
                borderRadius: 20,
                boxShadow: isOpen
                  ? "0 8px 24px rgba(120,86,52,.08)"
                  : "var(--shadow-card)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2.5 p-[18px] text-left"
              >
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
                  style={
                    isOpen || q.answered
                      ? theme.evening
                        ? { background: "#EDE8F8", color: "#7a6b96" }
                        : { background: "#F6ECE2", color: "#CD8A5B" }
                      : { background: "#F1ECE0", color: "#9a917f" }
                  }
                >
                  {q.answered && !isOpen ? "✓" : i + 1}
                </span>
                <span
                  className={`flex-1 text-[15.5px] ${
                    isOpen
                      ? "font-semibold text-[var(--foreground)]"
                      : "font-medium text-[var(--foreground)]"
                  }`}
                >
                  {q.title}
                </span>
                <span
                  aria-hidden="true"
                  className="text-[var(--muted)] transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ⌄
                </span>
              </button>
              {isOpen && <div className="px-[18px] pb-[18px]">{q.body}</div>}
            </div>
          );
        })}
      </div>

      <CrisisNotice level={crisis.level} className="mt-4" />

      <div className="space-y-1.5 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={allAnswered ? finish : commit}>
            {allAnswered ? "Ritual abschließen" : "Speichern"}
          </Button>
          {saved && !allAnswered && (
            <span className="text-sm text-[var(--muted)]">Gespeichert ✓</span>
          )}
        </div>
        <p className="text-[13px] text-[var(--muted)]">
          Deine Eingaben werden auch automatisch gesichert, sobald du ein Feld
          verlässt.
        </p>
      </div>
    </section>

    {/* Rechte Spalte (nur Desktop): ruhiges Tageszeit-Foto, mitscrollend. */}
    <aside className="hidden lg:block lg:sticky lg:top-6">
      <div
        className="relative overflow-hidden rounded-[22px] border"
        style={{
          borderColor: theme.border,
          boxShadow: "0 14px 32px rgba(120,86,52,.14)",
        }}
      >
        <img
          src={sidePhoto}
          alt=""
          className="h-[600px] w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: theme.evening
              ? "linear-gradient(180deg,rgba(123,107,150,.10),rgba(35,34,26,.04) 40%,transparent)"
              : "linear-gradient(180deg,rgba(205,138,91,.12),rgba(35,34,26,.04) 40%,transparent)",
          }}
        />
      </div>
    </aside>
    </div>
  );
}
