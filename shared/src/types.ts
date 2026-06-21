// Gemeinsame Typen für Frontend (web) und Backend (server).
// Einzige Quelle der Wahrheit für Datenmodelle und API-Verträge.
// Bewusst TYPE-ONLY (keine Laufzeit-Exports) — Default-Werte/Listen liegen in web/server.

// ---------------------------------------------------------------------------
// Modelle
// ---------------------------------------------------------------------------

/** Standard ist Sonnet (kosteneffizient); Opus nur als bewusster Qualitätsmodus. */
export type ClaudeModel = "claude-sonnet-4-6" | "claude-opus-4-8";

// ---------------------------------------------------------------------------
// Datenmodelle (lokal in IndexedDB / Dexie gespeichert)
// ---------------------------------------------------------------------------

/** Auswahl im Startscreen „Was brauchst du gerade?" — steuert Modus/Promptstruktur. */
export type StartIntent =
  | "schreiben" // Ich will einfach schreiben
  | "schleife" // Ich hänge in einer Schleife
  | "ihm-schreiben" // Ich will ihm schreiben → Kontaktimpuls
  | "beruhigung" // Ich brauche Beruhigung
  | "spiegel" // Ich brauche einen klaren Spiegel
  | "abend-abschliessen" // Ich will den Abend abschließen
  | "tag-sortieren"; // Ich will meinen Tag sortieren

export type SleepQuality = "gut" | "mittel" | "schlecht";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  entryId: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  text: string;
  mood: number; // 1..10
  intensity: number; // 1..10
  emotions: string[];
  bodySignals: string[];
  topics: string[];
  needs: string[];
  impulse: string;
  intention: string[];
  aiReflection: string | null;
  /** Kurzer, treffender Titel (KI-generiert; Fallback aus dem Text). */
  title?: string;
  /** Frühere Reflexionen (Verlauf), neueste zuerst — beim Neu-Reflektieren bewahrt. */
  previousReflections?: { text: string; at: string }[];
  /** Auswahl aus dem Startscreen (optional). */
  startIntent?: StartIntent;
  // Minimales Alltagstracking (optional) — fließt später in Muster & Wochenrückblick.
  sleepQuality?: SleepQuality | null;
  movementToday?: boolean | null;
  outsideToday?: boolean | null;
  cannabisToday?: boolean | null;
  /** Laufende Gesprächs-Zusammenfassung (für günstigeres Chat-Prompting). */
  conversationSummary?: string;
  crisisFlag: boolean;
  ruminationFlag: boolean;
  // Voice-Reflection (vorbereitet, noch nicht im MVP gebaut — siehe docs/ROADMAP.md)
  inputType?: "text" | "voice";
  audioNoteId?: string | null;
  transcript?: string | null;
  // Strukturierte KI-Auswertung (optional, für Voice-Check-in & spätere Anzeige)
  entrySummary?: string | null;
  keyInsights?: string[];
  dontDoNow?: string[];
  supportiveImpulse?: string | null;
  mainTrigger?: string | null;
  mainNeed?: string | null;
}

export interface PatternSummary {
  id: string;
  createdAt: string; // ISO
  periodStart: string; // ISO
  periodEnd: string; // ISO
  summary: string;
  recurringThemes: string[];
  recurringNeeds: string[];
  stabilizingActions: string[];
  riskPatterns: string[];
  // Erweiterung: echte persönliche Muster über die Zeit
  personalContextNotes: string[];
  helpfulRegulationStrategies: string[];
  contactImpulsePatterns: string[];
  // Persönliche Strategien-Bibliothek: was der Nutzerin wirklich hilft
  helpfulSentences: string[];
  unhelpfulThoughtLoops: string[];
  groundingActionsThatWorked: string[];
  contactDecisionsThatFeltGoodLater: string[];
}

/**
 * Gentle Gamification: „stabile Momente" — belohnt Selbstführung/Regulation,
 * NICHT App-Nutzung. Keine Punkte/Streaks/Scores. Siehe docs/DECISIONS.md.
 */
export type StabilityKind =
  | "sortiert-vor-handeln"
  | "impuls-gehalten"
  | "schleife-erkannt"
  | "koerperlicher-schritt"
  | "beduerfnis-benannt"
  | "entwurf-statt-senden"
  | "woche-reflektiert"
  | "reflektiert"
  | "schleife-geklaert"
  | "entscheidung-reflektiert"
  | "abschluss";

