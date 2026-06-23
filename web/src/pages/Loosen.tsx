import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { detectCrisis } from "@journal/shared/crisis";
import { recordStabilityMoment } from "../db/queries";
import { DictationButton } from "../components/DictationButton";
import { DesktopModal } from "../components/DesktopModal";
import { CrisisNotice } from "../components/CrisisNotice";
import { Icon } from "../components/icons";
import { ICONS } from "../components/iconset";

// Gedankenschleife lösen: benennen → auseinandernehmen → ein kleiner Schritt.
// Ruhiger Fokus-Flow im Flieder-/Beruhigungs-Ton (App-Style §8). In Vronis
// Stimme, nicht klinisch.

const STEPS = [
  {
    n: 1,
    title: "Benennen",
    prompt: "Welcher Gedanke dreht sich gerade?",
    placeholder: "Zum Beispiel: Ich schaffe das alles nicht rechtzeitig.",
  },
  {
    n: 2,
    title: "Auseinandernehmen",
    prompt: "Was davon ist Fakt, was ist Sorge?",
    placeholder: "Fakt ist … Sorge ist …",
  },
  {
    n: 3,
    title: "Ein kleiner Schritt",
    prompt: "Was wäre ein nächster, machbarer Schritt?",
    placeholder: "Eine kleine Sache, die jetzt dran ist.",
  },
] as const;

export function Loosen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [done, setDone] = useState(false);
  const crisis = detectCrisis(answers.join(" "));

  function setAnswer(i: number, v: string) {
    setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
  }

  async function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    await recordStabilityMoment("schleife-geklaert", "Gedankenschleife gelöst");
    setDone(true);
  }

  return (
    <DesktopModal onClose={() => navigate("/")} maxWidth={560}>
    {/* Verlauf füllt das ganze Modal (lg:-m-7 + lg:rounded + lg:p-7), wie Relief,
        statt als hartes Rechteck im weißen Modal zu liegen. */}
    <section
      className="-mx-4 -mt-6 min-h-[70vh] px-4 pt-6 sm:-mx-6 sm:px-6 lg:-m-7 lg:min-h-0 lg:rounded-[26px] lg:p-7"
      style={{
        background:
          "radial-gradient(220px 220px at 8% 2%, rgba(203,190,244,.34), transparent 68%), radial-gradient(200px 200px at 100% 78%, rgba(168,232,79,.12), transparent 68%), linear-gradient(180deg,#F1ECF8 0%,#F4F0EC 44%,#F8F5EE 100%)",
      }}
    >
      <div className="mx-auto max-w-[560px]">
        {done ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#CBBEF4,#A8E84F)" }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <path d="M5 12l5 5L20 6" />
              </svg>
            </div>
            <h1 className="serif text-2xl font-semibold">Einmal durchgeatmet.</h1>
            <p className="lead mt-2 max-w-[360px] text-[15.5px] text-[var(--foreground)]">
              Du hast den Gedanken <em className="g">auseinandergenommen</em> statt
              ihn weiterdrehen zu lassen. Das zählt.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-7 rounded-full px-6 py-3 text-[15px] font-semibold text-[var(--accent-contrast)] shadow-[0_6px_18px_rgba(110,155,44,.3)]"
              style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
            >
              Fertig
            </button>
          </div>
        ) : (
          <>
            {/* Kopf: zentrales Lilac-Emblem (mobil + Desktop, wie Ritual);
                Schließen-X nur im Desktop-Modal oben rechts. */}
            <div className="relative mb-5 flex flex-col items-center text-center">
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => navigate("/")}
                className="absolute right-0 top-0 hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)] lg:inline-flex"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
              <span
                className="flex h-16 w-16 items-center justify-center rounded-[20px] text-white"
                style={{
                  background: "linear-gradient(145deg,#CBBEF4,#9d8fce)",
                  boxShadow: "0 10px 26px rgba(123,107,150,.34)",
                }}
              >
                <Icon d={ICONS.shell} size={30} />
              </span>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a6b96]">
                Gedankenschleife
              </div>
              <h1 className="serif mt-2 text-[24px] font-semibold leading-[1.18] text-[#3a3247]">
                Einmal in Ruhe <em className="g">auseinandernehmen</em>.
              </h1>
              <p className="lead mt-2 max-w-[360px] text-[15px] leading-[1.5] text-[var(--muted)]">
                Ein Gedanke dreht sich. Wir nehmen ihn in drei kleinen Schritten
                auseinander, ruhig.
              </p>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(35,34,26,.1)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${((step + 1) / STEPS.length) * 100}%`,
                    background: "linear-gradient(90deg,#9BA383,#A8E84F)",
                  }}
                />
              </div>
              <span className="text-[11.5px] font-semibold text-[var(--muted)]">
                Schritt {step + 1} von {STEPS.length}
              </span>
            </div>

            <div className="space-y-3">
              {STEPS.map((s, i) => {
                const active = i === step;
                const completed = i < step;
                return (
                  <div
                    key={s.n}
                    className="rounded-[20px] border bg-[var(--surface)] p-[18px]"
                    style={{
                      borderColor: active ? "rgba(35,34,26,.09)" : "var(--border)",
                      boxShadow: active
                        ? "0 8px 24px rgba(35,34,26,.06)"
                        : "var(--shadow-card)",
                    }}
                  >
                    <div className="flex items-center gap-[9px]">
                      <span
                        className="inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[8px] text-[13px] font-bold"
                        style={{
                          background: active || completed ? "#EEF1E6" : "#F1ECE0",
                          color: active || completed ? "#6E9B2C" : "#9a917f",
                        }}
                      >
                        {completed ? "✓" : s.n}
                      </span>
                      <span
                        className="flex-1 text-[15.5px]"
                        style={{
                          fontWeight: active ? 650 : 500,
                          color: active ? "var(--foreground)" : "var(--muted)",
                        }}
                      >
                        {s.title}
                      </span>
                    </div>

                    {active && (
                      <div className="mt-3">
                        <p className="mb-2.5 text-[14.5px] leading-[1.5] text-[var(--muted)]">
                          {s.prompt}
                        </p>
                        <textarea
                          autoFocus
                          value={answers[i]}
                          onChange={(e) => setAnswer(i, e.target.value)}
                          placeholder={s.placeholder}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-[rgba(35,34,26,.08)] bg-[#FAF9F5] px-3.5 py-3 text-[15px] leading-[1.5] text-[#3a352b] outline-none focus:border-[var(--accent)]"
                        />
                        <div className="mt-2 flex justify-end">
                          <DictationButton
                            value={answers[i]}
                            onChange={(v) => setAnswer(i, v)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <CrisisNotice level={crisis.level} className="mt-4" />

            <button
              type="button"
              onClick={next}
              className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-full py-[14px] text-[15px] font-semibold text-[var(--accent-contrast)] shadow-[0_6px_18px_rgba(110,155,44,.3)]"
              style={{ background: "linear-gradient(180deg,#B4ED63,#A8E84F)" }}
            >
              {step < STEPS.length - 1 ? "Weiter" : "Abschließen"}
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
    </DesktopModal>
  );
}
