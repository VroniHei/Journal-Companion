import { useNavigate } from "react-router-dom";
import { useEntries } from "../hooks/useData";
import { themeClusters, TONE_LEGEND } from "../lib/insights";

// Roter Faden (Markenkern): wiederkehrende Themen über die letzten Wochen —
// nicht nur Wörter, sondern was sich durchzieht. Drill-in aus „Muster":
// runder Zurück-Button + Eyebrow, links Foto-Karte, rechts die Themen.
export function RedThread() {
  const navigate = useNavigate();
  const entries = useEntries();
  const clusters = themeClusters(entries);

  return (
    <section className="space-y-6">
      {/* Kopf: runder Zurück-Button + Breadcrumb/Eyebrow + Titel */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Zurück zu Muster"
          onClick={() => navigate("/muster")}
          className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Roter Faden
          </div>
          <h1 className="serif text-3xl font-semibold tracking-[-0.02em]">
            Was sich bei dir <em className="g">durchzieht</em>
          </h1>
        </div>
      </div>

      {clusters.length > 0 && (
        <p className="max-w-[640px] text-[14px] leading-relaxed text-[var(--muted)]">
          Themen, die in den letzten Wochen an mehreren Tagen wiederkehren,
          sortiert nach dem, was sich gerade am stärksten durchzieht. Die Farbe
          links zeigt, <em className="g">wie sich ein Thema anfühlt</em>: von
          schwer bis leicht.
        </p>
      )}

      {clusters.length === 0 ? (
        <p className="max-w-[420px] text-[14px] leading-relaxed text-[var(--muted)]">
          Noch kein roter Faden zu sehen. Sobald sich Themen über mehrere Einträge
          wiederholen, zeigt sich hier, was dich gerade begleitet. Auch gut, wenn
          es noch dauert.
        </p>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(320px,400px)_1fr] lg:items-start lg:gap-6">
          {/* Foto-Karte mit Overlay-Text */}
          <div
            className="relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[22px] p-6 lg:min-h-[420px]"
            style={{ boxShadow: "0 16px 40px rgba(35,34,26,.18)" }}
          >
            <img
              src="/img/zitat-weg.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "center 55%" }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg,rgba(35,34,26,.05) 0%,rgba(35,34,26,.18) 42%,rgba(35,34,26,.7) 100%)",
              }}
            />
            <p className="serif relative text-[21px] font-medium leading-[1.4] text-white">
              Was sich bei dir{" "}
              <em className="g" style={{ color: "#B4ED63" }}>
                durchzieht
              </em>
              , über die letzten Wochen. Nicht nur Wörter, sondern die Themen, die
              immer wiederkehren.
            </p>
          </div>

          {/* Themen-Karten */}
          <div className="mt-3 space-y-3 lg:mt-0">
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
                <div className="flex-1 px-[18px] py-[17px]">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2.5">
                    <span className="text-[16px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
                      {c.title}
                    </span>
                    <span className="flex-none text-[12px] text-[#9a917f]">
                      {c.count} Einträge
                    </span>
                  </div>
                  <p
                    className="mb-3 text-[14.5px] leading-[1.5] text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: c.note }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#F1ECE0] px-[11px] py-1 text-[11.5px] text-[#9a917f]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Legende: was die Randfarbe bedeutet (Grundton des Themas). */}
            <div className="flex flex-wrap items-center gap-2.5 px-1 pt-1 text-[11.5px] text-[var(--muted)]">
              <span>Grundton:</span>
              {TONE_LEGEND.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color }}
                    aria-hidden="true"
                  />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
