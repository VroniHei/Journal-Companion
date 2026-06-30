import { useEffect, useState } from "react";
import { getConfig } from "../lib/apiClient";

export interface BackendConfig {
  hasApiKey: boolean;
  hasTts: boolean;
  hasStt: boolean;
  hasSync: boolean;
}

/**
 * Einmaliger Abruf der Backend-Konfiguration (ob API-Key/Stimme/Sync da sind),
 * ohne den Key selbst zu kennen. `null`, solange noch geladen wird — so lässt
 * sich ein Hinweis erst zeigen, wenn der Zustand wirklich bekannt ist (kein
 * Aufblitzen). Quelle ist `/api/config`.
 */
export function useConfig(): BackendConfig | null {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  useEffect(() => {
    let alive = true;
    getConfig()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .catch(() => {
        /* getConfig fängt Fehler selbst ab; Defensive für den Fall der Fälle. */
      });
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
