import { Link, useNavigate } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { JournalCard } from "../components/JournalCard";
import { useEntries } from "../hooks/useData";

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

// Archiv: alle Einträge, nach Monat gruppiert (Einstieg über „Alle ansehen"
// unter „Letzte Einträge").
export function Archive() {
  const entries = useEntries();
  const navigate = useNavigate();

  const groups: { label: string; items: JournalEntry[] }[] = [];
  for (const e of entries) {
    const label = monthLabel(e.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <section className="space-y-6">
      {/* Kopf nach App-Style: Zurück + Titel + Suche. */}
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
        <h1 className="flex-1 text-[18px] font-[650] tracking-[-0.02em] text-[var(--foreground)]">
          Alle Einträge
        </h1>
        <Link
          to="/suche"
          aria-label="Suchen"
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </Link>
      </div>
      <p className="-mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
        Zeitlich gruppiert, damit auch ältere Einträge auffindbar bleiben.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Noch keine Einträge.</p>
      ) : (
        groups.map((g) => (
          <div key={g.label} className="space-y-3">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {g.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.items.map((e) => (
                <JournalCard key={e.id} entry={e} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
