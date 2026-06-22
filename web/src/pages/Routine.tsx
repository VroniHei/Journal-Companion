import { useNavigate } from "react-router-dom";
import { useRoutineDays, useRoutineToday, useSettings } from "../hooks/useData";
import { dayKey, setRoutineDay } from "../db/queries";
import { updateSettings } from "../lib/settings";

// Routine-Wechsel: nicht verbieten, sondern ersetzen. Auslöser verstehen, eine
// kleine Alternative wählen, abends ehrlich nachschauen. Ohne Streak-Druck.

const TRIGGERS = ["Stress", "Langeweile", "Runterkommen", "Gewohnheit", "Einsamkeit"];

export function Routine() {
  const settings = useSettings();
  const navigate = useNavigate();
  const today = dayKey();
  const todayRec = useRoutineToday(today);
  const all = useRoutineDays();

  const old = settings.routineOld ?? "";
  const neu = settings.routineNew ?? "";
  const trigger = todayRec?.trigger;

  // Letzte 7 Tage (alt → neu).
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return {
      key,
      replaced: all.find((r) => r.date === key)?.replaced ?? false,
      label: d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
    };
  });
  const doneCount = week.filter((d) => d.replaced).length;

  // Sanfter Hinweis: an Stress-Tagen fällt der Wechsel schwerer?
  const stressMissed = all.some((r) => !r.replaced && r.trigger === "Stress");

  return (
    <section className="space-y-6">
      {/* Kopf: Zurück-Pfeil + Titel (wie andere Unterseiten) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="serif text-[22px] font-semibold tracking-[-0.02em] sm:text-3xl">
          Routine-Wechsel
        </h1>
      </div>

      <p className="lead max-w-[460px] text-[15.5px] text-[var(--foreground)]">
        Nicht verbieten, sondern <em className="g">ersetzen</em>. Auslöser
        verstehen, eine kleine Alternative wählen, abends ehrlich nachschauen.
      </p>

      {/* Desktop nutzt die volle Breite: zwei Spalten statt schmaler Mobile-Spalte */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Dein Wechsel: alt → neu als zwei Pills mit Pfeil (editierbar) */}
        <div
          className="relative overflow-hidden rounded-[22px] border p-5 shadow-[0_14px_32px_rgba(120,86,52,.13)]"
          style={{
            borderColor: "rgba(205,138,91,.22)",
            background: "linear-gradient(135deg,#F8EFDF,#F4F0E6)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-10 h-[150px] w-[150px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(224,170,80,.24), transparent 68%)", filter: "blur(28px)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#9c6b3f]">
              Dein Wechsel
            </div>
            <div className="flex items-center gap-3">
              <input
                value={old}
                onChange={(e) => updateSettings({ routineOld: e.target.value })}
                placeholder="Alte Gewohnheit"
                aria-label="Alte Gewohnheit"
                className="min-w-0 flex-1 rounded-xl border border-[rgba(35,34,26,.08)] bg-[rgba(255,255,255,.66)] px-3.5 py-2.5 text-[15px] font-semibold text-[#8a7256] outline-none placeholder:font-normal placeholder:text-[#b0a08a] focus:border-[var(--clay)]"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="#9c6b3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" className="flex-none">
                <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
              </svg>
              <input
                value={neu}
                onChange={(e) => updateSettings({ routineNew: e.target.value })}
                placeholder="Neue Alternative"
                aria-label="Neue Alternative"
                className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[#A8E84F] bg-[var(--surface)] px-3.5 py-2.5 text-[15px] font-[650] text-[var(--foreground)] shadow-[0_4px_12px_rgba(110,155,44,.14)] outline-none placeholder:font-normal placeholder:text-[#9a917f] focus:border-[#8ed03a]"
              />
            </div>
          </div>
        </div>

        {/* Auslöser heute */}
        <div className="lg:self-center">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a917f]">
            Was war heute der Auslöser?
          </div>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => {
              const active = trigger === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRoutineDay(today, { trigger: active ? undefined : t })}
                  className="inline-flex items-center gap-1.5 rounded-full px-[13px] py-2 text-[13.5px] transition"
                  style={{
                    background: active ? "#F2F6E8" : "var(--surface)",
                    color: active ? "var(--foreground)" : "var(--muted)",
                    fontWeight: active ? 600 : 500,
                    border: active ? "1.5px solid #A8E84F" : "1px solid rgba(35,34,26,.12)",
                  }}
                >
                  {active && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#6E9B2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M5 12.5l4 4 10-10" />
                    </svg>
                  )}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diese Woche — antippbar (ersetzt den separaten Toggle) */}
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-[16px_18px] shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Diese Woche
            </span>
            <span className="text-[12.5px] text-[#9a917f]">{doneCount} von 7 ersetzt</span>
          </div>
          <div className="flex justify-between">
            {week.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setRoutineDay(d.key, { replaced: !d.replaced })}
                aria-pressed={d.replaced}
                aria-label={`${d.label}${d.replaced ? " · ersetzt" : ""}`}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px] transition-colors"
                  style={{ background: d.replaced ? "#A8E84F" : "#EFEADD" }}
                >
                  {d.replaced && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2C3522" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                      <path d="M5 12.5l4 4 10-10" />
                    </svg>
                  )}
                </span>
                <span className="text-[10.5px] text-[#9a917f]">{d.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#9a917f]">
            Tippe einen Tag an, wenn du die neue Routine gewählt hast. Kein Muss.
          </p>
        </div>

        {/* Sanfter Hinweis */}
        <div
          className="rounded-2xl border p-4 shadow-[var(--shadow-card)] lg:self-center"
          style={{ background: "linear-gradient(135deg,#F4F8EC,var(--surface))", borderColor: "rgba(110,155,44,.2)" }}
        >
          <p className="text-[15px] leading-[1.55] text-[var(--foreground)]">
            {stressMissed ? (
              <>
                An <em className="g">Stress</em>-Tagen fällt der Wechsel schwerer.
                Kein Drama. Schau, was dir an guten Tagen geholfen hat.
              </>
            ) : (
              <>
                Jeder ersetzte Tag zählt. <em className="g">Fortschritt</em> statt
                Perfektion.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
