import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import type { DailyRitual } from "@journal/shared";
import { Eyebrow } from "../components/ui";
import { listDailyRituals } from "../db/queries";

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Kurzer Blick auf das Gesicherte eines Tages (Morgen- und Abend-Felder).
function recap(r: DailyRitual): { label: string; value: string }[] {
  return [
    { label: "Dankbar", value: (r.gratitude ?? []).join(", ") },
    { label: "Fokus", value: r.makeGreat ?? "" },
    { label: "Dein Satz", value: r.affirmation ?? "" },
    { label: "Gutes getan", value: r.goodDeed ?? "" },
    { label: "Besser", value: r.better ?? "" },
    { label: "Momente", value: (r.goodMoments ?? []).join(", ") },
  ].filter((a) => a.value.trim().length > 0);
}

// Ritual-Verlauf: alle bisherigen Tagesrituale, neueste zuerst. Jeder Tag ist
// antippbar und öffnet genau diesen Tag zum Ansehen/Ändern.
export function RitualHistory() {
  const navigate = useNavigate();
  const rituals = useLiveQuery(() => listDailyRituals(), [], []);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => navigate("/ritual")}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <Eyebrow>Tagesritual</Eyebrow>
          <h1 className="serif mt-2 text-3xl font-semibold tracking-[-0.02em]">
            Dein <em className="g">Verlauf</em>
          </h1>
        </div>
      </div>

      {rituals.length === 0 ? (
        <p className="max-w-[420px] text-[14px] leading-relaxed text-[var(--muted)]">
          Noch keine gesicherten Rituale. Sobald du ein Tagesritual ausfüllst,
          findest du es hier wieder, zum Nachlesen oder Ergänzen.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rituals.map((r) => {
            const items = recap(r);
            return (
              <Link
                key={r.id}
                to={`/ritual?date=${r.date}`}
                className="lift flex flex-col rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[14px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
                    {dayLabel(r.date)}
                  </span>
                  <span aria-hidden="true" className="flex-none text-[var(--muted)]">
                    →
                  </span>
                </div>
                <div className="space-y-2">
                  {items.slice(0, 4).map((a) => (
                    <div key={a.label}>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a8a73]">
                        {a.label}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-[#4f4434]">
                        {a.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
