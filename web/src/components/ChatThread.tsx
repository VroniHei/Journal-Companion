import { useState } from "react";
import type { JournalEntry, ReflectionContext } from "@journal/shared";
import { Button } from "./ui";
import { DictationButton } from "./DictationButton";
import { FormattedText } from "./FormattedText";
import { SpeakButton } from "./SpeakButton";
import { useMessages, useSettings } from "../hooks/useData";
import { addChatMessage, updateEntry } from "../db/queries";
import { toPrefs } from "../lib/settings";
import { buildChatContext } from "../lib/context";
import { streamChat, summarizeConversation } from "../lib/apiClient";

// So viele Nachrichten bleiben unverdichtet im Kurzfenster (wörtlich im Prompt);
// alles Ältere wird in `conversationSummary` gefaltet. Hält den (teuren) Opus-
// Chat-Prompt schlank, ohne früheren Kontext zu verlieren.
const SUMMARY_TAIL = 6;

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
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]">
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
  // Bei Streaming-Abbruch: dieselbe Nachricht erneut senden können, ohne sie neu
  // einzutippen (die Nutzer-Nachricht ist bereits gespeichert).
  const [retry, setRetry] = useState<(() => void) | null>(null);

  // Faltet die älteren Nachrichten (jenseits des Kurzfensters) in eine kompakte,
  // fortschreibbare `conversationSummary`. Läuft im Hintergrund und schluckt
  // Fehler still — die Zusammenfassung ist nur eine Gedächtnisstütze.
  async function maybeSummarize(
    all: { role: "user" | "assistant"; content: string }[],
  ) {
    if (all.length <= SUMMARY_TAIL) return;
    // Höchstens die letzten 60 älteren Nachrichten (Server-Limit); der Rest ist
    // bereits in der bisherigen Zusammenfassung aufgehoben.
    const older = all.slice(0, all.length - SUMMARY_TAIL).slice(-60);
    const summary = await summarizeConversation({
      entry: {
        text: entry.text,
        topics: entry.topics,
        emotions: entry.emotions,
        needs: entry.needs,
      },
      previousSummary: entry.conversationSummary,
      messages: older,
    });
    if (summary && summary !== entry.conversationSummary) {
      await updateEntry(entry.id, { conversationSummary: summary });
    }
  }

  // Streamt die Antwort auf eine bereits gespeicherte Nutzer-Nachricht. `prior`
  // ist der Verlauf VOR dieser Nachricht, `text` ihr Inhalt. Schlägt es fehl,
  // wird ein Retry hinterlegt, der exakt diesen Aufruf wiederholt.
  async function runStream(
    prior: { role: "user" | "assistant"; content: string }[],
    text: string,
    context: ReflectionContext,
  ) {
    setError(null);
    setRetry(null);
    setStreamText("");
    setStreaming(true);
    try {
      let acc = "";
      const result = await streamChat(
        {
          entry,
          conversationSummary: entry.conversationSummary,
          recentMessages: prior,
          userMessage: text,
          context,
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
      // Laufende Verdichtung im Hintergrund (schlankes Modell), sobald das
      // Gespräch über das Kurzfenster hinauswächst. Best-effort, nie blockierend.
      void maybeSummarize([
        ...prior,
        { role: "user", content: text },
        { role: "assistant", content: acc },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setRetry(() => () => {
        void runStream(prior, text, context);
      });
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const prior = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput("");
    await addChatMessage(entry.id, "user", text);
    // Hintergrundwissen (Muster + kompakter Digest) einmal pro Nachricht laden;
    // der Retry verwendet denselben Kontext.
    const context = await buildChatContext(entry);
    void runStream(prior, text, context);
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
        <div className="space-y-1">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
          {retry && !streaming && (
            <button
              type="button"
              onClick={retry}
              className="text-sm font-medium text-[var(--accent-text)] hover:underline"
            >
              Erneut versuchen
            </button>
          )}
        </div>
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
