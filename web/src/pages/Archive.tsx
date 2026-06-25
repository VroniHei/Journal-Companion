import { useState } from "react";
import { Link } from "react-router-dom";
import type { JournalEntry } from "@journal/shared";
import { JournalCard } from "../components/JournalCard";
import { Eyebrow } from "../components/ui";
import { entryKind, entryTitle, KIND_DOT, type EntryKind } from "../lib/entryCard";
import { useEntries } from "../hooks/useData";

type Filter = "alle" | EntryKind;

function previewLine(e: JournalEntry): string {
  const base = e.entrySummary?.trim() || e.text.trim();
  return base.split("\n")[0]?.trim() ?? "";
}

function rowDate(iso: string, mode: "weekday" | "date"): string {
  const d = new Date(iso);
  return mode === "weekday"
    ? d.toLocaleDateString("de-DE", { weekday: "short" })
    : d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

// Kompakte Zeilen-Liste (Mobile, Master): Punkt + Titel + eine Vorschauzeile +
// Datum/Tag rechts. Desktop nutzt weiter die JournalCard-Kacheln.
function CompactRow({ e, dateMode }: { e: JournalEntry; dateMode: "weekday" | "date" }) {
  const prev = previewLine(e);
  return (
    <Link
      to={`/eintrag/${e.id}`}
      className="flex items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)]"
    >
      <span
        className="h-[11px] w-[11px] flex-none rounded-full"
        style={{ background: KIND_DOT[entryKind(e)] }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
          {entryTitle(e)}
        </div>
        {prev && (
          <div className="mt-px truncate text-[13px] text-[#9a917f]">{prev}</div>
        )}
      </div>
      <span className="flex-none text-[13px] text-[#9a917f]">
        {rowDate(e.createdAt, dateMode)}
      </span>
    </Link>
  );
}

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
  // Jahr immer mit — sonst verschmelzen gleiche Monate verschiedener Jahre
  // (z.B. „Dezember" 2025 + 2024) zu einer Gruppe.
  return new Date(iso).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

// Archiv: alle Einträge, relativ gruppiert (Diese Woche · Letzte Woche · Frühere
// Monate). Pro Gruppe max. 3 Karten + „Alle N ansehen". Desktop nutzt die volle
// Breite als mehrspaltiges Raster (App-Style: Desktop ist kein verkleinertes Mobile).
export function Archive() {
  const entries = useEntries();
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

  function Group({
    id,
    label,
    items,
    dateMode,
  }: {
    id: string;
    label: string;
    items: JournalEntry[];
    dateMode: "weekday" | "date";
  }) {
    if (items.length === 0) return null;
    const isOpen = expanded.has(id);
    const visible = isOpen ? items : items.slice(0, 3);
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {label}
          </h2>
          <span className="text-[13px] text-[#9a917f]">
            {items.length} {items.length === 1 ? "Eintrag" : "Einträge"}
          </span>
        </div>
        {/* Mobile: kompakte Zeilen */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {visible.map((e) => (
            <CompactRow key={e.id} e={e} dateMode={dateMode} />
          ))}
        </div>
        {/* Desktop: Karten-Raster */}
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <JournalCard key={e.id} entry={e} />
          ))}
        </div>
        {items.length > 3 && (
          <button
            type="button"
            onClick={() => toggle(id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2.5 text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)] sm:ml-auto sm:w-auto sm:rounded-full sm:bg-[var(--surface)] sm:px-4 sm:py-2 sm:shadow-[var(--shadow-card)]"
          >
            {isOpen ? "Weniger" : `Alle ${items.length} ansehen`}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-7">
      {/* Kopf: Suche rechts (Zurück liegt zentral in der Topbar). */}
      <div className="flex items-center justify-end">
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
          <h1 className="serif mt-3 text-3xl font-semibold tracking-[-0.02em]">
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
                className="inline-flex min-h-[40px] items-center rounded-full px-3.5 py-1.5 text-[13px] transition"
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
          <Group id="diese-woche" label="Diese Woche" items={thisWeek} dateMode="weekday" />
          <Group id="letzte-woche" label="Letzte Woche" items={lastWeek} dateMode="date" />

          {months.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
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
                        <>
                          <div className="flex flex-col gap-2.5 sm:hidden">
                            {m.items.map((e) => (
                              <CompactRow key={e.id} e={e} dateMode="date" />
                            ))}
                          </div>
                          <div className="hidden space-y-4 sm:block">
                            {m.items.map((e) => (
                              <JournalCard key={e.id} entry={e} />
                            ))}
                          </div>
                        </>
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
