import { useState } from "react";
import { Link } from "react-router-dom";
import type { Decision, OpenLoop } from "@journal/shared";
import { Button, Card, Eyebrow } from "../components/ui";
import { DictationButton } from "../components/DictationButton";
import { useDecisions, useOpenLoops } from "../hooks/useData";
import {
  createDecision,
  createOpenLoop,
  deleteDecision,
  deleteOpenLoop,
  reopenDecision,
  reopenOpenLoop,
  resolveOpenLoop,
  reviewDecision,
} from "../db/queries";
import { formatShort } from "../lib/format";

type Tab = "schleifen" | "entscheidungen";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const areaClass =
  "w-full resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]";

// ===== Offene Schleifen =====================================================

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
        <span className="shrink-0 text-[13px] text-[var(--muted)]">
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
            className={areaClass}
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

function LoopsSection() {
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
    <div className="space-y-6">
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
          className={inputClass}
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Notiz (optional)"
          className={areaClass}
        />
        <div className="flex items-center justify-between gap-3">
          <Button onClick={add} disabled={!title.trim()}>
            Festhalten
          </Button>
          <DictationButton value={note} onChange={setNote} />
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
    </div>
  );
}

// ===== Entscheidungs-Rückblick ==============================================

function feltBadge(d: Decision) {
  if (d.feltRight === true)
    return { label: "stimmig", bg: "var(--accent-soft)", color: "var(--accent-text)" };
  if (d.feltRight === false)
    return { label: "eher nicht", bg: "var(--surface-2)", color: "var(--clay,#8a4f2a)" };
  return { label: "reflektiert", bg: "var(--surface-2)", color: "var(--muted)" };
}

