import type { JournalEntry } from "@journal/shared";
import { db } from "../db/dexie";
import { getSettings } from "./settings";
import { findSimilar, type FindSimilarOptions, type SimResult } from "./recall";

// Semantischer Rückblick: Eintrags-Embeddings VOLLSTÄNDIG IM BROWSER (transformers.js).
// Kein Eintragstext verlässt das Gerät; nur die Modellgewichte werden einmalig vom
// HuggingFace-CDN geladen und vom Browser gecacht. Graceful: ist das Modell nicht
// geladen oder das Feature aus, fällt alles auf das alte Recency-Verhalten zurück.

// Kleines, multilinguales Modell mit solidem Deutsch (384-dim).
const MODEL_ID = "Xenova/multilingual-e5-small";
const MAX_CHARS = 1200;

// --- Status (für ruhigen Hinweis in den Einstellungen) ---------------------

export type EmbeddingState = "idle" | "loading" | "indexing" | "ready" | "off";
export interface EmbeddingStatus {
  state: EmbeddingState;
  done: number;
  total: number;
}

let status: EmbeddingStatus = { state: "idle", done: 0, total: 0 };
const listeners = new Set<(s: EmbeddingStatus) => void>();

function setStatus(patch: Partial<EmbeddingStatus>): void {
  status = { ...status, ...patch };
  for (const l of listeners) l(status);
}

export function getEmbeddingStatus(): EmbeddingStatus {
  return status;
}

export function subscribeEmbeddingStatus(
  fn: (s: EmbeddingStatus) => void,
): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

// --- Modell (lazy) ---------------------------------------------------------

// Minimaler Typ für die feature-extraction-Pipeline (transformers.js bringt
// eigene Typen mit, die wir hier nicht statisch einbinden wollen).
type Extractor = (
  text: string,
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<Extractor> | null = null;
let modelReady = false;

export function isModelReady(): boolean {
  return modelReady;
}

async function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    setStatus({ state: "loading" });
    extractorPromise = import("@xenova/transformers").then(async (mod) => {
      // Modelle vom CDN holen (kein lokaler Modell-Ordner); Browser-Cache nutzen.
      mod.env.allowLocalModels = false;
      const pipe = (await mod.pipeline("feature-extraction", MODEL_ID, {
        quantized: true,
      })) as unknown as Extractor;
      modelReady = true;
      setStatus({ state: "ready" });
      return pipe;
    });
    extractorPromise.catch(() => {
      // Fehlgeschlagen → zurücksetzen, damit ein späterer Versuch erneut lädt.
      extractorPromise = null;
      setStatus({ state: "idle" });
    });
  }
  return extractorPromise;
}

/** Eintrag → kompakter Text fürs Embedding (Titel + Themen + Text, gekürzt). */
export function embeddingText(e: Pick<JournalEntry, "title" | "text" | "topics">): string {
  const parts = [
    e.title?.trim(),
    (e.topics ?? []).join(", "),
    e.text?.trim(),
  ].filter(Boolean);
  return parts.join("\n").slice(0, MAX_CHARS);
}

/** Embedding eines Textes (lädt das Modell bei Bedarf). Normalisiert → Cosine = Dot. */
export async function embed(text: string): Promise<number[]> {
  const pipe = await getExtractor();
  // e5-Konvention: einheitliches "query:"-Präfix für symmetrische Ähnlichkeit.
  const out = await pipe(`query: ${text}`, { pooling: "mean", normalize: true });
  return Array.from(out.data);
}

/** Wie `embed`, aber NUR wenn das Modell schon geladen ist — sonst `null`. */
export async function embedIfReady(text: string): Promise<number[] | null> {
  if (!modelReady) return null;
  try {
    return await embed(text);
  } catch {
    return null;
  }
}

// --- Persistenz / Backfill -------------------------------------------------

function needsEmbedding(
  e: JournalEntry,
  existing: { model: string; updatedAt: string } | undefined,
): boolean {
  if (e.startIntent === "tagesritual") return false; // generischer Text, wenig Signal
  if (!e.text?.trim()) return false;
  if (!existing) return true;
  return existing.model !== MODEL_ID || existing.updatedAt !== e.updatedAt;
}

