import { useNavigate } from "react-router-dom";
import { useEnergyLevels, useEnergyToday } from "../hooks/useData";
import { dayKey, setEnergyLevel } from "../db/queries";
import { DesktopModal } from "../components/DesktopModal";

// Energie-Check (leiser Holistic-Layer): nicht Stimmung, sondern Kapazität.
// Opt-in, ein Wert pro Tag, hilft den Tag realistisch zu planen.

const LEVELS = [
  { level: 1, color: "#EFEADD", size: 30, label: "leer" },
  { level: 2, color: "#E6D7C4", size: 34, label: "" },
  { level: 3, color: "#D8C291", size: 40, label: "mittel" },
  { level: 4, color: "#B6CE72", size: 46, label: "" },
  { level: 5, color: "#A8E84F", size: 52, label: "voll" },
];

const WORD = ["", "leerer", "niedriger", "mittlerer", "guter", "voller"];

// Zweiter Satz (nach „Heute fühlt sich nach … Energie an.").
const TAIL: Record<number, string> = {
  1: "Sei heute besonders nachsichtig mit dir.",
  2: "Weniger ist heute genug.",
  3: "Plan ruhig eine Sache weniger ein.",
  4: "Schön, nutz sie ohne dich zu überladen.",
  5: "Genieß den Schwung, lass aber Raum zum Atmen.",
};

const HINT: Record<number, string> = {
  1: "An leeren Tagen reicht oft schon Dasein. Ruhe ist auch etwas.",
  2: "An niedrigen Tagen tut eine kleine, freundliche Sache gut.",
  3: "An mittleren Tagen tut dir Fokus auf eine Sache meist gut. Der Rest darf warten.",
  4: "An guten Tagen darfst du Schwung mitnehmen, ohne dich zu verausgaben.",
  5: "An vollen Tagen lohnt sich das, was dir wirklich wichtig ist.",
};

function color(level: number): string {
  return LEVELS.find((l) => l.level === level)?.color ?? "#EFEADD";
}

export function Energy() {
  const navigate = useNavigate();
  const today = dayKey();
  const todayEnergy = useEnergyToday(today);
  const all = useEnergyLevels();
  const selected = todayEnergy?.level ?? 0;

  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Letzte 7 Tage (alt → neu) für die kleine Historie.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    const rec = all.find((e) => e.date === key);
    return {
      key,
      level: rec?.level ?? 0,
      label: d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
    };
  });

  return (
    <DesktopModal onClose={() => navigate("/")}>
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9a917f]">
            {dateLabel}
          </div>
          <h1 className="serif text-[26px] font-semibold leading-tight">
            Wie viel Energie hast du <em className="g">heute</em>?
          </h1>
        </div>
        <button
          type="button"
          aria-label="Schließen"
          onClick={() => navigate("/")}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Auswahl */}
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[20px_18px] shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-end justify-between gap-[7px]">
          {LEVELS.map((l) => {
            const active = selected === l.level;
            return (
              <button
                key={l.level}
                type="button"
                onClick={() => setEnergyLevel(today, l.level)}
                aria-label={`Energie ${l.level} von 5`}
                aria-pressed={active}
                className="flex flex-col items-center gap-2.5"
              >
                <span
                  className="rounded-full transition-transform"
                  style={{
                    width: l.size,
                    height: l.size,
                    background: l.color,
                    boxShadow: active ? "0 0 0 3px var(--surface), 0 0 0 4.5px #9BA383" : "none",
                    transform: active ? "scale(1.06)" : "none",
                  }}
                />
                {l.label && (
                  <span
                    className="text-[10.5px]"
                    style={{
                      color: active ? "#5d4f3f" : "#9a917f",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {l.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[14px] leading-[1.5] text-[var(--muted)]">
          {selected ? (
            <>
              Heute fühlt sich nach{" "}
              <strong className="font-[650] text-[var(--foreground)]">
                {WORD[selected]} Energie
              </strong>{" "}
              an. {TAIL[selected]}
            </>
          ) : (
            "Tippe auf einen Kreis. Es geht nicht um richtig oder falsch, nur um eine ehrliche Einschätzung."
          )}
        </p>
      </div>

      {/* Sanfter Hinweis */}
      {selected > 0 && (
        <div
          className="rounded-[18px] border p-[16px_18px] shadow-[var(--shadow-card)]"
          style={{
            background: "linear-gradient(135deg,#F4F8EC,var(--surface))",
            borderColor: "rgba(110,155,44,.2)",
          }}
        >
          <div className="mb-2 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#447510]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E9B2C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
            Sanfter Hinweis
          </div>
          <p className="text-[15px] leading-[1.5] text-[var(--foreground)]">
            {HINT[selected]}
          </p>
        </div>
      )}

      {/* 7-Tage-Historie */}
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-[16px_18px] shadow-[var(--shadow-card)]">
        <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Energie · 7 Tage
        </div>
        <div className="flex items-end justify-between">
          {week.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{
                  background: d.level ? color(d.level) : "transparent",
                  border: d.level ? "none" : "1.5px dashed rgba(35,34,26,.16)",
                }}
              />
              <span className="text-[10.5px] text-[#9a917f]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
    </DesktopModal>
  );
}
