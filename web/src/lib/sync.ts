import type { Table } from "dexie";
import type { SyncKind, SyncRecord } from "@journal/shared";
import { db, type Tombstone } from "../db/dexie";
import { getConfig, pullSync, pushSync } from "./apiClient";

// Geräte-Sync (Client-Seite).
//
// Ablauf bei jeder Synchronisation:
//   1. pull   — alle Server-Datensätze holen
//   2. merge  — Server → Dexie, wo der Server neuer ist (oder lokal fehlt)
//   3. push   — lokale Datensätze, die neuer sind (oder remote fehlen), hochladen
//
// Vergleich per ISO-Zeitstempel (lexikografisch = chronologisch). Konflikte
// werden per Last-Write-Wins aufgelöst. Bewusst NICHT synchronisiert werden die
// Einstellungen (geräte-spezifisch, z.B. Stimme).
//
// Bekannte Grenze (v1): Löschungen werden noch nicht über Geräte propagiert —
// ein auf Gerät A gelöschter Eintrag kommt bei der nächsten Synchronisation von
// Gerät B zurück. Union sorgt dafür, dass keine Einträge verloren gehen.

interface SyncTable {
  kind: SyncKind;
  table: Table<{ id: string }, string>;
  /** Versions-Zeitstempel eines Datensatzes (updatedAt bzw. createdAt). */
  version: (row: Record<string, unknown>) => string;
}

const SYNC_TABLES: SyncTable[] = [
  {
    kind: "entries",
    table: db.entries as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.updatedAt ?? r.createdAt ?? ""),
  },
  {
    kind: "chatMessages",
    table: db.chatMessages as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.createdAt ?? ""),
  },
  {
    kind: "patternSummaries",
    table: db.patternSummaries as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.createdAt ?? ""),
  },
  {
    kind: "stabilityMoments",
    table: db.stabilityMoments as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.createdAt ?? ""),
  },
  {
    kind: "patternInsights",
    table: db.patternInsights as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.updatedAt ?? r.createdAt ?? ""),
  },
  {
    kind: "openLoops",
    table: db.openLoops as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.updatedAt ?? r.createdAt ?? ""),
  },
  {
    kind: "decisions",
    table: db.decisions as unknown as Table<{ id: string }, string>,
    version: (r) => String(r.updatedAt ?? r.createdAt ?? ""),
  },
];

// --- Status-Store (für UI) -----------------------------------------------

export type SyncState = "off" | "idle" | "syncing" | "error";

export interface SyncStatus {
  state: SyncState;
  lastSync: string | null;
  error: string | null;
}

let status: SyncStatus = { state: "off", lastSync: null, error: null };
const listeners = new Set<(s: SyncStatus) => void>();

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSync(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const fn of listeners) fn(status);
}

// --- Sync-Logik -----------------------------------------------------------

let enabled = false;
let running = false;
let pending = false;

/** Einmal prüfen, ob der Server Sync anbietet. */
async function ensureEnabled(): Promise<boolean> {
  if (enabled) return true;
  const cfg = await getConfig();
  enabled = cfg.hasSync;
  if (enabled && status.state === "off") setStatus({ state: "idle" });
  return enabled;
}

/**
 * Eine vollständige Synchronisation. Mehrfachaufrufe während eines Laufs werden
 * zu einem nachgelagerten Lauf zusammengefasst (kein paralleler Sync).
 */
