export type Mood = "🙂" | "😌" | "😐" | "😔" | "😣" | "🤩";

export const MOODS: { value: Mood; label: string }[] = [
  { value: "🤩", label: "begeistert" },
  { value: "🙂", label: "gut" },
  { value: "😌", label: "ruhig" },
  { value: "😐", label: "neutral" },
  { value: "😔", label: "niedergeschlagen" },
  { value: "😣", label: "angespannt" },
];

export type JournalEntry = {
  id: string;
  createdAt: string; // ISO timestamp
  mood: Mood | null;
  text: string;
  reflection?: string; // Claudes Reflexion, falls angefragt
};

const STORAGE_KEY = "journal-companion.entries.v1";

export function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
