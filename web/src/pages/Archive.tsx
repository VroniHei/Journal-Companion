import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { JournalCard } from "../components/JournalCard";
import { Eyebrow } from "../components/ui";
import { entryKind, type EntryKind } from "../lib/entryCard";
import { useEntries } from "../hooks/useData";

type Filter = "alle" | EntryKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "ritual", label: "Tagesritual" },
  { key: "eintrag", label: "Eintrag" },
  { key: "reflexion", label: "Reflexion" },
  { key: "gespraech", label: "Gespräch" },
];

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Montag = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { month: "long" });
}

// Archiv: alle Einträge, relativ gruppiert (Diese Woche · Letzte Woche · Frühere
// Monate). Pro Gruppe max. 3 Karten + „Alle N ansehen". Desktop nutzt die volle
// Breite als mehrspaltiges Raster (App-Style: Desktop ist kein verkleinertes Mobile).
export function Archive() {
  const entries = useEntries();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("alle");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const shown =
    filter === "alle"
      ? entries
      : entries.filter((e) => entryKind(e) === filter);

  const now = new Date();
  const thisWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = thisWeekStart - 7 * 86_400_000;

  const thisWeek: JournalEntry[] = [];
  const lastWeek: JournalEntry[] = [];
  const earlier: JournalEntry[] = [];
  for (const e of shown) {
    const t = new Date(e.createdAt).getTime();
    if (t >= thisWeekStart) thisWeek.push(e);
    else if (t >= lastWeekStart) lastWeek.push(e);
    else earlier.push(e);
  }

  // Frühere Monate: kompakt nach Monat zusammenfassen.
  const months: { label: string; items: JournalEntry[] }[] = [];
  for (const e of earlier) {
    const label = monthLabel(e.createdAt);
    const last = months[months.length - 1];
    if (last && last.label === label) last.items.push(e);
    else months.push({ label, items: [e] });
  }

  function Group({ id, label, items }: { id: string; label: string; items: JournalEntry[] }) {
    if (items.length === 0) return null;
    const isOpen = expanded.has(id);
    const visible = isOpen ? items : items.slice(0, 3);
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {label}
          </h2>
          <span className="text-[12px] text-[#9a917f]">
            {items.length} {items.length === 1 ? "Eintrag" : "Einträge"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <JournalCard key={e.id} entry={e} />
          ))}
        </div>
        {items.length > 3 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toggle(id)}
              className="lift inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--foreground)] shadow-[var(--shadow-card)]"
            >
              {isOpen ? "Weniger" : `Alle ${items.length} ansehen`}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-7">
      {/* Kopf: Zurück + Suche. */}
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
        <div className="flex-1" />
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

      {/* Titel + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Archiv</Eyebrow>
          <h1 className="serif mt-2 text-3xl font-semibold tracking-[-0.02em]">
            Alle <em className="g">Einträge</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="rounded-full px-3.5 py-1.5 text-[13px] transition"
                style={{
                  background: active ? "var(--sand)" : "transparent",
                  border: `1px solid ${active ? "transparent" : "var(--border)"}`,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--foreground)" : "var(--muted)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          {filter === "alle"
            ? "Noch keine Einträge."
            : "In dieser Kategorie ist noch nichts."}
        </p>
      ) : (
        <div className="space-y-8">
          <Group id="diese-woche" label="Diese Woche" items={thisWeek} />
          <Group id="letzte-woche" label="Letzte Woche" items={lastWeek} />

          {months.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Frühere Monate
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {months.map((m) => {
                  const id = `monat-${m.label}`;
                  const isOpen = expanded.has(id);
                  return (
                    <div key={id} className="space-y-3">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="lift flex w-full items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left shadow-[var(--shadow-card)]"
                      >
                        <span className="text-[15px] font-[600] text-[var(--foreground)]">
                          {m.label}
                        </span>
                        <span className="flex items-center gap-2 text-[13px] text-[#9a917f]">
                          {m.items.length}
                          <span aria-hidden="true">{isOpen ? "↑" : "→"}</span>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="space-y-4">
                          {m.items.map((e) => (
                            <JournalCard key={e.id} entry={e} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
