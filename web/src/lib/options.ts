// Auswahllisten für das Eintrags-Formular.
//
// Bewusst fundiert statt zufällig zusammengestellt:
// - EMOTIONS: an Gloria Willcox' „Feelings Wheel" (Kernfamilien traurig/wütend/
//   ängstlich/kraftvoll/freudig/friedlich) angelehnt, kuratiert für den Kontext
//   Trennung & Selbstführung. Geordnet nach Familie für schnelles Wiederfinden.
// - NEEDS: am Bedürfnis-Inventar der Gewaltfreien Kommunikation (Rosenberg)
//   orientiert (Verbindung, Autonomie, Sicherheit, Sinn, Selbstwirksamkeit).
// - BODY_SIGNALS: körperliche/interozeptive Marker (Anspannung, Weite …).
// - TOPICS: persönliche Lebensbereiche (inkl. „Lukas") — leicht anpassbar.
// - IMPULSES: Handlungsdrang im Moment (Kontaktimpuls, Regulation, Vermeidung).
// - INTENTIONS: was die Reflexion gerade leisten soll (kurz, scannbar).

export const EMOTIONS = [
  // traurig
  "Trauer",
  "Sehnsucht",
  "Einsamkeit",
  "Enttäuschung",
  // wütend
  "Wut",
  "Gereiztheit",
  "Eifersucht",
  // ängstlich
  "Angst",
  "Unsicherheit",
  "Überforderung",
  // beschämt
  "Scham",
  // leer
  "Leere",
  // friedlich / kraftvoll
  "Hoffnung",
  "Erleichterung",
  "Dankbarkeit",
  "Ruhe",
] as const;

export const BODY_SIGNALS = [
  "Enge in der Brust",
  "Kloß im Hals",
  "Flau im Bauch",
  "Herzklopfen",
  "Anspannung",
  "Innere Unruhe",
  "Zittern",
  "Schwere",
  "Müdigkeit",
  "Wärme",
  "Entspannung",
] as const;

export const TOPICS = [
  "Trennung",
  "Beziehung",
  "Lukas",
  "Kontakt & Nähe",
  "Selbstwert",
  "Zukunft",
  "Kinderwunsch",
  "Familie",
  "Freund:innen",
  "Arbeit",
  "Körper & Gesundheit",
  "Kiffen",
] as const;

export const NEEDS = [
  // Verbindung
  "Nähe",
  "Verbundenheit",
  "Verstanden werden",
  "Wertschätzung",
  // Sicherheit
  "Sicherheit",
  "Stabilität",
  "Klarheit",
  // Autonomie
  "Autonomie",
  "Freiraum",
  // Frieden / Kraft
  "Ruhe",
  "Selbstwirksamkeit",
  "Vertrauen",
] as const;

export const IMPULSES = [
  "Lukas schreiben",
  "Nachsehen bei ihm",
  "Jemanden anrufen",
  "Mich mitteilen",
  "Mich zurückziehen",
  "Weinen",
  "Mich bewegen",
  "Atmen & innehalten",
  "Kiffen",
  "Mich ablenken",
] as const;

export const INTENTIONS = [
  "Sortieren",
  "Beruhigt werden",
  "Ehrlich gespiegelt werden",
  "Eine Nachricht formulieren",
  "Den Impuls halten",
] as const;
