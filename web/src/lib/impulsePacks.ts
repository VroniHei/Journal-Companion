// Kuratierte Schreib-Impulse nach Thema („Impuls-Pakete"). „Schwere Phasen" ist
// der Standard-Fokus oben; passt der Onboarding-Fokus auf ein anderes Paket,
// rückt dieses nach oben. Impulse in Vronis Stimme: offene Fragen, kein
// Coaching-Ton, keine Em-Dashes. Icons + Farben 1:1 nach §14-Cluster.

export type ImpulseIcon =
  | "listChecks"
  | "shell"
  | "moon"
  | "signpost"
  | "heart"
  | "pen"
  | "lifeBuoy";

export type ImpulseCluster = "green" | "lila" | "clay" | "sand";

export interface ImpulsePack {
  id: string;
  /** Passt zu diesem Onboarding-Fokus (aus FOCUS_OPTIONS), falls vorhanden. */
  focus?: string;
  name: string;
  subtitle: string;
  icon: ImpulseIcon;
  cluster: ImpulseCluster;
  prompts: string[];
}

export const IMPULSE_PACKS: ImpulsePack[] = [
  {
    id: "schwer",
    focus: "Wenn's gerade viel ist",
    name: "Schwere Phasen",
    subtitle: "Wenn's gerade viel ist",
    icon: "lifeBuoy",
    cluster: "green",
    prompts: [
      "Was trägt sich gerade besonders schwer?",
      "Was würde es ein bisschen leichter machen?",
      "Wer oder was tut mir gerade gut?",
      "Was muss heute nicht perfekt sein?",
      "Was darf ich mir gerade erlauben?",
    ],
  },
  {
    id: "sortieren",
    focus: "Mich sortieren",
    name: "Sortieren",
    subtitle: "Mich sortieren",
    icon: "listChecks",
    cluster: "green",
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
    icon: "shell",
    cluster: "lila",
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
    icon: "moon",
    cluster: "lila",
    prompts: [
      "Was hat heute gutgetan, auch wenn es klein war?",
      "Wo war ich heute kurz ganz da?",
      "Was darf ich für heute loslassen?",
      "Was brauche ich gerade, um zur Ruhe zu kommen?",
    ],
  },
  {
    id: "entscheidung",
    name: "Entscheidungen",
    subtitle: "Klar werden",
    icon: "signpost",
    cluster: "sand",
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
    cluster: "clay",
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
    cluster: "green",
    prompts: [
      "Was geht dir gerade durch den Kopf, so wie es ist?",
      "Wie war dein Tag, in einem Satz?",
      "Woran denkst du gerade am meisten?",
      "Was möchte raus, ohne dass es Sinn ergeben muss?",
    ],
  },
];

const DEFAULT_PACK_ID = "schwer";

/**
 * Pakete sortiert: passt der Onboarding-Fokus auf ein Paket, steht es oben;
 * sonst ist „Schwere Phasen" der Standard-Fokus. `isFocusMatch` sagt, ob es ein
 * echter Treffer war (für die „Passend zu deinem Fokus"-Zeile).
 */
export function orderedPacks(focus?: string): {
  primary: ImpulsePack;
  isFocusMatch: boolean;
  rest: ImpulsePack[];
} {
  const matched = focus ? IMPULSE_PACKS.find((p) => p.focus === focus) : undefined;
  const primary =
    matched ??
    IMPULSE_PACKS.find((p) => p.id === DEFAULT_PACK_ID) ??
    IMPULSE_PACKS[0];
  const rest = IMPULSE_PACKS.filter((p) => p.id !== primary.id);
  return { primary, isFocusMatch: !!matched, rest };
}
