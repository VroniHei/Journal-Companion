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