export interface StabilityMoment {
  id: string;
  createdAt: string; // ISO
  entryId?: string;
  kind: StabilityKind;
  label: string;
}

export type ResponseStyle = "sanft" | "klar" | "direkt" | "sehr-direkt-warm";
export type ResponseLength = "kurz" | "mittel" | "ausführlich";
export type ApiMode = "claude" | "local";

/** Hinweis: KEIN API-Key-Feld. Der Key liegt ausschließlich in server/.env. */
export interface AppSettings {
  id: string; // Singleton, z.B. "app"
  appName: string;
  /** Vorname der Nutzerin für die persönliche Ansprache (z.B. „Vroni"). */
  userName?: string;
  claudeModel: ClaudeModel;
  responseStyle: ResponseStyle;
  maxResponseLength: ResponseLength;
  apiMode: ApiMode;
  localModelEndpoint?: string;
  /** Bewusster High-Quality-Modus (nutzt Opus statt Sonnet). */
  highQualityMode?: boolean;
  /** Antworten des Begleiters automatisch vorlesen (Sprachausgabe). */
  autoSpeak?: boolean;
  /** Bevorzugte Stimme für die Sprachausgabe (voiceURI der Web Speech API). */
  speechVoiceURI?: string;
  /**
   * Spracheingabe: kostenlose Browser-Erkennung bevorzugen (Standard). Dann wird
   * ElevenLabs (kostet Guthaben) nur genutzt, wenn der Browser keine
   * Spracherkennung kann (z.B. iOS/Safari).
   */
  preferFreeSpeech?: boolean;
  /** Persönlicher Fokus (aus dem Onboarding, in Einstellungen änderbar). */
  focusArea?: string;
  /** Wunsch-Uhrzeit fürs Tagesritual (HH:MM) — nur Anzeige, keine Push-Mitteilung. */
  reminderTime?: string;
  /** Onboarding abgeschlossen/übersprungen. */
  onboarded?: boolean;
}

// ---------------------------------------------------------------------------
// Kontext, den der Client (Dexie-Besitzer) an das stateless Backend schickt
// ---------------------------------------------------------------------------

/** Kompakter Snapshot eines Eintrags für den Verlaufs-Digest (Ebene 2). */
export interface EntryDigest {
  createdAt: string;
  mood: number;
  intensity: number;
  topics: string[];
  emotions: string[];
  needs: string[];
  impulse: string;
  excerpt: string; // gekürzter Text
}

/** Drei-Ebenen-Kontext: aktueller Eintrag + Verlaufs-Digest + gespeicherte Muster. */
export interface ReflectionContext {
  recentDigest: EntryDigest[];
  latestPattern: PatternSummary | null;
}

export interface ResponsePrefs {
  style: ResponseStyle;
  length: ResponseLength;
  model: ClaudeModel;
}

// ---------------------------------------------------------------------------
// API-Verträge (Frontend ruft nur das eigene Backend)
// ---------------------------------------------------------------------------

export interface ReflectRequest {
  entry: JournalEntry;
  context: ReflectionContext;
  /** Vom Client vorab erkannte Grübel-Signale (aus der Dexie-Historie). */
  ruminationHint?: boolean;
  /** Anliegen aus dem Startscreen (menschenlesbar), z.B. „Ich brauche Beruhigung". */
  intent?: string;
  /**
   * Bisheriges Gespräch zu diesem Eintrag (für „Neu reflektieren": die Reflexion
   * bezieht die neuen Nachrichten mit ein).
   */
  conversation?: Pick<ChatMessage, "role" | "content">[];
  prefs: ResponsePrefs;
}

export interface ChatRequest {
  entry: JournalEntry;
  /** Bisherige Gesprächs-Zusammenfassung (statt vollem Verlauf). */
  conversationSummary?: string;
  /** Die letzten N Nachrichten (Kurzkontext). */
  recentMessages: Pick<ChatMessage, "role" | "content">[];
  userMessage: string;
  prefs: ResponsePrefs;
}

export type ContactImpulseRecommendation =
  | "nicht-senden"
  | "später-prüfen"
  | "kurze-würdevolle-nachricht";

