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
  /** Laufende Gesprächs-Zusammenfassung (für günstigeres Chat-Prompting). */
  conversationSummary?: string;
  crisisFlag: boolean;
  ruminationFlag: boolean;
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
