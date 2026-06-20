import { useState } from "react";
import type { OpenLoop } from "@journal/shared";
import { Button, Card } from "../components/ui";
import { useOpenLoops } from "../hooks/useData";
import {
  createOpenLoop,
  deleteOpenLoop,
  reopenOpenLoop,
  resolveOpenLoop,
} from "../db/queries";
import { formatShort } from "../lib/format";

function LoopCard({ loop }: { loop: OpenLoop }) {
  const open = loop.status === "offen";
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState("");

  async function resolve() {
    await resolveOpenLoop(loop.id, note);
    setResolving(false);
    setNote("");
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug">{loop.title}</h3>
          {loop.note && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">
              {loop.note}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-[var(--muted)]">
          {formatShort(loop.createdAt)}
        </span>
      </div>

      {!open && loop.resolutionNote && (
        <p className="rounded-lg border-l-2 border-l-[var(--accent)] bg-[var(--surface-2)] p-3 text-sm">
          Geklärt: {loop.resolutionNote}
        </p>
      )}

      {open && resolving && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Wie hat es sich geklärt? (optional)"
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={resolve}>Als geklärt ablegen</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setResolving(false);
                setNote("");
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {!(open && resolving) && (
        <div className="flex flex-wrap items-center gap-3">
          {open ? (
            <Button variant="ghost" onClick={() => setResolving(true)}>
              Geklärt
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => reopenOpenLoop(loop.id)}>
              Wieder öffnen
            </Button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Diese Schleife wirklich löschen?"))
                deleteOpenLoop(loop.id);
            }}
            className="text-sm text-[var(--danger)] hover:underline"
          >
            Löschen
          </button>
        </div>
      )}
    </Card>
  );
}

export function Clarity() {
  const loops = useOpenLoops();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const open = loops.filter((l) => l.status === "offen");
  const done = loops.filter((l) => l.status === "geklärt");

  async function add() {
    if (!title.trim()) return;
    await createOpenLoop({ title, note });
    setTitle("");
    setNote("");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">Klärung</h1>
        <p className="mt-1 text-[var(--muted)]">
          Offene Schleifen, die gerade Kopf-Raum belegen — festhalten, damit sie
          nicht im Kreis laufen. Kein To-do-Druck.
        </p>
      </div>

      <Card className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Was ist gerade offen? (z.B. Warte auf Antwort von …)"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Notiz (optional)"
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <div>
          <Button onClick={add} disabled={!title.trim()}>
            Festhalten
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">
          Offen{open.length ? ` · ${open.length}` : ""}
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Gerade nichts Offenes. Schön.
          </p>
        ) : (
          open.map((l) => <LoopCard key={l.id} loop={l} />)
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            Geklärt · {done.length}
          </h2>
          {done.slice(0, 20).map((l) => (
            <LoopCard key={l.id} loop={l} />
          ))}
        </div>
      )}
    </section>
  );
}