export interface ContactImpulseRequest {
  /** Worum geht es / an wen (frei). */
  situation: string;
  goal: string; // Klärung / Verbindung / Beruhigung / ...
  activation: number; // 1..10
  draft?: string; // optionaler Nachrichtenentwurf
  prefs: ResponsePrefs;
}

export interface ContactImpulseResponse {
  recommendation: ContactImpulseRecommendation;
  activationLevel: number;
  likelyNeed: string;
  reflection: string;
  why: string;
  nextStep: string;
  /** Nur gesetzt, wenn eine klare, kurze, würdevolle Nachricht sinnvoll ist. */
  draftMessage?: string;
}

export interface WeeklyReviewRequest {
  periodStart: string;
  periodEnd: string;
  digests: EntryDigest[];
  prefs: ResponsePrefs;
}

export interface WeeklyReviewResponse {
  summary: string;
}

/** Wochen-Brief: warmer KI-Brief in Vronis Stimme statt Statistik-Wand. */
export interface WeeklyLetterResponse {
  /** Brieftext (mehrere Absätze, ohne Anrede und ohne die Schlussfrage). */
  body: string;
  /** Eine ehrliche, offene Frage für die kommende Woche. */
  question: string;
}

export interface VoiceReflectRequest {
  transcript: string;
  prefs: ResponsePrefs;
}

/** Strukturierte Auswertung eines (gesprochenen) Eintrags. */
export interface VoiceReflectResponse {
  entrySummary: string;
  mainEmotions: string[];
  mainNeed: string;
  mainTrigger: string;
  keyInsights: string[];
  supportiveImpulse: string; // was jetzt hilfreich wäre
  dontDoNow: string[]; // was jetzt eher nicht hilfreich wäre
  nextStep: string;
}

/**
 * Deterministische Sicherheitsantwort bei erkannten Krisenhinweisen.
 * Wird von Nicht-Streaming-Endpunkten anstelle der Normalantwort zurückgegeben;
 * Streaming-Endpunkte senden stattdessen `crisisMessage` als Text.
 */
export interface CrisisResponse {
  crisis: true;
  message: string;
}

/** Einheitliche Fehlerantwort des Backends. */
export interface ApiError {
  error: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Qualitative Verhaltens-/Reaktionsmuster (zweite Ebene über den Kennzahlen)
// ---------------------------------------------------------------------------

export type PatternType =
  | "rumination"
  | "avoidance"
  | "action-pressure"
  | "contact-impulse"
  | "self-worth"
  | "regulation"
  | "relationship"
  | "decision-making"
  | "overload"
  | "other";

export type PatternConfidence = "niedrig" | "mittel" | "hoch";

/** Rückmeldung der Nutzerin zu einem erkannten Muster. */
export type PatternFeedback = "passt" | "teilweise" | "passt-nicht";

export interface PatternInsight {
  id: string;
  createdAt: string;
  updatedAt: string;

  title: string;
  shortName?: string;

  description: string;
  patternType: PatternType;
  confidence: PatternConfidence;

  triggerSignals: string[];
  typicalSequence: string[];
  emotionalSignals: string[];
  bodySignals: string[];
  needsBehindIt: string[];

  helpfulSide: string;
  difficultSide: string;

  earlyWarningSigns: string[];
  interruptionStrategies: string[];
  dontDoNow: string[];

  exampleEntryIds: string[];

  suggestedExperiment?: string;
  reflectionQuestion?: string;

