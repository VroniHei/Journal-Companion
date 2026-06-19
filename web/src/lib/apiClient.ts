import type {
  ChatRequest,
  ContactImpulseRequest,
  ContactImpulseResponse,
  CrisisResponse,
  PatternInsightsRequest,
  PatternInsightsResponse,
  ReflectRequest,
  WeeklyReviewRequest,
  WeeklyReviewResponse,
  VoiceReflectRequest,
  VoiceReflectResponse,
} from "@journal/shared";

export async function getConfig(): Promise<{
  hasApiKey: boolean;
  hasTts: boolean;
  hasStt: boolean;
}> {
  try {
    const r = await fetch("/api/config");
    const data = await r.json();
    return {
      hasApiKey: Boolean(data.hasApiKey),
      hasTts: Boolean(data.hasTts),
      hasStt: Boolean(data.hasStt),
    };
  } catch {
    return { hasApiKey: false, hasTts: false, hasStt: false };
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
