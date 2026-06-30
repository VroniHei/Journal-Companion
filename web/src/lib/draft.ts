// Lokale Entwurfs-Sicherung (localStorage). Schützt frei geschriebenen/
// gesprochenen Text vor Verlust bei Tab-Schließen, Reload oder Absturz —
// bevor daraus ein echter Eintrag wird. Bewusst getrennt von Dexie (kein
// halbfertiger Eintrag), reiner UI-Zwischenspeicher. Pure Funktionen, damit
// testbar; der React-Wrapper liegt in hooks/useDraft.ts.

const PREFIX = "innerline.draft.";

/** Liest einen Entwurf; `fallback`, wenn keiner da oder localStorage blockiert. */
export function readDraft(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Speichert einen Entwurf; leerer/whitespace-Text entfernt ihn (kein Müll). */
export function writeDraft(key: string, value: string): void {
  try {
    if (value.trim()) localStorage.setItem(PREFIX + key, value);
    else localStorage.removeItem(PREFIX + key);
  } catch {
    /* localStorage nicht verfügbar — Entwurf ist dann nur flüchtig. */
  }
}

/** Entfernt einen Entwurf (z. B. nachdem daraus ein echter Eintrag wurde). */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignorieren */
  }
}
