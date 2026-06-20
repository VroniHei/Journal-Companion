import { useSyncExternalStore } from "react";
import { getSyncStatus, subscribeSync, type SyncStatus } from "../lib/sync";

/** Reaktiver Zugriff auf den aktuellen Sync-Status (für die UI). */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);
}
