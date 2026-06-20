import { postTitle } from "./apiClient";
import { updateEntry } from "../db/queries";

/**
 * Erzeugt für einen Eintrag einen KI-Titel und speichert ihn (im Hintergrund).
 * Schlägt der Aufruf fehl (kein Key, offline), bleibt es beim heuristischen
 * Fallback aus dem Text — kein Fehler für die Nutzerin.
 */
export async function generateTitleFor(id: string, text: string): Promise<void> {
  const title = await postTitle(text);
  if (title) await updateEntry(id, { title });
}
