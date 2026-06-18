import type { StartIntent } from "@journal/shared";

export interface IntentOption {
  intent: StartIntent;
  label: string;
}

// Startscreen „Was brauchst du gerade?" — Reihenfolge = Anzeige.
export const INTENT_OPTIONS: IntentOption[] = [
  { intent: "schreiben", label: "Ich will einfach schreiben" },
  { intent: "schleife", label: "Ich hänge in einer Schleife" },
  { intent: "ihm-schreiben", label: "Ich will ihm schreiben" },
  { intent: "beruhigung", label: "Ich brauche Beruhigung" },
  { intent: "spiegel", label: "Ich brauche einen klaren Spiegel" },
  { intent: "abend-abschliessen", label: "Ich will den Abend abschließen" },
  { intent: "tag-sortieren", label: "Ich will meinen Tag sortieren" },
];

export function intentLabel(intent?: StartIntent): string | undefined {
  return INTENT_OPTIONS.find((o) => o.intent === intent)?.label;
}

export function isStartIntent(value: string | null): value is StartIntent {
  return INTENT_OPTIONS.some((o) => o.intent === value);
}
