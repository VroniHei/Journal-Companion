// Kontaktimpuls-Schutzraum: Entwürfe lokal „in Quarantäne" legen, mit Wartezeit
// vor dem nächsten Prüfen. Reiner UI-/Schutz-Mechanismus → localStorage.

export interface ContactDraft {
  id: string;
  text: string;
  createdAt: string; // ISO
  recheckAt: string; // ISO — frühestens dann erneut prüfen
}

const KEY = "journal-companion.contactDrafts";

function read(): ContactDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ContactDraft[]) : [];
  } catch {
    return [];
  }
}

function write(list: ContactDraft[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignorieren */
  }
}

export function listDrafts(): ContactDraft[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addDraft(text: string, recheckMinutes: number): ContactDraft {
  const now = new Date();
  const draft: ContactDraft = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(now.getTime()),
    text,
    createdAt: now.toISOString(),
    recheckAt: new Date(now.getTime() + recheckMinutes * 60_000).toISOString(),
  };
  write([draft, ...read()]);
  return draft;
}

/** „Morgen prüfen": Recheck-Zeit auf morgen früh (09:00) setzen. */
export function minutesUntilTomorrowMorning(): number {
  const now = new Date();
  const t = new Date(now);
  t.setDate(now.getDate() + 1);
  t.setHours(9, 0, 0, 0);
  return Math.max(20, Math.round((t.getTime() - now.getTime()) / 60_000));
}

export function removeDraft(id: string): void {
  write(read().filter((d) => d.id !== id));
}

export function isReady(draft: ContactDraft): boolean {
  return new Date().toISOString() >= draft.recheckAt;
}