export async function syncNow(): Promise<void> {
  if (!(await ensureEnabled())) return;
  if (running) {
    pending = true;
    return;
  }
  running = true;
  setStatus({ state: "syncing", error: null });

  try {
    const remote = await pullSync();
    const remoteMap = new Map<string, SyncRecord>();
    for (const r of remote) remoteMap.set(`${r.kind}:${r.id}`, r);

    // Lokale Lösch-Marker laden.
    const tombMap = new Map<string, Tombstone>();
    for (const t of await db.tombstones.toArray()) tombMap.set(t.id, t);

    const tableByKind = new Map(SYNC_TABLES.map((t) => [t.kind, t]));

    // 1) Server → lokal (Last-Write-Wins, inkl. Löschungen)
    for (const rec of remote) {
      const t = tableByKind.get(rec.kind);
      if (!t) continue;
      const key = `${rec.kind}:${rec.id}`;
      const localTomb = tombMap.get(key);
      const local = (await t.table.get(rec.id)) as
        | Record<string, unknown>
        | undefined;
      const localV = local ? t.version(local) : null;

      if (rec.deleted) {
        // Server kennt eine Löschung — anwenden, außer eine neuere lokale
        // Bearbeitung steht dagegen.
        if (localV !== null && localV > rec.updatedAt) continue;
        if (local) await t.table.delete(rec.id);
        if (!localTomb || rec.updatedAt > localTomb.updatedAt) {
          const tomb: Tombstone = {
            id: key,
            kind: rec.kind,
            recordId: rec.id,
            updatedAt: rec.updatedAt,
          };
          await db.tombstones.put(tomb);
          tombMap.set(key, tomb);
        }
      } else {
        // Server hat einen lebenden Datensatz.
        if (localTomb && localTomb.updatedAt >= rec.updatedAt) continue; // lokale Löschung gewinnt
        if (localV === null || rec.updatedAt > localV) {
          await t.table.put(rec.data as { id: string });
          if (localTomb) {
            // Datensatz wurde wiederbelebt → Lösch-Marker aufheben.
            await db.tombstones.delete(key);
            tombMap.delete(key);
          }
        }
      }
    }

    // 2) lokal → Server (lebende Datensätze)
    const toPush: SyncRecord[] = [];
    for (const t of SYNC_TABLES) {
      const all = (await t.table.toArray()) as Record<string, unknown>[];
      for (const row of all) {
        const id = String(row.id);
        const v = t.version(row);
        const r = remoteMap.get(`${t.kind}:${id}`);
        if (!r || r.deleted || v > r.updatedAt) {
          toPush.push({ kind: t.kind, id, updatedAt: v, deleted: false, data: row });
        }
      }
    }
    // Lösch-Marker hochladen, wo der Server die Löschung noch nicht (aktuell) kennt.
    for (const tomb of tombMap.values()) {
      const r = remoteMap.get(tomb.id);
      const serverKnows = r && r.deleted && r.updatedAt >= tomb.updatedAt;
      if (!serverKnows) {
        toPush.push({
          kind: tomb.kind,
          id: tomb.recordId,
          updatedAt: tomb.updatedAt,
          deleted: true,
          data: {},
        });
      }
    }
    await pushSync(toPush);

    setStatus({ state: "idle", lastSync: new Date().toISOString(), error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    setStatus({ state: "error", error: message });
  } finally {
    running = false;
    if (pending) {
      pending = false;
      void syncNow();
    }
  }
}

let started = false;

/** Startet den Sync-Lebenszyklus: initial, periodisch und bei Fenster-Fokus. */
export function startSync(): void {
  if (started) return;
  started = true;

  void syncNow();
  // Periodisch, damit zwei offene Geräte zueinanderfinden.
  setInterval(() => void syncNow(), 30_000);
  // Beim Zurückkehren in den Tab sofort abgleichen.
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void syncNow();
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("focus", () => void syncNow());
    // Lokale Änderungen zügig hochladen (kurz entprellt).
    window.addEventListener("innerline:data-changed", () => void scheduleSync());
  }
}

let scheduleTimer: ReturnType<typeof setTimeout> | null = null;

/** Entprellter Sync nach einer lokalen Änderung. */
export function scheduleSync(): void {
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => void syncNow(), 1500);
}

/** Signalisiert eine lokale Datenänderung (löst entprellten Sync aus). */
export function notifyDataChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("innerline:data-changed"));
  }
}
