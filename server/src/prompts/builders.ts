import type {
  EntryDigest,
  JournalEntry,
  PatternSummary,
  ReflectionContext,
  ResponseLength,
  ResponseStyle,
} from "@journal/shared";
import { BASE_SYSTEM_PROMPT } from "./systemPrompt";

export function styleInstruction(style: ResponseStyle): string {
  switch (style) {
    case "sanft":
      return "Antworte besonders behutsam und sanft, ohne zu verharmlosen.";
    case "klar":
      return "Antworte klar und ruhig, ehrlich, ohne Härte.";
    case "direkt":
      return "Antworte direkt und ehrlich, freundlich im Ton.";
    case "sehr-direkt-warm":
      return "Antworte sehr direkt und zugleich warm — klare Worte, weiches Herz.";
  }
}

export function lengthInstruction(length: ResponseLength): string {
  switch (length) {
    case "kurz":
      return "Halte dich kurz — wenige, präzise Sätze pro Punkt.";
    case "mittel":
      return "Mittlere Länge — je Punkt ein bis drei Sätze.";
    case "ausführlich":
      return "Etwas ausführlicher, aber ohne zu zerreden.";
  }
}

export function maxTokensFor(length: ResponseLength, rumination: boolean): number {
  if (rumination) return 600; // Grübelmodus ist bewusst knapp
  switch (length) {
    case "kurz":
      return 600;
    case "mittel":
      return 1100;
    case "ausführlich":
      return 1800;
  }
}

const REFLECTION_STRUCTURE = `Antworte in genau dieser Struktur, jeweils mit kurzer Überschrift:
1. Was ich aus deinem Eintrag herauslese
2. Was gerade Fakt ist
3. Was dein Kopf daraus machen könnte
4. Welches Bedürfnis darunterliegen könnte
5. Welches Muster vorsichtig sichtbar wird
6. Was jetzt eher nicht hilfreich wäre
7. Ein kleiner nächster Schritt
8. Eine Frage zum Weiterdenken`;

const RUMINATION_STRUCTURE = `Die Nutzerin dreht sich gerade eher im Kreis als dass neue Erkenntnis entsteht.
Wechsle vom Analysieren ins Stabilisieren. Antworte KURZ in genau dieser Struktur:
1. Ich glaube, wir sind gerade eher in einer Schleife als in neuer Erkenntnis.
2. Was gerade im Körper passieren könnte
3. Was für die nächsten 20 Minuten hilft
4. Was du jetzt nicht entscheiden musst
5. Ein sehr kleiner nächster Schritt

Wichtig: keine weitere Spekulation über die andere Person, keine lange Beziehungsanalyse,
keine zehn Reflexionsfragen, keine endlose Vertiefung.`;

const ASSESSMENT_DIRECTIVE = `Bevor du antwortest, schätze innerlich (ohne es auszuformulieren) ein:
- Sucht die Nutzerin gerade Klarheit, Beruhigung oder Kontrolle?
- Steckt sie in einer Grübelschleife?
- Wäre eine stabilisierende Antwort gerade hilfreicher als weitere Analyse?
Richte Länge und Ton danach aus. Je höher die Aktivierung, desto kürzer, konkreter und regulierender.`;

const HIGH_ACTIVATION_NOTE = `Die emotionale Aktivierung ist gerade hoch. Halte die Antwort kürzer, konkreter und regulierender. Weniger Analyse, mehr Boden unter den Füßen.`;

// Vorbereitet für die spätere Voice-Reflection (siehe docs/ROADMAP.md).
// Noch nicht verdrahtet — strukturierte Auswertung eines (Sprach-)Eintrags.
export const VOICE_REFLECTION_STRUCTURE = `Erzeuge aus dem (gesprochenen) Eintrag eine strukturierte Auswertung mit klaren Überschriften:
1. Kurze Zusammenfassung
2. Hauptemotionen
3. Mögliche Bedürfnisse
4. Zentrale Trigger
5. Wichtige Erkenntnis
6. Was jetzt hilfreich wäre
7. Was jetzt eher nicht hilfreich wäre
8. Ein kleiner nächster Schritt`;

