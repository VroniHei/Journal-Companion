import { useCallback, useState } from "react";
import { clearDraft, readDraft, writeDraft } from "../lib/draft";

/**
 * Wie `useState<string>`, aber der Wert wird laufend lokal als Entwurf gesichert
 * (localStorage, key-basiert) und beim Mount wiederhergestellt. So überlebt frei
 * geschriebener/gesprochener Text einen Tab-Verlust oder Reload, bevor daraus ein
 * echter Eintrag wird. `clear` löscht den Entwurf (nach erfolgreichem Speichern).
 */
export function useDraft(
  key: string,
  initial = "",
): readonly [string, (next: string) => void, () => void] {
  const [value, setValue] = useState<string>(() => readDraft(key, initial));

  const set = useCallback(
    (next: string) => {
      setValue(next);
      writeDraft(key, next);
    },
    [key],
  );

  const clear = useCallback(() => {
    clearDraft(key);
    setValue(initial);
  }, [key, initial]);

  return [value, set, clear] as const;
}