  /** 3-stufiges Feedback der Nutzerin. */
  userFeedback?: PatternFeedback | null;
  /** Abgeleitet aus userFeedback (passt = true, passt-nicht = false). */
  userConfirmed?: boolean | null;
  userNotes?: string;
}

/** Vom Modell geliefertes Muster (ohne client-seitige IDs/Zeitstempel/Feedback). */
export type PatternInsightDraft = Omit<
  PatternInsight,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "userFeedback"
  | "userConfirmed"
  | "userNotes"
>;

/** Kompakter Eintrag, der für die Musteranalyse ans Backend geht. */
export interface PatternEntryInput {
  id: string;
  createdAt: string;
  mood: number;
  intensity: number;
  emotions: string[];
  bodySignals: string[];
  topics: string[];
  needs: string[];
  impulse: string;
  text: string;
}

export type PatternTimeframe = "7tage" | "30tage" | "alle";
export type PatternDepth = "kurz" | "mittel" | "tief";

export interface PatternInsightsRequest {
  entries: PatternEntryInput[];
  patternSummary?: string;
  existingPatterns?: {
    title: string;
    patternType: PatternType;
    userFeedback?: PatternFeedback | null;
  }[];
  timeframe: PatternTimeframe;
  depth: PatternDepth;
  prefs: ResponsePrefs;
}

export interface PatternInsightsResponse {
  patterns: PatternInsightDraft[];
}

// --- Offene Schleifen (Selbstführung „Klärung") ---------------------------
// Leichte Erfassung innerer „offener Punkte", die Kopf-Raum belegen. Kein
// To-do-Druck — ruhig, wertschätzend. Wird mitsynchronisiert.

export type OpenLoopStatus = "offen" | "geklärt";

export interface OpenLoop {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  title: string;
  note?: string;
  status: OpenLoopStatus;
  /** Optional verknüpfter Tagebucheintrag. */
  entryId?: string;
  /** Wann es sich geklärt hat. */
  resolvedAt?: string;
  /** Kurze Zeile: Wie hat es sich geklärt? */
  resolutionNote?: string;
}

// --- Entscheidungs-Rückblick (Selbstführung „Klärung") --------------------
// Entscheidungen festhalten und später ehrlich draufschauen: War es stimmig?
// Baut Selbstkenntnis auf (vgl. „Entscheidungen, die sich später gut anfühlten").

export type DecisionStatus = "offen" | "reflektiert";

export interface Decision {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Die Frage / Entscheidung. */
  question: string;
  /** Wozu neigst du gerade / was hast du entschieden? */
  leaning?: string;
  /** Was erwartest oder erhoffst du? */
  expectation?: string;
  /** Wie stimmig fühlt es sich JETZT an (1..10). */
  feeling: number;
  status: DecisionStatus;
  /** Rückblick. */
  reviewedAt?: string;
  reviewNote?: string;
  /** War es im Rückblick stimmig? */
  feltRight?: boolean | null;
}

// --- Tagesritual (6-Minuten-Ansatz, eigene Formulierung) ------------------
// Kurzes tägliches Ritual aus der Positiven Psychologie: morgens Dankbarkeit/
// Fokus/Selbstbekräftigung, abends Gutes/Lernen/schöne Momente. Eine Karte pro
// Tag (id = Datum YYYY-MM-DD). Bewusst leicht, kein Leistungsdruck.

export interface DailyRitual {
  id: string; // = date (YYYY-MM-DD), genau ein Eintrag pro Tag
  date: string; // YYYY-MM-DD (lokaler Tag)
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Morgen
  gratitude: string[]; // bis 3 Dinge, für die du dankbar bist
  makeGreat?: string; // Was macht den Tag gut?
  affirmation?: string; // „Ich bin …"
  // Abend
  goodDeed?: string; // Was hast du Gutes getan?
  better?: string; // Was wäre besser gegangen?
  goodMoments: string[]; // bis 3 schöne Momente
}

// --- Geräte-Sync ----------------------------------------------------------
// Generischer Sync über alle synchronisierten Tabellen. Pro Datensatz wird nur
// ein „kind" (Tabellenname), eine id, ein Versions-Zeitstempel (ISO) und der
// rohe Datensatz übertragen. Der Server speichert das als Union; gemerged wird
// per Last-Write-Wins (neuerer updatedAt gewinnt). Geräte-spezifische Daten
// (z.B. Einstellungen, Stimme) werden bewusst NICHT synchronisiert.

export type SyncKind =
  | "entries"
  | "chatMessages"
  | "patternSummaries"
  | "stabilityMoments"
  | "patternInsights"
  | "openLoops"
  | "decisions"
  | "dailyRituals";

export interface SyncRecord {
  kind: SyncKind;
  id: string;
  /** Versions-Zeitstempel (ISO). Bei änderbaren Daten updatedAt, sonst createdAt. */
  updatedAt: string;
  /** Tombstone-Marker: true = der Datensatz wurde gelöscht (Lösch-Sync). */
  deleted?: boolean;
  /** Der vollständige Datensatz (bei deleted = leeres Objekt). */
  data: unknown;
}

export interface SyncPullResponse {
  records: SyncRecord[];
}

export interface SyncPushRequest {
  records: SyncRecord[];
}
