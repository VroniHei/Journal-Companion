// Tageszeit-Theming (App-Style §8): Ritual- und ritualnahe Flächen tragen
// morgens eine warme, abends eine Flieder/Lilac-Oberfläche. Umschaltpunkt 18 Uhr
// lokal — automatisch, kein sichtbarer Umschalter. Akzent-/CTA-Grün bleibt immer.

export function isEveningNow(): boolean {
  return new Date().getHours() >= 18;
}

export interface RitualTheme {
  evening: boolean;
  /** Flächenverlauf der Dashboard-Tagesritual-Karte (135deg). */
  surface: string;
  /** Verlauf des Ritual-Hero. */
  hero: string;
  border: string;
  orbWarm: string; // oben-links
  orbCool: string; // unten
  badge: string; // Badge-Kachel-Hintergrund
  eyebrow: string; // Akzent-Textfarbe (Eyebrow/Status)
  title: string; // Headline-Farbe auf der Fläche
}

const MORNING: RitualTheme = {
  evening: false,
  surface: "linear-gradient(135deg,#F8EFDF 0%,#F4F0E6 100%)",
  hero: "linear-gradient(135deg,#FBEFD9 0%,#F6ECDB 55%,#EFF1E4 100%)",
  border: "rgba(205,138,91,0.26)",
  orbWarm: "radial-gradient(circle, rgba(224,170,80,0.28), transparent 68%)",
  orbCool: "radial-gradient(circle, rgba(168,232,79,0.20), transparent 68%)",
  badge: "linear-gradient(145deg,#F0C36B,#CD8A5B)",
  eyebrow: "#9c6b3f",
  title: "#3a2e22",
};

const EVENING: RitualTheme = {
  evening: true,
  surface: "linear-gradient(135deg,#EFEAF8 0%,#F1ECEC 55%,#F4F1EA 100%)",
  hero: "linear-gradient(135deg,#EFEAF8 0%,#F1ECEC 55%,#F4F1EA 100%)",
  border: "rgba(123,107,150,0.26)",
  orbWarm: "radial-gradient(circle, rgba(203,190,244,0.40), transparent 68%)",
  orbCool: "radial-gradient(circle, rgba(155,163,131,0.18), transparent 68%)",
  badge: "linear-gradient(145deg,#CBBEF4,#9d8fce)",
  eyebrow: "#7a6b96",
  title: "#352e44",
};

export function ritualTheme(evening: boolean): RitualTheme {
  return evening ? EVENING : MORNING;
}
