import { useEntries } from "../hooks/useData";
import { themeClusters } from "../lib/insights";

// Roter Faden (Markenkern): wiederkehrende Themen über die letzten Wochen —
// nicht nur Wörter, sondern was sich durchzieht. Drill-in aus „Muster".
export function RedThread() {
  const entries = useEntries();
  const clusters = themeClusters(entries);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="serif text-3xl font-semibold">Roter Faden</h1>
        <p className="lead mt-2 text-[16px] text-[var(--foreground)]">
          Was sich bei dir <em className="g">durchzieht</em> — über die letzten Wochen.
        </p>
      </div>

      {clusters.length === 0 ? (
        <p className="max-w-[420px] text-[14px] leading-relaxed text-[var(--muted)]">
          Noch kein roter Faden zu sehen. Sobald sich Themen über mehrere Einträge
          wiederholen, zeigt sich hier, was dich gerade begleitet. Auch gut, wenn
          es noch dauert.
        </p>
      ) : (
        <div className="space-y-3">
          {clusters.map((c) => (
            <div
              key={c.id}
              className="lift flex overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
            >
              <span
                className="w-1 flex-none"
                style={{ background: c.color }}
                aria-hidden="true"
              />
              <div className="px-[17px] py-4">
                <div className="mb-1.5 flex items-baseline justify-between gap-2.5">
                  <span className="text-[16px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
                    {c.title}
                  </span>
                  <span className="flex-none text-[11.5px] text-[#9a917f]">
                    {c.count} Einträge
                  </span>
                </div>
                <p
                  className="mb-2.5 text-[14px] leading-[1.5] text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: c.note }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#F1ECE0] px-[9px] py-1 text-[11px] text-[#9a917f]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
