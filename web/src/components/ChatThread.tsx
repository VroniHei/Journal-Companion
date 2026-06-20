import { useState } from "react";
import type { JournalEntry } from "@journal/shared";
import { Button } from "./ui";
import { DictationButton } from "./DictationButton";
import { FormattedText } from "./FormattedText";
import { SpeakButton } from "./SpeakButton";
import { useMessages, useSettings } from "../hooks/useData";
import { addChatMessage, updateEntry } from "../db/queries";
import { toPrefs } from "../lib/settings";
import { streamChat } from "../lib/apiClient";

function Bubble({
  role,
  text,
  speakable = false,
}: {
  role: "user" | "assistant";
  text: string;
  speakable?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[var(--accent-soft)] px-4 py-2.5 text-sm leading-relaxed">
          {text || "…"}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] shadow-[var(--shadow-card)]">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Begleiter
          </span>
          {speakable && text && <SpeakButton text={text} />}
        </div>
        {text ? (
          <FormattedText text={text} />
        ) : (
          <span className="text-[var(--muted)]">…</span>
        )}
      </div>
    </div>
  );
}

export function ChatThread({ entry }: { entry: JournalEntry }) {
  const messages = useMessages(entry.id);
  const settings = useSettings();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const prior = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput("");
    setError(null);
    setStreamText("");
    setStreaming(true);
    await addChatMessage(entry.id, "user", text);

    try {
      let acc = "";
      const result = await streamChat(
        {
          entry,
          conversationSummary: entry.conversationSummary,
          recentMessages: prior,
          userMessage: text,
          prefs: toPrefs(settings),
        },
        (delta) => {
          acc += delta;
          setStreamText(acc);
        },
      );
      await addChatMessage(entry.id, "assistant", acc);
      if (result.crisis && !entry.crisisFlag) {
        await updateEntry(entry.id, { crisisFlag: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--muted)]">
        Weiter darüber sprechen
      </h2>

      {(messages.length > 0 || streaming) && (
        <div className="space-y-2">
          {messages.map((m) => (
            <Bubble
              key={m.id}
              role={m.role}
              text={m.content}
              speakable={m.role === "assistant"}
            />
          ))}
          {streaming && <Bubble role="assistant" text={streamText} />}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          placeholder="Schreib dem Begleiter…  (Cmd/Strg+Enter sendet)"
          rows={2}
          className="flex-1 resize-y rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <div className="flex flex-col gap-2">
          <Button onClick={send} disabled={!input.trim() || streaming}>
            {streaming ? "…" : "Senden"}
          </Button>
          <DictationButton value={input} onChange={setInput} />
        </div>
      </div>
    </div>
  );
}
