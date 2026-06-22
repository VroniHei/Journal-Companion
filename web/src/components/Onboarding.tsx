import { useState, type ReactNode } from "react";
import { useEntries, useSettings } from "../hooks/useData";
import { updateSettings } from "../lib/settings";
import { FOCUS_OPTIONS } from "../lib/focus";

// Ruhiger Erststart (2 Schritte): Fokus wählen + Wunsch-Erinnerungszeit.
// Erscheint nur für neue Nutzer (keine Einträge, noch nicht onboardet).
// Mobile = Vollbild, Desktop = ruhig zentriertes Overlay über gedimmtem Grund.

type DaypartKey = "morning" | "noon" | "evening";

const DAYPARTS: {
  key: DaypartKey;
  label: string;
  micro: string;
  default: string;
  icon: ReactNode;
}[] = [
  {
    key: "morning",
    label: "Morgens",
    micro: "Zum ruhigen Start in den Tag",
    default: "08:00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
        <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
      </svg>
    ),
  },
  {
    key: "noon",
    label: "Mittags",
    micro: "Kurz durchatmen",
    default: "13:00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
      </svg>
    ),
  },
  {
    key: "evening",
    label: "Abends",
    micro: "Den Tag ausklingen lassen",
    default: "20:00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      </svg>
    ),
  },
];

const ArrowRight = (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
  </svg>
);

