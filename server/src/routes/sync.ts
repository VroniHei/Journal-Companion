import { Router } from "express";
import { z } from "zod";
import type { SyncRecord } from "@journal/shared";
import { hasSync } from "../env";
import { getSupabase, SYNC_TABLE } from "../services/supabase";

// Geräte-Sync: ein dünner Proxy auf eine Supabase-Tabelle. Geschützt ist die
// Route über dasselbe Passwort-Gate (Vercel-Middleware) wie der Rest von /api;
// die App ist Single-User, deshalb ohne zusätzliche Konten. Gemerged wird per
// Union + Last-Write-Wins: der Client zieht zuerst (pull), merged lokal und
// schickt nur Neueres zurück (push).
export const syncRouter = Router();

// `kind` ist client-kontrolliert (typisiert über SyncKind im Frontend) und der
// Server ist nur ein generischer Speicher. Bewusst KEINE feste Enum-Liste hier:
// eine neue Dexie-Tabelle hatte sonst (weil hier nicht eingetragen) den gesamten
// Push-Batch mit 400 abgelehnt und damit den kompletten Sync blockiert.
const recordSchema = z.object({
  kind: z.string().min(1).max(64),
  id: z.string().min(1),
  updatedAt: z.string().min(1),
  deleted: z.boolean().optional(),
  data: z.unknown(),
});

const pushSchema = z.object({
  records: z.array(recordSchema).max(5000),
});

// Pull: alle Datensätze (optional erst ab einem Zeitstempel) holen.
syncRouter.get("/sync/pull", async (req, res) => {
  if (!hasSync()) {
    res.status(503).json({ error: "Sync ist nicht konfiguriert." });
    return;
  }
  try {
    const supabase = getSupabase();
    const since = typeof req.query.since === "string" ? req.query.since : null;
    // Auch gelöschte Datensätze (Tombstones) zurückgeben, damit Löschungen über
    // Geräte propagieren.
    let query = supabase.from(SYNC_TABLE).select("kind, id, updated_at, deleted, data");
    if (since) query = query.gt("updated_at", since);

    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Sync-Pull fehlgeschlagen: ${error.message}` });
      return;
    }

    const records: SyncRecord[] = (data ?? []).map((row) => ({
      kind: row.kind,
      id: row.id,
      updatedAt: row.updated_at,
      deleted: Boolean(row.deleted),
      data: row.data,
    }));
    res.json({ records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Sync-Pull fehlgeschlagen: ${message}` });
  }
});

// Push: Datensätze speichern (Upsert pro (kind, id)).
syncRouter.post("/sync/push", async (req, res) => {
  if (!hasSync()) {
    res.status(503).json({ error: "Sync ist nicht konfiguriert." });
    return;
  }
  const parsed = pushSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  if (parsed.data.records.length === 0) {
    res.json({ ok: true });
    return;
  }

  try {
    const supabase = getSupabase();
    const rows = parsed.data.records.map((r) => ({
      kind: r.kind,
      id: r.id,
      updated_at: r.updatedAt,
      deleted: Boolean(r.deleted),
      data: r.data ?? {},
    }));
    const { error } = await supabase
      .from(SYNC_TABLE)
      .upsert(rows, { onConflict: "kind,id" });
    if (error) {
      res.status(502).json({ error: `Sync-Push fehlgeschlagen: ${error.message}` });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Sync-Push fehlgeschlagen: ${message}` });
  }
});
