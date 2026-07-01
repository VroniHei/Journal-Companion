import type {
  EntryDigest,
  JournalEntry,
  PatternDepth,
  PatternEntryInput,
  PatternInsightsRequest,
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

const CONVERSATION_REFLECTION_NOTE = `WICHTIG — AKTUALISIERTE REFLEXION: Die erste Reflexion bezog sich nur auf den Tagebucheintrag. Seitdem gab es ein Gespräch dazu (unten, „Gespräch seit dem Eintrag"). Reflektiere jetzt über den GESAMTEN Stand — Eintrag UND Gespräch zusammen.
- Greife die im Gespräch neu aufgekommenen Themen, Fragen und Einsichten ausdrücklich auf und benenne sie konkret (nicht nur den ursprünglichen Eintrag spiegeln).
- Zeige, was sich seit dem ersten Eintrag verschoben, präzisiert oder verändert hat.
- Formuliere die Reflexion erkennbar neu auf Basis des Gesprächs. Schreibe nicht einfach die erste Reflexion etwas länger.
- Wenn im Gespräch wirklich nichts Neues kam, sag das ehrlich in einem Satz, statt künstlich zu variieren.`;

export function buildReflectionSystem(opts: {
  style: ResponseStyle;
  length: ResponseLength;
  rumination: boolean;
  intensity: number;
  anliegen?: string;
  hasConversation?: boolean;
}): string {
  const highActivation = opts.intensity >= 8;
  return [
    BASE_SYSTEM_PROMPT,
    "",
    ASSESSMENT_DIRECTIVE,
    opts.anliegen ? `Anliegen der Nutzerin gerade: ${opts.anliegen}.` : "",
    opts.hasConversation ? CONVERSATION_REFLECTION_NOTE : "",
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

// Rahmung für das Hintergrundwissen aus früheren Einträgen: nur als leiser
// Resonanzboden, niemals als Pflicht oder Aufzählung. Bewahrt den Fokus auf dem
// aktuellen Anliegen und hält an der Voice DNA fest.
const CHAT_MEMORY_NOTE = `Du kennst etwas Hintergrundwissen aus früheren Einträgen (weiter unten). Nutze es nur als leisen Resonanzboden. Wenn es wirklich zum gerade Gesagten passt, darfst du behutsam und natürlich daran anknüpfen, etwa „das klang neulich schon einmal an". Dräng es nicht auf, zähl nichts auf, und lass den Fokus beim aktuellen Anliegen. Stelle keine neuen Muster-Behauptungen über das bereits Bestätigte hinaus auf und spekuliere nicht über andere Personen.`;

export function buildChatSystem(opts: {
  style: ResponseStyle;
  entry: JournalEntry;
  conversationSummary?: string;
  pattern?: PatternSummary | null;
  recentDigest?: EntryDigest[];
}): string {
  const patternBlock = formatPattern(opts.pattern ?? null);
  const digestBlock = formatDigest(opts.recentDigest ?? []);
  const hasMemory = Boolean(patternBlock || digestBlock);

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
    hasMemory ? CHAT_MEMORY_NOTE : "",
    styleInstruction(opts.style),
    "",
    background,
    // Älteres Hintergrundwissen NACH dem aktuellen Eintrag — der bleibt der Fokus.
    patternBlock,
    digestBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

// --- Gesprächs-Zusammenfassung (laufend, schlankes Modell) -----------------

export const CONVERSATION_SUMMARY_SYSTEM = `Du verdichtest ein laufendes Gespräch zwischen einer Person und ihrem einfühlsamen Tagebuch-Begleiter zu einer kurzen, sachlichen Zusammenfassung. Diese dient nur als Gedächtnisstütze für das weitere Gespräch.

Regeln:
- Deutsch, 2 bis 5 knappe Sätze (oder kurze Stichpunkte). Höchstens ~120 Wörter.
- Schreibe die vorhandene Zusammenfassung FORT: bewahre weiterhin Wichtiges, ergänze das Neue, lass Überholtes weg. Erfinde nichts dazu.
- Halte fest, was die Person beschäftigt (Themen, Gefühle, Bedürfnisse), was sie schon einordnen oder ausprobieren wollte, und welche Frage oder welcher nächste Schritt zuletzt offen war.
- Rein deskriptiv. Keine Ratschläge, keine Deutungen über andere Personen, keine Diagnosen, keine Wertung.
- Gib AUSSCHLIESSLICH die Zusammenfassung aus, ohne Vorrede oder Überschrift.`;

export function buildConversationSummaryUser(opts: {
  entry: { text: string; topics: string[]; emotions: string[]; needs: string[] };
  previousSummary?: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): string {
  const anchor = [
    `Worum es im Eintrag geht: ${opts.entry.text.slice(0, 600)}`,
    opts.entry.topics.length ? `Themen: ${opts.entry.topics.join(", ")}` : "",
    opts.entry.emotions.length ? `Gefühle: ${opts.entry.emotions.join(", ")}` : "",
    opts.entry.needs.length ? `Bedürfnisse: ${opts.entry.needs.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const transcript = opts.messages
    .map((m) => `${m.role === "user" ? "Person" : "Begleiter"}: ${m.content}`)
    .join("\n");

  return [
    anchor,
    opts.previousSummary
      ? `\nBisherige Zusammenfassung (fortschreiben):\n${opts.previousSummary}`
      : "",
    `\nGesprächsverlauf, der verdichtet werden soll:\n${transcript}`,
    `\nGib die aktualisierte, kurze Zusammenfassung aus.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// --- Voice-Check-in --------------------------------------------------------

const VOICE_JSON_CONTRACT = `Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine Code-Fences), genau in diesem Format:
{
  "entrySummary": "<2-3 ruhige Sätze, die zusammenfassen, was los ist>",
  "mainEmotions": ["<die spürbarsten Emotionen, 1-4>"],
  "mainNeed": "<ein zentrales Bedürfnis darunter>",
  "mainTrigger": "<der zentrale Auslöser, kurz>",
  "keyInsights": ["<eine wichtige Erkenntnis>", "<optional eine weitere>"],
  "supportiveImpulse": "<was jetzt hilfreich wäre, ein Satz>",
  "dontDoNow": ["<was jetzt eher nicht hilfreich wäre>", "<optional weiteres>"],
  "nextStep": "<ein kleiner, konkreter nächster Schritt>"
}
Halte alles knapp und konkret. Keine Spekulation über andere Personen, keine Diagnosen.`;

export function buildVoiceReflectSystem(style: ResponseStyle): string {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    "Die Nutzerin hat frei gesprochen; hier ist das Transkript. Werte es ruhig und strukturiert aus.",
    styleInstruction(style),
    "",
    VOICE_JSON_CONTRACT,
  ].join("\n");
}

export function buildVoiceReflectUser(transcript: string): string {
  return `Transkript:\n${transcript}`;
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

// --- Wochen-Brief ----------------------------------------------------------

const LETTER_DIRECTIVE = `Schreibe statt einer Statistik einen kurzen, warmen Brief an die Nutzerin — in ruhiger, wertschätzender Du-Stimme. Spiegele, was sich in der Woche gezeigt hat: ein, zwei ehrliche Beobachtungen (wiederkehrende Themen, Stimmungs-Tendenz, ein Wort das öfter vorkam), ohne Bewertung, ohne Ratschlag, ohne Coaching-Floskeln. Hebe höchstens ein, zwei einzelne Wörter behutsam hervor, indem du sie in *Sternchen* setzt (sie werden später kursiv dargestellt). Keine Em-Dashes, keine Emoji, keine Diagnosen. Halte dich kurz (2 bis 3 kleine Absätze).
Schließe mit GENAU EINER offenen, ehrlichen Frage für die nächste Woche.`;

const LETTER_JSON_CONTRACT = `Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine Code-Fences), genau in diesem Format:
{
  "body": "<der Brieftext, 2-3 kurze Absätze, mit \\n\\n zwischen den Absätzen; OHNE Anrede und OHNE die Schlussfrage>",
  "question": "<eine einzige offene Frage für die kommende Woche>"
}`;

export function buildWeeklyLetterSystem(style: ResponseStyle): string {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    LETTER_DIRECTIVE,
    styleInstruction(style),
    "",
    LETTER_JSON_CONTRACT,
  ].join("\n");
}

export function buildWeeklyLetterUser(
  periodStart: string,
  periodEnd: string,
  digests: EntryDigest[],
): string {
  // Gleiche Datengrundlage wie der Rückblick — nur die Form ist ein Brief.
  return buildWeeklyReviewUser(periodStart, periodEnd, digests);
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

function formatConversation(
  turns?: { role: "user" | "assistant"; content: string }[],
): string {
  if (!turns?.length) return "";
  const lines = turns.map(
    (t) => `${t.role === "user" ? "Nutzerin" : "Begleiter"}: ${t.content}`,
  );
  return `Gespräch seit dem Eintrag (neuester Stand — bitte ausdrücklich einbeziehen):\n${lines.join("\n")}\n\nDeine aktualisierte Reflexion soll die hier aufgekommenen Themen konkret aufgreifen.`;
}

export function buildReflectionUser(
  entry: JournalEntry,
  context: ReflectionContext,
  conversation?: { role: "user" | "assistant"; content: string }[],
): string {
  return [
    formatPattern(context.latestPattern),
    formatDigest(context.recentDigest),
    "Aktueller Eintrag, auf den du eingehst:",
    formatEntry(entry),
    formatConversation(conversation),
  ]
    .filter(Boolean)
    .join("\n\n");
}

// --- Qualitative Muster (PatternInsight) -----------------------------------

const PATTERN_DIRECTIVE = `Du leitest aus mehreren Tagebucheinträgen QUALITATIVE, wiederkehrende Verhaltens- und Reaktionsmuster ab — nicht bloß Häufigkeiten von Tags.
Ein Muster ist eine Sequenz, wie sich Auslöser, Gedanken, Gefühle, Körperempfinden, Bedürfnis und Handlung typischerweise verketten (z. B. „Aufstau → Lähmung → Überdruck → Sofort-Handeln" oder „Unsicherheit → Grübeln → Kontaktimpuls").

Sei vorsichtig und nicht-wertend:
- Keine Diagnosen, keine Pathologisierung, keine absoluten Aussagen, kein „du bist so".
- Formuliere als Hypothese: „Es wirkt so, als ...", „Ein mögliches Muster könnte sein ...", „In mehreren Einträgen zeigt sich ...".
- Nur Muster vorschlagen, die durch mehrere Einträge gestützt sind. Lieber wenige, gut belegte Muster als viele vage.
- Jedes Muster hat eine hilfreiche UND eine schwierige Seite — benenne beide.
- Beziehe dich, wo möglich, mit exampleEntryIds auf konkrete Einträge (deren IDs stehen im Input).`;

function patternCountHint(depth: PatternDepth): string {
  switch (depth) {
    case "kurz":
      return "Gib 1-2 besonders deutliche Muster zurück.";
    case "mittel":
      return "Gib 2-3 Muster zurück.";
    case "tief":
      return "Gib 3-5 Muster zurück, sofern wirklich belegt.";
  }
}

const PATTERN_JSON_CONTRACT = `Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine Code-Fences), genau in diesem Format:
{
  "patterns": [
    {
      "title": "<prägnanter Titel, z. B. 'Aufstau → Lähmung → Überdruck → Sofort-Handeln'>",
      "shortName": "<optional: 1-3 Wörter>",
      "description": "<2-5 ruhige, hypothetische Sätze, was sich zeigt>",
      "patternType": "rumination" | "avoidance" | "action-pressure" | "contact-impulse" | "self-worth" | "regulation" | "relationship" | "decision-making" | "overload" | "other",
      "confidence": "niedrig" | "mittel" | "hoch",
      "triggerSignals": ["<woran es startet>"],
      "typicalSequence": ["<Schritt 1>", "<Schritt 2>", "..."],
      "emotionalSignals": ["<beteiligte Emotionen>"],
      "bodySignals": ["<beteiligte Körpersignale>"],
      "needsBehindIt": ["<Bedürfnis(se) darunter>"],
      "helpfulSide": "<was an dem Muster hilfreich ist, 1-2 Sätze>",
      "difficultSide": "<wo es schwierig wird, 1-2 Sätze>",
      "earlyWarningSigns": ["<frühe Anzeichen, woran sie es erkennt>"],
      "interruptionStrategies": ["<kleine Unterbrechungsschritte>"],
      "dontDoNow": ["<was in dem Moment eher nicht hilft>"],
      "exampleEntryIds": ["<IDs passender Einträge aus dem Input>"],
      "suggestedExperiment": "<optional: ein kleines konkretes Experiment>",
      "reflectionQuestion": "<optional: eine offene Reflexionsfrage>"
    }
  ]
}
Lass optionale Felder weg, wenn du nichts Belegtes hast. Gib keine leeren Platzhalter aus.`;

export function buildPatternInsightsSystem(
  style: ResponseStyle,
  depth: PatternDepth,
): string {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    PATTERN_DIRECTIVE,
    patternCountHint(depth),
    styleInstruction(style),
    "",
    PATTERN_JSON_CONTRACT,
  ].join("\n");
}

function formatPatternEntry(e: PatternEntryInput): string {
  const meta = [
    `id: ${e.id}`,
    `Datum: ${e.createdAt.slice(0, 16).replace("T", " ")}`,
    `Stimmung ${e.mood}/10`,
    `Intensität ${e.intensity}/10`,
  ].join(" · ");
  const tags = [
    e.emotions.length ? `Emotionen: ${e.emotions.join(", ")}` : "",
    e.bodySignals.length ? `Körper: ${e.bodySignals.join(", ")}` : "",
    e.topics.length ? `Themen: ${e.topics.join(", ")}` : "",
    e.needs.length ? `Bedürfnisse: ${e.needs.join(", ")}` : "",
    e.impulse ? `Impuls: ${e.impulse}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return [`- ${meta}`, tags ? `  ${tags}` : "", `  Text: ${e.text}`]
    .filter(Boolean)
    .join("\n");
}

export function buildPatternInsightsUser(
  req: Pick<
    PatternInsightsRequest,
    "entries" | "patternSummary" | "existingPatterns" | "timeframe"
  >,
): string {
  const tf =
    req.timeframe === "7tage"
      ? "letzte 7 Tage"
      : req.timeframe === "30tage"
        ? "letzte 30 Tage"
        : "alle Einträge";
  const existing = req.existingPatterns?.length
    ? [
        "Bereits erkannte Muster (nicht doppeln; ggf. verfeinern):",
        ...req.existingPatterns.map(
          (p) =>
            `- ${p.title} (${p.patternType}${p.userFeedback ? `, Feedback: ${p.userFeedback}` : ""})`,
        ),
      ].join("\n")
    : "";
  return [
    `Zeitraum: ${tf}. Anzahl Einträge: ${req.entries.length}.`,
    req.patternSummary ? `Bisherige Muster-Zusammenfassung:\n${req.patternSummary}` : "",
    existing,
    "Einträge (chronologisch):",
    req.entries.map(formatPatternEntry).join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

// --- Zitat-Karte: KI-Vorschlag (Satz + Affirmation) -----------------------

const SHARE_SUGGESTION_DIRECTIVE = `Aufgabe: Formuliere aus den Einträgen EINEN ruhigen Satz, der ein wiederkehrendes Thema oder eine Erkenntnis der Person spiegelt — für eine schöne, teilbare Zitat-Karte. Dazu eine kurze, sanfte Affirmation.

Haltung:
- Ruhig, wertschätzend, in der Sprache der Person (Deutsch). Nicht kitschig, nicht marktschreierisch, kein Coaching-Ton.
- KEINE Diagnosen, keine Ratschläge, keine Versprechen, keine Bewertung. Nur spiegeln, was sich zeigt.
- Persönlich verankert, aber allgemein genug, dass man es gern teilt.

Feld "sentence":
- Ein bis zwei kurze Sätze, höchstens ~90 Zeichen.
- Markiere genau EIN zentrales Wort mit *Sternchen* (Akzentwort), z. B. "*Ruhe* ist keine Pause. Sie ist das Ziel."

Feld "affirmation":
- Kurzer "Ich …"-Satz, höchstens ~60 Zeichen, sanft und selbstmitfühlend (z. B. "Ich darf heute einfach sein.").`;

const SHARE_SUGGESTION_JSON_CONTRACT = `Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, ohne Vor- oder Nachtext:
{"sentence": "…", "affirmation": "…"}`;

export function buildShareSuggestionSystem(style: ResponseStyle): string {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    SHARE_SUGGESTION_DIRECTIVE,
    styleInstruction(style),
    "",
    SHARE_SUGGESTION_JSON_CONTRACT,
  ].join("\n");
}

export function buildShareSuggestionUser(entries: PatternEntryInput[]): string {
  return [
    `Anzahl Einträge: ${entries.length}. Spiegle das, was sich über sie hinweg durchzieht.`,
    "Einträge (chronologisch):",
    entries.map(formatPatternEntry).join("\n"),
  ].join("\n\n");
}