export function buildReflectionSystem(opts: {
  style: ResponseStyle;
  length: ResponseLength;
  rumination: boolean;
  intensity: number;
  anliegen?: string;
}): string {
  const highActivation = opts.intensity >= 8;
  return [
    BASE_SYSTEM_PROMPT,
    "",
    ASSESSMENT_DIRECTIVE,
    opts.anliegen ? `Anliegen der Nutzerin gerade: ${opts.anliegen}.` : "",
    styleInstruction(opts.style),
    opts.rumination ? "" : lengthInstruction(opts.length),
    highActivation && !opts.rumination ? HIGH_ACTIVATION_NOTE : "",
    "",
    opts.rumination ? RUMINATION_STRUCTURE : REFLECTION_STRUCTURE,
  ]
    .filter(Boolean)
    .join("\n");
}

function list(label: string, values: string[]): string {
  return values.length ? `${label}: ${values.join(", ")}` : "";
}

function formatEntry(entry: JournalEntry): string {
  return [
    `Stimmung: ${entry.mood}/10 · Intensität: ${entry.intensity}/10`,
    list("Emotionen", entry.emotions),
    list("Körper", entry.bodySignals),
    list("Themen", entry.topics),
    list("Bedürfnisse", entry.needs),
    entry.impulse ? `Impuls: ${entry.impulse}` : "",
    list("Absicht", entry.intention),
    "",
    "Eintrag:",
    entry.text,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatDigest(digests: EntryDigest[]): string {
  if (!digests.length) return "";
  const lines = digests.map((d) => {
    const meta = [
      d.createdAt.slice(0, 10),
      `Stimmung ${d.mood}`,
      d.topics.length ? `Themen: ${d.topics.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `- ${meta}\n  ${d.excerpt}`;
  });
  return `Kurzer Rückblick auf die letzten Einträge (nur Kontext, nicht direkt beantworten):\n${lines.join("\n")}`;
}

function formatPattern(p: PatternSummary | null): string {
  if (!p) return "";
  const parts = [
    p.summary,
    list("Wiederkehrende Themen", p.recurringThemes),
    list("Wiederkehrende Bedürfnisse", p.recurringNeeds),
    list("Stabilisierende Handlungen", p.stabilizingActions),
    list("Hilfreiche Regulationsstrategien", p.helpfulRegulationStrategies),
    list("Kontaktimpuls-Muster", p.contactImpulsePatterns),
  ].filter(Boolean);
  return parts.length
    ? `Gespeicherte persönliche Muster (Hintergrundwissen):\n${parts.join("\n")}`
    : "";
}

const CHAT_DIRECTIVE = `Dies ist ein fortlaufendes, ruhiges Gespräch zu einem Tagebucheintrag. Antworte natürlich und knapp, ohne starre Nummerierung. Geh auf das ein, was die Nutzerin sagt.
Wenn sie sich wiederholt oder im Kreis dreht, analysiere nicht tiefer, sondern benenne sanft die Schleife und hilf beim Stabilisieren (Körper, nächste 20 Minuten, ein kleiner Schritt). Spekuliere nicht weiter über andere Personen.
Wenn es passt, schließe mit einer einzelnen offenen Frage oder einem kleinen nächsten Schritt — aber nicht zwanghaft.`;

export function buildChatSystem(opts: {
  style: ResponseStyle;
  entry: JournalEntry;
  conversationSummary?: string;
}): string {
  const background = [
    "Hintergrund — der Eintrag, um den es geht:",
    formatEntry(opts.entry),
    opts.conversationSummary
      ? `\nBisheriges Gespräch (Zusammenfassung):\n${opts.conversationSummary}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    BASE_SYSTEM_PROMPT,
    "",
    CHAT_DIRECTIVE,
    styleInstruction(opts.style),
    "",
    background,
  ]
    .filter(Boolean)
    .join("\n");
}

// --- Wochenrückblick -------------------------------------------------------

const WEEKLY_DIRECTIVE = `Erstelle einen ruhigen, ehrlichen Wochenrückblick aus den Einträgen. Nicht motivational überdreht, kein „Du rockst das" — erwachsen, klar, hilfreich.
Gliedere mit kurzen Überschriften:
- Häufigste Emotionen
- Häufigste Themen
- Häufigste Bedürfnisse
- Stärkste Trigger
- Kontaktimpulse
- Stabilisierende Handlungen
- Wiederkehrende Muster (vorsichtig formuliert)
- Was du nächste Woche beobachten könntest
Keine Diagnosen, keine Spekulation über andere Personen. Wenn die Datenlage dünn ist, sag das ehrlich.`;

export function buildWeeklyReviewSystem(style: ResponseStyle): string {
  return [BASE_SYSTEM_PROMPT, "", WEEKLY_DIRECTIVE, styleInstruction(style)].join(
    "\n",
  );
}

export function buildWeeklyReviewUser(
  periodStart: string,
  periodEnd: string,
  digests: EntryDigest[],
): string {
  if (!digests.length) {
    return `Zeitraum ${periodStart.slice(0, 10)} bis ${periodEnd.slice(0, 10)}: keine Einträge.`;
  }
  const lines = digests.map((d) => {
    const meta = [
      d.createdAt.slice(0, 10),
      `Stimmung ${d.mood}`,
      `Intensität ${d.intensity}`,
      d.emotions.length ? `Emotionen: ${d.emotions.join(", ")}` : "",
      d.topics.length ? `Themen: ${d.topics.join(", ")}` : "",
      d.needs.length ? `Bedürfnisse: ${d.needs.join(", ")}` : "",
      d.impulse ? `Impuls: ${d.impulse}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `- ${meta}\n  ${d.excerpt}`;
  });
  return [
    `Zeitraum: ${periodStart.slice(0, 10)} bis ${periodEnd.slice(0, 10)} (${digests.length} Einträge)`,
    "",
    lines.join("\n"),
  ].join("\n");
}

// --- Kontaktimpuls ---------------------------------------------------------

const CONTACT_DIRECTIVE = `Die Nutzerin möchte jemandem schreiben, ist aber emotional aktiviert. Deine Aufgabe: zuerst regulieren, nicht zum Senden drängen.
Hilf einzuschätzen: Was will sie wirklich erreichen (Klärung, Verbindung, Beruhigung)? Aus welchem Zustand heraus? Würde sie die Nachricht morgen noch stimmig finden? Braucht es gerade Kontakt oder zuerst Beruhigung?
Empfiehl eine Nachricht NUR, wenn sie klar, kurz, würdevoll und nicht manipulativ ist. Keine Druck-/Schuld-/Strategie-Nachrichten. Bei hoher Aktivierung ist Nicht-Senden oder späteres Prüfen meist stabiler.`;

const CONTACT_JSON_CONTRACT = `Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine Code-Fences), genau in diesem Format:
{
  "recommendation": "nicht-senden" | "später-prüfen" | "kurze-würdevolle-nachricht",
  "activationLevel": <Zahl 1-10, die genannte Aktivierung>,
  "likelyNeed": "<kurzes Bedürfnis darunter>",
  "reflection": "<2-4 ruhige Sätze, die spiegeln>",
  "why": "<1-3 Sätze, warum diese Empfehlung>",
  "nextStep": "<ein kleiner, konkreter nächster Schritt>",
  "draftMessage": "<NUR wenn recommendation = kurze-würdevolle-nachricht: eine klare, kurze, würdevolle Nachricht; sonst dieses Feld ganz weglassen>"
}`;

export function buildContactImpulseSystem(style: ResponseStyle): string {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    CONTACT_DIRECTIVE,
    styleInstruction(style),
    "",
    CONTACT_JSON_CONTRACT,
  ].join("\n");
}

export function buildContactImpulseUser(opts: {
  situation: string;
  goal: string;
  activation: number;
  draft?: string;
}): string {
  return [
    `Aktivierung: ${opts.activation}/10`,
    opts.goal ? `Ziel der Nachricht (laut Nutzerin): ${opts.goal}` : "",
    "Situation / worum es geht:",
    opts.situation,
    opts.draft ? `\nEntwurf, den sie schreiben möchte:\n${opts.draft}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildReflectionUser(
  entry: JournalEntry,
  context: ReflectionContext,
): string {
  return [
    formatPattern(context.latestPattern),
    formatDigest(context.recentDigest),
    "Aktueller Eintrag, auf den du eingehst:",
    formatEntry(entry),
  ]
    .filter(Boolean)
    .join("\n\n");
}
