import { useLiveQuery } from "dexie-react-hooks";
import type { JournalEntry } from "@journal/shared";
import { JournalCard } from "../components/JournalCard";
import { useEntries } from "../hooks/useData";
import { listStabilityMoments } from "../db/queries";

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
  const moments = useLiveQuery(() => listStabilityMoments(), [], []);

  const closedIds = new Set<string>();
  for (const m of moments) {
    if (m.kind === "abschluss" && m.entryId) closedIds.add(m.entryId);
  }

  const groups: { label: string; items: JournalEntry[] }[] = [];
  for (const e of entries) {
    const label = monthLabel(e.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Archiv</h1>
        <p className="mt-1 text-[var(--muted)]">
          Alle Einträge, nach Zeit geordnet.
        </p>
      </div>

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
                <JournalCard key={e.id} entry={e} closedIds={closedIds} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