function DecisionCard({ d }: { d: Decision }) {
  const open = d.status === "offen";
  const [reviewing, setReviewing] = useState(false);
  const [note, setNote] = useState("");

  async function review(feltRight: boolean) {
    await reviewDecision(d.id, { feltRight, reviewNote: note });
    setReviewing(false);
    setNote("");
  }

  const badge = feltBadge(d);

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-medium leading-snug">{d.question}</h3>
        <span className="shrink-0 text-[13px] text-[var(--muted)]">
          {formatShort(d.createdAt)}
        </span>
      </div>

      <div className="space-y-1 text-sm text-[var(--muted)]">
        {d.leaning && (
          <p>
            <span className="text-[var(--foreground)]">Neigung:</span> {d.leaning}
          </p>
        )}
        {d.expectation && (
          <p>
            <span className="text-[var(--foreground)]">Erwartung:</span>{" "}
            {d.expectation}
          </p>
        )}
        <p>
          <span className="text-[var(--foreground)]">Gefühl damals:</span>{" "}
          {d.feeling}/10
        </p>
      </div>

      {!open && (
        <div className="space-y-2">
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-medium"
            style={{ background: badge.bg, color: badge.color }}
          >
            Rückblick: {badge.label}
          </span>
          {d.reviewNote && (
            <p className="rounded-lg border-l-2 border-l-[var(--accent)] bg-[var(--surface-2)] p-3 text-sm">
              {d.reviewNote}
            </p>
          )}
        </div>
      )}

      {open && reviewing && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Wie fühlt es sich heute an? (optional)"
            className={areaClass}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => review(true)}>War stimmig</Button>
            <Button variant="ghost" onClick={() => review(false)}>
              Eher nicht
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setReviewing(false);
                setNote("");
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {!(open && reviewing) && (
        <div className="flex flex-wrap items-center gap-3">
          {open ? (
            <Button variant="ghost" onClick={() => setReviewing(true)}>
              Rückblick
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => reopenDecision(d.id)}>
              Wieder öffnen
            </Button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Diese Entscheidung wirklich löschen?"))
                deleteDecision(d.id);
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

function DecisionsSection() {
  const decisions = useDecisions();
  const [question, setQuestion] = useState("");
  const [leaning, setLeaning] = useState("");
  const [expectation, setExpectation] = useState("");
  const [feeling, setFeeling] = useState(5);

  const open = decisions.filter((d) => d.status === "offen");
  const done = decisions.filter((d) => d.status === "reflektiert");

  async function add() {
    if (!question.trim()) return;
    await createDecision({ question, leaning, expectation, feeling });
    setQuestion("");
    setLeaning("");
    setExpectation("");
    setFeeling(5);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Welche Entscheidung steht an? (z.B. Soll ich …)"
          className={inputClass}
        />
        <div className="flex justify-end">
          <DictationButton value={question} onChange={setQuestion} />
        </div>
        <input
          value={leaning}
          onChange={(e) => setLeaning(e.target.value)}
          placeholder="Wozu neigst du gerade? (optional)"
          className={inputClass}
        />
        <input
          value={expectation}
          onChange={(e) => setExpectation(e.target.value)}
          placeholder="Was erwartest oder erhoffst du? (optional)"
          className={inputClass}
        />
        <div>
          <label className="mb-1.5 flex items-center justify-between text-sm">
            <span>Wie stimmig fühlt es sich gerade an?</span>
            <span className="font-medium tabular-nums">{feeling}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={feeling}
            onChange={(e) => setFeeling(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>
        <div>
          <Button onClick={add} disabled={!question.trim()}>
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
            Keine offene Entscheidung festgehalten.
          </p>
        ) : (
          open.map((d) => <DecisionCard key={d.id} d={d} />)
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--muted)]">
            Im Rückblick · {done.length}
          </h2>
          {done.slice(0, 20).map((d) => (
            <DecisionCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Seite ================================================================

export function Clarity() {
  const [tab, setTab] = useState<Tab>("schleifen");

  const TABS: { key: Tab; label: string }[] = [
    { key: "schleifen", label: "Offene Schleifen" },
    { key: "entscheidungen", label: "Entscheidungen" },
  ];

  const loosenLink = (
    <Link
      to="/schleife"
      className="lift flex items-center justify-between gap-3 rounded-[18px] border px-5 py-4"
      style={{
        background: "linear-gradient(135deg,#F1ECF8,#F4F0EC)",
        borderColor: "rgba(203,190,244,.5)",
      }}
    >
      <div>
        <div className="text-[15px] font-[650] tracking-[-0.01em] text-[var(--foreground)]">
          Dreht sich ein Gedanke?
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-[var(--muted)]">
          In drei ruhigen Schritten <em className="g">auseinandernehmen</em>.
        </p>
      </div>
      <span aria-hidden="true" className="flex-none text-[#7a6b96]">
        →
      </span>
    </Link>
  );

  // Bottom-CTA (Navigationskarte §00): direkter Weg in die Gedankenschleife
  // (Screen 09), zusätzlich zum FAB. Steht am Ende des Schleifen-Bereichs.
  const loosenButton = (
    <Link
      to="/schleife"
      className="lift flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold text-[#5a4f6e]"
      style={{
        background: "linear-gradient(135deg,#EDE6F6,#E3DAF2)",
        border: "1px solid rgba(157,139,201,.32)",
      }}
    >
      Neue Schleife lösen
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
        <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
      </svg>
    </Link>
  );

  return (
    <section className="space-y-6">
      <div>
        <Eyebrow>Klärung</Eyebrow>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-[-0.02em]">
          Erst <em className="g">sortieren</em>, dann entscheiden
        </h1>
      </div>

      {/* Mobile: Tab-Umschalter; Desktop: beide Spalten als Bento. */}
      <div
        role="tablist"
        aria-label="Bereich wählen"
        className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 lg:hidden"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center rounded-full px-3 py-2 text-sm transition ${
                active
                  ? "bg-[var(--surface)] font-semibold text-[var(--foreground)] shadow-[var(--shadow-card)]"
                  : "font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Mobile-Ansicht (aktiver Tab) */}
      <div className="space-y-6 lg:hidden">
        {tab === "schleifen" && loosenLink}
        {tab === "schleifen" ? <LoopsSection /> : <DecisionsSection />}
        {tab === "schleifen" && loosenButton}
      </div>

      {/* Desktop-Bento: Offene Schleifen | Entscheidungen */}
      <div className="hidden gap-[18px] lg:grid lg:grid-cols-2">
        <div className="space-y-5">
          <Eyebrow>Offene Schleifen</Eyebrow>
          {loosenLink}
          <LoopsSection />
          {loosenButton}
        </div>
        <div className="space-y-5">
          <Eyebrow>Entscheidungen</Eyebrow>
          <DecisionsSection />
        </div>
      </div>
    </section>
  );
}
