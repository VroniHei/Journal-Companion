import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

// Ein einzelner Supabase-Client (Service-Role) für den Geräte-Sync. Lazy, damit
// der Server auch ohne konfigurierten Sync startet. Der Service-Key umgeht RLS;
// er bleibt ausschließlich hier im Backend.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

// Tabellenname für alle synchronisierten Datensätze (ein generischer Speicher).
export const SYNC_TABLE = "sync_records";
