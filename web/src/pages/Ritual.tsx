import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { DesktopModal } from "../components/DesktopModal";
import { DictationButton } from "../components/DictationButton";
import { useDailyRitual } from "../hooks/useData";
import { dayKey, upsertDailyRitual } from "../db/queries";
import { isEveningNow, ritualTheme } from "../lib/daypart";

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
  const date = dayKey();
  const ritual = useDailyRitual(date);

  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [makeGreat, setMakeGreat] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [goodDeed, setGoodDeed] = useState("");
  const [better, setBetter] = useState("");
  const [moments, setMoments] = useState(["", "", ""]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tageszeit bestimmt das Ritual automatisch (kein sichtbarer Umschalter).
  const period: Period = isEveningNow() ? "evening" : "morning";
  const theme = ritualTheme(period === "evening");
  const [open, setOpen] = useState(0);
  const [done, setDone] = useState(false);

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

  function commit() {
    void upsertDailyRitual(date, {
      gratitude: gratitude.map((s) => s.trim()).filter(Boolean),
      makeGreat: makeGreat.trim() || undefined,
      affirmation: affirmation.trim() || undefined,
      goodDeed: goodDeed.trim() || undefined,
      better: better.trim() || undefined,
      goodMoments: moments.map((s) => s.trim()).filter(Boolean),
    });
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

  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hero = HERO[period];
  const step = open + 1;
  const allAnswered = questions.every((q) => q.answered);

  function finish() {
    commit();
    setDone(true);
  }

  // Ruhiger „geschafft"-Moment, sobald alle drei Fragen beantwortet sind.
  if (done) {
    const recap =
      period === "morning"
        ? [
            { label: "Dankbar", value: gratitude.find((s) => s.trim()) },
            { label: "Fokus", value: makeGreat.trim() },
            { label: "Dein Satz", value: affirmation.trim() },
          ]
        : [
            { label: "Gutes getan", value: goodDeed.trim() },
            { label: "Besser", value: better.trim() },
            { label: "Momente", value: moments.find((s) => s.trim()) },
          ];
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
              className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.eyebrow }}
            >
              Tagesritual · {period === "morning" ? "Morgen" : "Abend"}
            </div>
            <h1
              className="serif mt-2 text-[26px] font-semibold leading-tight"
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

            <div className="mt-6 space-y-2 text-left">
              {recap
                .filter((r) => r.value)
                .map((r) => (
                  <div
                    key={r.label}
                    className="rounded-2xl border bg-white/70 px-4 py-3"
                    style={{ borderColor: "rgba(35,34,26,0.07)" }}
                  >
                    <div
                      className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: theme.eyebrow }}
                    >
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-[15px] text-[var(--foreground)]">
                      {r.value}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-7">
              <Button onClick={() => navigate("/")}>Fertig</Button>
            </div>
          </div>
        </div>
      </section>
      </DesktopModal>
    );
  }

  return (
    <DesktopModal onClose={() => navigate("/")}>
    <section className="space-y-4">
      <div>
        <h1 className="serif text-3xl font-semibold">Tagesritual</h1>
        <p className="mt-1 text-[var(--muted)]">
          Ein kleines Ritual für den Tag. Kein Muss. Tippe eine Frage an und
          fülle aus, was dir leichtfällt.
        </p>
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
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.eyebrow }}
          >
            {period === "morning" ? "Morgen" : "Abend"} · {dateLabel}
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

      <div className="space-y-1.5 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={allAnswered ? finish : commit}>
            {allAnswered ? "Ritual abschließen" : "Speichern"}
          </Button>
          {saved && !allAnswered && (
            <span className="text-sm text-[var(--muted)]">Gespeichert ✓</span>
          )}
        </div>
        <p className="text-xs text-[var(--muted)]">
          Deine Eingaben werden auch automatisch gesichert, sobald du ein Feld
          verlässt.
        </p>
      </div>
    </section>
    </DesktopModal>
  );
}
