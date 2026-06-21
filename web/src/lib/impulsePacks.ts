// Kuratierte Schreib-Impulse nach Thema („Impuls-Pakete"). Das zum Onboarding-
// Fokus passende Paket wird oben hervorgehoben; der Rest ist frei wählbar.
// Impulse in Vronis Stimme: offene Fragen, kein Coaching-Ton, keine Em-Dashes.

export type ImpulseIcon = "sort" | "moon" | "compass" | "wave" | "heart" | "pen";

export interface ImpulsePack {
  id: string;
  /** Passt zu diesem Onboarding-Fokus (aus FOCUS_OPTIONS), falls vorhanden. */
  focus?: string;
  name: string;
  subtitle: string;
  icon: ImpulseIcon;
  prompts: string[];
}

export const IMPULSE_PACKS: ImpulsePack[] = [
  {
    id: "sortieren",
    focus: "Mich sortieren",
    name: "Sortieren",
    subtitle: "Mich sortieren",
    icon: "sort",
    prompts: [
      "Was davon ist gerade wirklich meins zu lösen?",
      "Wenn nur eine Sache zählt, welche?",
      "Was darf diese Woche liegen bleiben?",
      "Was nimmt gerade am meisten Raum ein?",
      "Was würde sich erleichtert anfühlen, wenn es geklärt wäre?",
      "Worüber denke ich mehr nach, als es mir guttut?",
    ],
  },
  {
    id: "schleifen",
    focus: "Gedankenschleifen lösen",
    name: "Aus der Schleife",
    subtitle: "Gedankenschleifen lösen",
    icon: "moon",
    prompts: [
      "Welcher Gedanke dreht sich gerade?",
      "Was davon ist Fakt, was ist Sorge?",
      "Was würde ich einer Freundin in dieser Lage sagen?",
      "Was wäre ein kleiner nächster Schritt?",
      "Was ändert sich, wenn ich es einmal ausspreche?",
    ],
  },
  {
    id: "ruhe",
    focus: "Zur Ruhe kommen",
    name: "Zur Ruhe kommen",
    subtitle: "Runterfahren",
    icon: "wave",
    prompts: [
      "Was hat heute gutgetan, auch wenn es klein war?",
      "Wo war ich heute kurz ganz da?",
      "Was darf ich für heute loslassen?",
      "Was brauche ich gerade, um zur Ruhe zu kommen?",
    ],
  },
  {
    id: "schwer",
    focus: "Wenn's gerade viel ist",
    name: "Schwere Phasen",
    subtitle: "Wenn's gerade viel ist",
    icon: "heart",
    prompts: [
      "Was trägt sich gerade besonders schwer?",
      "Was würde es ein bisschen leichter machen?",
      "Wer oder was tut mir gerade gut?",
      "Was muss heute nicht perfekt sein?",
      "Was darf ich mir gerade erlauben?",
    ],
  },
  {
    id: "entscheidung",
    name: "Entscheidungen",
    subtitle: "Klar werden",
    icon: "compass",
    prompts: [
      "Wofür schlägt mein Bauch, wenn ich kurz still werde?",
      "Was spricht ehrlich dafür, was dagegen?",
      "Was rät mir mein Ich in einem Jahr?",
      "Was hält mich gerade zurück?",
    ],
  },
  {
    id: "beziehung",
    focus: "Beziehung klären",
    name: "Beziehung klären",
    subtitle: "Nähe und Grenzen",
    icon: "heart",
    prompts: [
      "Was möchte ich dieser Person eigentlich sagen?",
      "Was brauche ich in dieser Beziehung gerade?",
      "Wo ist meine Grenze, und ist sie klar?",
      "Was nehme ich mit, das nicht meins ist?",
    ],
  },
  {
    id: "frei",
    focus: "Einfach schreiben",
    name: "Einfach schreiben",
    subtitle: "Ohne Ziel",
    icon: "pen",
    prompts: [
      "Was geht dir gerade durch den Kopf, so wie es ist?",
      "Wie war dein Tag, in einem Satz?",
      "Woran denkst du gerade am meisten?",
      "Was möchte raus, ohne dass es Sinn ergeben muss?",
    ],
  },
];

/** Pakete sortiert: das zum Fokus passende zuerst, dann der Rest. */
export function orderedPacks(focus?: string): {
  primary: ImpulsePack | null;
  rest: ImpulsePack[];
} {
  const primary = focus ? IMPULSE_PACKS.find((p) => p.focus === focus) ?? null : null;
  const rest = IMPULSE_PACKS.filter((p) => p.id !== primary?.id);
  return { primary, rest };
}