export function Onboarding() {
  const settings = useSettings();
  const entries = useEntries();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState("");
  const [selected, setSelected] = useState<DaypartKey>("morning");
  const [times, setTimes] = useState<Record<DaypartKey, string>>({
    morning: "08:00",
    noon: "13:00",
    evening: "20:00",
  });

  if (settings.onboarded || entries.length > 0) return null;

  const time = times[selected];

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

  const dots = (
    <div className="flex gap-1.5">
      <span
        className="h-[5px] rounded-full transition-all"
        style={{ width: step === 0 ? 22 : 9, background: step === 0 ? "#A8E84F" : "rgba(35,34,26,0.16)" }}
      />
      <span
        className="h-[5px] rounded-full transition-all"
        style={{ width: step === 1 ? 22 : 9, background: step === 1 ? "#A8E84F" : "rgba(35,34,26,0.16)" }}
      />
    </div>
  );

  const primaryBtn = "inline-flex w-full items-center justify-center gap-2.5 rounded-full border-none px-6 py-[15px] text-base font-semibold text-[#23221A] [background:linear-gradient(180deg,#B4ED63,#A8E84F)] shadow-[0_8px_22px_rgba(110,155,44,0.32)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto sm:flex sm:items-center sm:justify-center sm:bg-[rgba(35,34,26,0.46)] sm:p-6 sm:backdrop-blur-sm">
      <div
        className="relative mx-auto flex min-h-full w-full max-w-md flex-col overflow-hidden px-[22px] pb-[22px] pt-6 sm:min-h-0 sm:rounded-[28px] sm:border sm:border-[rgba(35,34,26,0.06)] sm:shadow-[0_40px_90px_rgba(35,34,26,0.3)]"
        style={{ background: "linear-gradient(180deg,#FBF1E1 0%,#F4F0E6 42%,#F8F5EE 100%)" }}
      >
        {/* Tiefe: weich geblurrte Orbs */}
        <div className="pointer-events-none absolute -right-8 -top-12 h-[200px] w-[200px] rounded-full blur-[32px]" style={{ background: "radial-gradient(circle, rgba(224,170,80,.26), transparent 68%)" }} />
        <div className="pointer-events-none absolute -left-10 bottom-28 h-[220px] w-[220px] rounded-full blur-[40px]" style={{ background: "radial-gradient(circle, rgba(168,232,79,.15), transparent 68%)" }} />

        {/* Header (60px): Schritt 1 Wortmarke, Schritt 2 Zurück; rechts Schritt-Punkte */}
        <div className="relative -mx-[22px] mb-6 flex h-[60px] items-center justify-between border-b border-[rgba(35,34,26,0.09)] px-[22px]">
          {step === 0 ? (
            <img src="/innerline-wordmark.svg" alt="Innerline" className="h-[21px] w-auto" />
          ) : (
            <button
              type="button"
              aria-label="Zurück"
              onClick={() => setStep(0)}
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(35,34,26,0.12)] bg-white/70 text-[#5d564a]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
          )}
          {dots}
        </div>

        {step === 0 ? (
          <div className="relative flex flex-1 flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c6b3f]">
              Willkommen
            </div>
            <h1 className="serif mt-2 text-[27px] font-[650] leading-[1.16] tracking-[-0.02em] text-[#3a2e22]">
              Schön, dass du <em className="g">da</em> bist.
            </h1>
            <p className="mt-2.5 max-w-[312px] text-[15.5px] font-[450] leading-[1.5] text-[#6a5a48]">
              Worum geht es dir gerade? Wähl, was passt. Du kannst es später in
              den Einstellungen jederzeit ändern.
            </p>

            {/* Willkommens-Foto */}
            <div className="mt-[18px] h-[158px] flex-none overflow-hidden rounded-[18px] border border-[rgba(35,34,26,0.06)] shadow-[0_10px_26px_rgba(35,34,26,0.1)]">
              <img
                src="/img/welcome-still.webp"
                alt="Ruhiger Morgenplatz mit Journal und Tee"
                className="img-zoom h-full w-full object-cover"
                style={{ objectPosition: "center 52%" }}
              />
            </div>

            {/* 8 Fokus-Chips */}
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              {FOCUS_OPTIONS.map((f) => {
                const active = focus === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFocus(f)}
                    aria-pressed={active}
                    className="inline-flex items-center gap-2 rounded-full px-[15px] py-2.5 text-sm font-medium transition"
                    style={
                      active
                        ? {
                            background: "#fff",
                            border: "1.5px solid #A8E84F",
                            color: "#23221A",
                            boxShadow: "0 4px 14px rgba(110,155,44,0.16)",
                          }
                        : {
                            background: "#fff",
                            border: "1px solid rgba(35,34,26,0.12)",
                            color: "#5d564a",
                          }
                    }
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#6E9B2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                        <path d="M5 12.5l4 4 10-10" />
                      </svg>
                    )}
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-5">
              <button type="button" onClick={() => setStep(1)} disabled={!focus} className={primaryBtn}>
                Weiter
                {ArrowRight}
              </button>
              <div className="mt-3 text-center">
                <button type="button" onClick={skip} className="text-[13.5px] font-medium text-[#9a917f] hover:text-[var(--foreground)]">
                  Später
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-1 flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c6b3f]">
              Schritt 2 von 2
            </div>
            <h1 className="serif mt-2 text-[27px] font-[650] leading-[1.16] tracking-[-0.02em] text-[#3a2e22]">
              Wann passt dir ein <em className="g">ruhiger</em> Moment?
            </h1>
            <p className="mt-2.5 max-w-[312px] text-[15.5px] font-[450] leading-[1.5] text-[#6a5a48]">
              Ein sanfter Anstupser pro Tag. Du kannst ihn später in den
              Einstellungen jederzeit ändern oder ausschalten.
            </p>

            {/* Drei Auswahl-Karten */}
            <div className="mt-5 flex flex-col gap-2.5">
              {DAYPARTS.map((d) => {
                const active = selected === d.key;
                return (
                  <div
                    key={d.key}
                    onClick={() => setSelected(d.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(d.key);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-[13px] rounded-2xl px-[15px] py-[13px] transition"
                    style={
                      active
                        ? { background: "#fff", border: "1.5px solid #A8E84F", boxShadow: "0 6px 18px rgba(110,155,44,0.12)" }
                        : { background: "#fff", border: "1px solid rgba(35,34,26,0.1)" }
                    }
                  >
                    <span
                      className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                      style={active ? { background: "#F0F4E6", color: "#6E9B2C" } : { background: "#F1ECE0", color: "#9a917f" }}
                    >
                      {d.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-[650] tracking-[-0.01em] text-[#23221A]">{d.label}</div>
                      <div className="mt-px text-[12.5px] text-[#9a917f]">{d.micro}</div>
                    </div>
                    {/* Zeit-Chip: antippbar, öffnet native Uhrzeit-Auswahl */}
                    <label
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(d.key);
                      }}
                      className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2.5 text-sm transition"
                      style={
                        active
                          ? { background: "#F0F4E6", border: "1px solid rgba(110,155,44,0.3)", color: "#447510", fontWeight: 600 }
                          : { background: "#fff", border: "1px solid rgba(35,34,26,0.14)", color: "#5d564a", fontWeight: 500 }
                      }
                    >
                      {times[d.key]}
                      <svg viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#9a917f"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      <input
                        type="time"
                        value={times[d.key]}
                        onChange={(e) => {
                          setTimes((t) => ({ ...t, [d.key]: e.target.value }));
                          setSelected(d.key);
                        }}
                        aria-label={`Uhrzeit für ${d.label} anpassen`}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#9a917f]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 8v4l3 2" />
              </svg>
              Tippe auf die Uhrzeit, um sie frei anzupassen.
            </div>

            <div className="mt-auto pt-5">
              <button type="button" onClick={finish} className={primaryBtn}>
                Los geht's
                {ArrowRight}
              </button>
              <div className="mt-3 text-center">
                <button type="button" onClick={finishWithoutReminder} className="text-[13.5px] font-medium text-[#9a917f] hover:text-[var(--foreground)]">
                  Ohne Erinnerung fortfahren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
