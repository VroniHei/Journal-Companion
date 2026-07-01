import type {
  ChatRequest,
  ContactImpulseRequest,
  ContactImpulseResponse,
  CrisisResponse,
  PatternInsightsRequest,
  PatternInsightsResponse,
  ReflectRequest,
  ShareSuggestionRequest,
  ShareSuggestionResponse,
  SummarizeConversationRequest,
  SummarizeConversationResponse,
  SyncPullResponse,
  SyncRecord,
  WeeklyLetterResponse,
  WeeklyReviewRequest,
  WeeklyReviewResponse,
  VoiceReflectRequest,
  VoiceReflectResponse,
} from "@journal/shared";

export async function getConfig(): Promise<{
  hasApiKey: boolean;
  hasTts: boolean;
  hasStt: boolean;
  hasSync: boolean;
}> {
  try {
    const r = await fetch("/api/config");
    const data = await r.json();
    return {
      hasApiKey: Boolean(data.hasApiKey),
      hasTts: Boolean(data.hasTts),
      hasStt: Boolean(data.hasStt),
      hasSync: Boolean(data.hasSync),
    };
  } catch {
    return { hasApiKey: false, hasTts: false, hasStt: false, hasSync: false };
  }
}

/** Erzeugt einen kurzen Titel für einen Eintrag. Leerer String bei Fehler/ohne Key. */
export async function postTitle(text: string, model?: string): Promise<string> {
  try {
    const res = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { title?: string };
    return (data.title ?? "").trim();
  } catch {
    return "";
  }
}

/**
 * Setzt Interpunktion/Absätze in ein Roh-Transkript (mechanisch, schlankes
 * Modell). Gibt bei Fehler/ohne Key den Originaltext zurück — nie blockierend.
 */
export async function postPunctuate(text: string): Promise<string> {
  try {
    const res = await fetch("/api/punctuate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return text;
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim() || text;
  } catch {
    return text;
  }
}

/**
 * Verdichtet ein laufendes Gespräch zu einer kurzen Zusammenfassung. Gibt bei
 * Fehler/ohne Key `null` zurück — nie blockierend; der Aufrufer behält dann die
 * bisherige Zusammenfassung.
 */
export async function summarizeConversation(
  body: SummarizeConversationRequest,
): Promise<string | null> {
  try {
    const res = await fetch("/api/summarize-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SummarizeConversationResponse;
    return (data.summary ?? "").trim() || null;
  } catch {
    return null;
  }
}

/** Holt alle (oder ab `since` geänderten) Sync-Datensätze vom Server. */
export async function pullSync(since?: string): Promise<SyncRecord[]> {
  const url = since
    ? `/api/sync/pull?since=${encodeURIComponent(since)}`
    : "/api/sync/pull";
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
  const data = (await res.json()) as SyncPullResponse;
  return (data.records ?? []).map((r) => ({ ...r, deleted: Boolean(r.deleted) }));
}

/** Schickt neuere lokale Datensätze an den Server (Upsert). */
export async function pushSync(records: SyncRecord[]): Promise<void> {
  if (records.length === 0) return;
  const res = await fetch("/api/sync/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
}

/** Sendet eine Audioaufnahme ans Backend (ElevenLabs STT) und erhält den Text. */
export async function postStt(audio: Blob): Promise<string> {
  const res = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": audio.type || "audio/webm" },
    body: audio,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/** Holt natürliche Sprachausgabe (MP3) vom Backend (ElevenLabs). */
export async function fetchTts(text: string, voiceId?: string): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
  return res.blob();
}

export interface StreamResult {
  crisis: boolean;
  rumination: boolean;
}

async function streamPost(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }

  const crisis = res.headers.get("X-Crisis") === "1";
  const rumination = res.headers.get("X-Rumination") === "1";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
  return { crisis, rumination };
}

export function streamReflect(
  body: ReflectRequest,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  return streamPost("/api/reflect", body, onDelta);
}

export function streamChat(
  body: ChatRequest,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  return streamPost("/api/chat", body, onDelta);
}

export async function postContactImpulse(
  body: ContactImpulseRequest,
): Promise<ContactImpulseResponse | CrisisResponse> {
  const res = await fetch("/api/contact-impulse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as ContactImpulseResponse | CrisisResponse;
}

export async function postWeeklyReview(
  body: WeeklyReviewRequest,
): Promise<WeeklyReviewResponse> {
  const res = await fetch("/api/weekly-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as WeeklyReviewResponse;
}

export async function postWeeklyLetter(
  body: WeeklyReviewRequest,
): Promise<WeeklyLetterResponse> {
  const res = await fetch("/api/weekly-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as WeeklyLetterResponse;
}

export async function postPatternInsights(
  body: PatternInsightsRequest,
): Promise<PatternInsightsResponse> {
  const res = await fetch("/api/pattern-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as PatternInsightsResponse;
}

export async function postShareSuggestion(
  body: ShareSuggestionRequest,
): Promise<ShareSuggestionResponse> {
  const res = await fetch("/api/share-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as ShareSuggestionResponse;
}

export async function postVoiceReflect(
  body: VoiceReflectRequest,
): Promise<VoiceReflectResponse | CrisisResponse> {
  const res = await fetch("/api/voice-reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Fehler ${res.status}`,
    );
  }
  return data as VoiceReflectResponse | CrisisResponse;
}
