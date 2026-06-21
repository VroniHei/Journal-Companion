import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { JournalCard } from "../components/JournalCard";
import { useEntries } from "../hooks/useData";
import { entryTitle } from "../lib/entryCard";

export function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const entries = useEntries();


  const term = query.trim().toLowerCase();
  const results = term
    ? entries.filter(
        (e) =>
          e.text.toLowerCase().includes(term) ||
          entryTitle(e).toLowerCase().includes(term) ||
          e.topics.some((t) => t.toLowerCase().includes(term)) ||
          e.emotions.some((t) => t.toLowerCase().includes(term)),
      )
    : [];

  function onChange(v: string) {
    setQuery(v);
    setParams(v ? { q: v } : {}, { replace: true });
  }

  return (
    <section className="space-y-5">
      <h1 className="serif text-3xl font-semibold">Suche</h1>

      <label className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Einträge durchsuchen…"
          autoFocus
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      {term && (
        <p className="text-sm text-[var(--muted)]">
          {results.length === 0
            ? "Keine Treffer."
            : `${results.length} Treffer`}
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((e) => (
            <JournalCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </section>
  );
}
