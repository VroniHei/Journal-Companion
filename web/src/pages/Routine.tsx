import { useRoutineDays, useRoutineToday, useSettings } from "../hooks/useData";
import { dayKey, setRoutineDay } from "../db/queries";
import { updateSettings } from "../lib/settings";

// Routine-Wechsel: nicht verbieten, sondern ersetzen. Auslöser verstehen, eine
// kleine Alternative wählen, abends ehrlich nachschauen. Ohne Streak-Druck.

const TRIGGERS = ["Stress", "Langeweile", "Runterkommen", "Gewohnheit", "Einsamkeit"];

export function Routine() {
  const settings = useSettings();
  const today = dayKey();
  const todayRec = useRoutineToday(today);
  const all = useRoutineDays();

  const old = settings.routineOld ?? "";
  const neu = settings.routineNew ?? "";
  const trigger = todayRec?.trigger;
  const replaced = todayRec?.replaced ?? false;

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
    <section className="space-y-5">
      <div>
        <h1 className="serif text-3xl font-semibold">Routine-Wechsel</h1>
        <p className="lead mt-2 max-w-[420px] text-[15.5px] text-[var(--foreground)]">
          Nicht verbieten, sondern <em className="g">ersetzen</em>. Eine kleine
          Alternative, ohne Druck.
        </p>
      </div>

      {/* Dein Wechsel (warme Tool-Fläche), Felder editierbar */}
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
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#9c6b3f]">
            Dein Wechsel
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              value={old}
              onChange={(e) => updateSettings({ routineOld: e.target.value })}
              placeholder="Alte Gewohnheit"
              className="flex-1 rounded-xl border border-[rgba(35,34,26,.08)] bg-[rgba(255,255,255,.66)] px-3.5 py-2.5 text-[15px] font-semibold text-[#8a7256] outline-none placeholder:font-normal placeholder:text-[#b0a08a] focus:border-[var(--clay)]"
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="#9c6b3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" className="hidden flex-none rotate-90 self-center sm:block sm:rotate-0">
              <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
            </svg>
            <input
              value={neu}
              onChange={(e) => updateSettings({ routineNew: e.target.value })}
              placeholder="Neue Alternative"
              className="flex-1 rounded-xl border-[1.5px] border-[#A8E84F] bg-[var(--surface)] px-3.5 py-2.5 text-[15px] font-[650] text-[var(--foreground)] shadow-[0_4px_12px_rgba(110,155,44,.14)] outline-none placeholder:font-normal placeholder:text-[#9a917f] focus:border-[#8ed03a]"
            />
          </div>
        </div>
      </div>

      {/* Auslöser heute */}
      <div>
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

      {/* Heute getauscht? */}
      <button
        type="button"
        onClick={() => setRoutineDay(today, { replaced: !replaced })}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-[var(--surface)] px-5 py-4 text-left shadow-[var(--shadow-card)]"
        style={{ borderColor: replaced ? "rgba(110,155,44,.3)" : "var(--border)" }}
      >
        <div>
          <div className="text-[15px] font-[650] text-[var(--foreground)]">
            Heute die neue Routine gewählt
          </div>
          <div className="mt-0.5 text-[13px] text-[var(--muted)]">
            {replaced ? "Schön. Zählt, egal wie der Tag war." : "Kein Muss. Tippen, wenn es geklappt hat."}
          </div>
        </div>
        {/* Toggle */}
        <span
          className="relative h-[26px] w-[44px] flex-none rounded-full transition-colors"
          style={{ background: replaced ? "#A8E84F" : "var(--sand)" }}
        >
          <span
            className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: replaced ? "21px" : "3px" }}
          />
        </span>
      </button>

      {/* Diese Woche */}
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-[16px_18px] shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Diese Woche
          </span>
          <span className="text-[12.5px] text-[#9a917f]">{doneCount} von 7 ersetzt</span>
        </div>
        <div className="flex justify-between">
          {week.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-2">
              <span
                className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px]"
                style={{ background: d.replaced ? "#A8E84F" : "#EFEADD" }}
              >
                {d.replaced && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2C3522" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                    <path d="M5 12.5l4 4 10-10" />
                  </svg>
                )}
              </span>
              <span className="text-[10.5px] text-[#9a917f]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sanfter Hinweis */}
      <div
        className="rounded-2xl border p-4 shadow-[var(--shadow-card)]"
        style={{ background: "linear-gradient(135deg,#F4F8EC,var(--surface))", borderColor: "rgba(110,155,44,.2)" }}
      >
        <p className="text-[15px] leading-[1.55] text-[var(--foreground)]">
          {stressMissed ? (
            <>
              An <em className="g">Stress</em>-Tagen fällt der Wechsel schwerer. Kein
              Drama. Schau, was dir an guten Tagen geholfen hat.
            </>
          ) : (
            <>
              Jeder ersetzte Tag zählt. <em className="g">Fortschritt</em> statt
              Perfektion.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