/** Erzeugt/aktualisiert das Embedding eines Eintrags, falls nötig. */
export async function ensureEmbedding(e: JournalEntry): Promise<void> {
  const existing = await db.entryEmbeddings.get(e.id);
  if (!needsEmbedding(e, existing)) return;
  const vector = await embed(embeddingText(e));
  await db.entryEmbeddings.put({
    id: e.id,
    updatedAt: e.updatedAt,
    model: MODEL_ID,
    dim: vector.length,
    vector,
  });
}

function idle(): Promise<void> {
  return new Promise((resolve) => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
    }).requestIdleCallback;
    if (ric) ric(() => resolve(), { timeout: 1000 });
    else setTimeout(resolve, 50);
  });
}

let backfilling = false;

/**
 * Embeddet alle Einträge, denen ein aktuelles Embedding fehlt. Batched, gibt
 * zwischendurch an den Browser zurück (blockiert die App nie), fortsetzbar
 * (scannt jeweils neu, was fehlt). Ruhiger Fortschritt über den Status.
 */
export async function backfillEmbeddings(): Promise<void> {
  if (backfilling) return;
  backfilling = true;
  try {
    const entries = await db.entries.toArray();
    const todo: JournalEntry[] = [];
    for (const e of entries) {
      const ex = await db.entryEmbeddings.get(e.id);
      if (needsEmbedding(e, ex)) todo.push(e);
    }
    if (todo.length === 0) {
      setStatus({ state: modelReady ? "ready" : status.state, done: 0, total: 0 });
      return;
    }
    setStatus({ state: "indexing", done: 0, total: todo.length });
    for (let i = 0; i < todo.length; i++) {
      try {
        await ensureEmbedding(todo[i]);
      } catch {
        /* einzelner Fehlschlag soll den Backfill nicht stoppen */
      }
      setStatus({ done: i + 1 });
      if (i % 5 === 4) await idle();
    }
    setStatus({ state: "ready" });
  } finally {
    backfilling = false;
  }
}

/** Top-k thematisch ähnliche Einträge zu einem Referenz-Vektor (Cosine). */
export async function findSimilarEntries(
  ref: number[],
  opts: FindSimilarOptions,
): Promise<SimResult[]> {
  const all = await db.entryEmbeddings.toArray();
  return findSimilar(
    ref,
    all.map((e) => ({ id: e.id, vector: e.vector })),
    opts,
  );
}

// --- Feature-Flag + Start ---------------------------------------------------

/** Feature aktiv? Default an; nur explizit `false` schaltet ab. */
export async function isSemanticRecallEnabled(): Promise<boolean> {
  const s = await getSettings();
  return s.semanticRecall !== false;
}

/**
 * Wärmt das Modell auf (nach dem ersten Mal aus dem Browser-Cache) und zieht
 * fehlende Embeddings nach. Idempotent (memoisiertes Modell + Backfill-Guard).
 * Graceful: bei Fehler bleibt das Feature einfach aus.
 */
export async function warmSemanticRecall(): Promise<void> {
  if (!(await isSemanticRecallEnabled())) {
    setStatus({ state: "off" });
    return;
  }
  try {
    await getExtractor();
    await backfillEmbeddings();
  } catch {
    /* graceful: Recency übernimmt */
  }
}

let started = false;

/**
 * Startet den semantischen Rückblick im Hintergrund: Modell aufwärmen (nach dem
 * ersten Mal aus dem Browser-Cache) und fehlende Embeddings nachziehen — alles
 * im Idle, damit die App nie blockiert. Reagiert zusätzlich auf Daten-Änderungen
 * (neue/aktualisierte Einträge) mit einem entzerrten Backfill.
 */
export function startSemanticRecall(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  // Erst im Idle starten — nicht im kritischen Startpfad.
  void idle().then(() => warmSemanticRecall());

  let timer: number | undefined;
  window.addEventListener("innerline:data-changed", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void (async () => {
        if (await isSemanticRecallEnabled()) void backfillEmbeddings();
      })();
    }, 4000);
  });
}

export { MODEL_ID };
