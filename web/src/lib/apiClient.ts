import type {
  ChatRequest,
  ContactImpulseRequest,
  ContactImpulseResponse,
  CrisisResponse,
  ReflectRequest,
} from "@journal/shared";

export async function getConfig(): Promise<{ hasApiKey: boolean }> {
  try {
    const r = await fetch("/api/config");
    return await r.json();
  } catch {
    return { hasApiKey: false };
  }
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
