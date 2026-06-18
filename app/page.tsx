"use client";

import { useEffect, useRef, useState } from "react";
import {
  JournalEntry,
  Mood,
  MOODS,
  createId,
  formatDate,
  loadEntries,
  saveEntries,
} from "@/lib/journal";

export default function Home() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reflectingId, setReflectingId] = useState<string | null>(null);

  // Beim Start aus dem Browser-Speicher laden.
  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  // Bei jeder Änderung speichern (erst nachdem geladen wurde).
  useEffect(() => {
    if (loaded) saveEntries(entries);
  }, [entries, loaded]);

  function addEntry() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry: JournalEntry = {
      id: createId(),
      createdAt: new Date().toISOString(),
      mood,
      text: trimmed,
    };
    setEntries((prev) => [entry, ...prev]);
    setText("");
    setMood(null);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function reflect(entry: JournalEntry) {
    setReflectingId(entry.id);
    // Reflexion leeren, damit das Streaming sichtbar von vorne beginnt.
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, reflection: "" } : e)),
    );

    try {
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: entry.text, mood: entry.mood }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Reflexion fehlgeschlagen.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, reflection: snapshot } : e,
          ),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, reflection: `[${message}]` } : e,
        ),
      );
    } finally {
      setReflectingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1
          className="text-4xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Journal Companion
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Dein ruhiger Ort zum Schreiben — mit einem einfühlsamen Begleiter,
          der dir beim Reflektieren hilft.
        </p>
      </header>

      {/* Editor */}
      <section
        className="rounded-2xl border p-5 shadow-sm"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was bewegt dich gerade?"
          rows={5}
          className="w-full resize-y rounded-lg border bg-transparent p-3 outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--border)" }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-[var(--muted)]">Stimmung:</span>
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              title={m.label}
              aria-pressed={mood === m.value}
              className="rounded-full border px-2.5 py-1 text-lg transition"
              style={{
                borderColor:
                  mood === m.value ? "var(--accent)" : "var(--border)",
                background:
                  mood === m.value ? "var(--accent)" : "transparent",
              }}
            >
              {m.value}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={addEntry}
            disabled={!text.trim()}
            className="rounded-lg px-4 py-2 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            Eintrag speichern
          </button>
        </div>
      </section>

      {/* Einträge */}
      <section className="mt-10 space-y-5">
        {loaded && entries.length === 0 && (
          <p className="py-8 text-center text-[var(--muted)]">
            Noch keine Einträge. Dein erster Gedanke ist nur ein paar Zeilen
            entfernt.
          </p>
        )}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <time className="text-sm text-[var(--muted)]">
                {entry.mood ? `${entry.mood}  ` : ""}
                {formatDate(entry.createdAt)}
              </time>
              <button
                type="button"
                onClick={() => deleteEntry(entry.id)}
                className="text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
              >
                Löschen
              </button>
            </div>

            <p className="whitespace-pre-wrap">{entry.text}</p>

            {entry.reflection !== undefined && (
              <div
                className="mt-4 rounded-lg border-l-2 p-3 text-[var(--foreground)]"
                style={{
                  borderColor: "var(--accent)",
                  background: "color-mix(in srgb, var(--accent) 7%, transparent)",
                }}
              >
                <p
                  className="mb-1 text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--accent)" }}
                >
                  Reflexion des Begleiters
                </p>
                <p className="whitespace-pre-wrap text-[15px]">
                  {entry.reflection || "…"}
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => reflect(entry)}
                disabled={reflectingId === entry.id}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"
                style={{
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                }}
              >
                {reflectingId === entry.id
                  ? "Der Begleiter denkt nach…"
                  : entry.reflection !== undefined
                    ? "Neu reflektieren"
                    : "Mit dem Begleiter reflektieren"}
              </button>
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-16 text-center text-xs text-[var(--muted)]">
        Deine Einträge bleiben lokal in diesem Browser. Nur beim Reflektieren
        wird der Text an die Claude-API gesendet.
      </footer>
    </main>
  );
}
