import { useState } from "react";
import { Button } from "./ui";
import { useEntries, useSettings } from "../hooks/useData";
import { updateSettings } from "../lib/settings";
import { FOCUS_OPTIONS } from "../lib/focus";

// Ruhiger Erststart (2 Schritte): Fokus wählen + Wunsch-Erinnerungszeit.
// Erscheint nur für neue Nutzer (keine Einträge, noch nicht onboardet).
export function Onboarding() {
  const settings = useSettings();
  const entries = useEntries();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState("");
  const [time, setTime] = useState("08:00");

  if (settings.onboarded || entries.length > 0) return null;

  function finish() {
    void updateSettings({
      focusArea: focus || undefined,
      reminderTime: time || undefined,
      onboarded: true,
    });
  }
  function skip() {
    void updateSettings({ onboarded: true });
  }
  function finishWithoutReminder() {
    void updateSettings({
      focusArea: focus || undefined,
      onboarded: true,
    });
  }

  const DAYPARTS = [
    { label: "Morgens", t: "08:00" },
    { label: "Mittags", t: "13:00" },
    { label: "Abends", t: "20:00" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg,#FBEFD9 0%,#F4F0E6 46%,#F8F5EE 100%)",
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <img
            src="/innerline-wordmark.svg"
            alt="Innerline"
            className="h-5 w-auto"
          />
          <button
            type="button"
            onClick={skip}
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Überspringen
          </button>
        </div>

        {step === 0 ? (
          <div className="mt-10 flex flex-1 flex-col">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#9c6b3f" }}
            >
              Willkommen
            </div>
            <h1 className="serif mt-2 text-[28px] font-semibold leading-tight">
              Schön, dass du <em className="g">da</em> bist.
            </h1>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              Worum geht es dir gerade? Wähl, was passt. Du kannst es später in
              den Einstellungen jederzeit ändern.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {FOCUS_OPTIONS.map((f) => {
                const active = focus === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFocus(f)}
                    aria-pressed={active}
                    className="rounded-full border px-4 py-2.5 text-sm font-medium transition"
                    style={
                      active
                        ? {
                            background: "var(--accent-soft)",
                            borderColor: "var(--green-deep)",
                            color: "var(--foreground)",
                            boxShadow: "0 2px 10px rgba(110,155,44,0.18)",
                          }
                        : {
                            background: "#fff",
                            borderColor: "rgba(35,34,26,0.12)",
                            color: "#5d564a",
                          }
                    }
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-8">
              <Button
                onClick={() => setStep(1)}
                disabled={!focus}
                className="w-full"
              >
                Weiter
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-1 flex-col">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#9c6b3f" }}
            >
              Dein Rhythmus
            </div>
            <h1 className="serif mt-2 text-[28px] font-semibold leading-tight">
              Wann tut dir ein <em className="g">Moment</em> für dich gut?
            </h1>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              Wähl eine Uhrzeit fürs Tagesritual. Das ist nur ein sanfter
              Anhaltspunkt für dich, keine Benachrichtigung.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {DAYPARTS.map((d) => {
                const active = time === d.t;
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setTime(d.t)}
                    aria-pressed={active}
                    className="rounded-full border px-4 py-2.5 text-sm font-medium transition"
                    style={
                      active
                        ? {
                            background: "var(--accent-soft)",
                            borderColor: "var(--green-deep)",
                            color: "var(--foreground)",
                            boxShadow: "0 2px 10px rgba(110,155,44,0.18)",
                          }
                        : {
                            background: "#fff",
                            borderColor: "rgba(35,34,26,0.12)",
                            color: "#5d564a",
                          }
                    }
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium">
                Uhrzeit (frei wählbar)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full max-w-[200px] rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent-text)]"
              />
            </div>

            <div className="mt-auto pt-8">
              <div className="flex items-center gap-3">
                <Button onClick={finish} className="flex-1">
                  Los geht's
                </Button>
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Zurück
                </Button>
              </div>
              <button
                type="button"
                onClick={finishWithoutReminder}
                className="mt-3 w-full text-center text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Ohne Erinnerung fortfahren
              </button>
            </div>
          </div>
        )}

        {/* Schritt-Punkte */}
        <div className="mt-8 flex justify-center gap-2">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: step === i ? 20 : 6,
                background: step === i ? "var(--green-deep,#6E9B2C)" : "rgba(35,34,26,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
