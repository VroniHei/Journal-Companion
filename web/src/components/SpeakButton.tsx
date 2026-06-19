import { useSpeech } from "../hooks/useSpeech";
import { stripMarkdown } from "../lib/text";

/**
 * „Vorlesen"-Button: liest den (Markdown-bereinigten) Text per Browser-
 * Sprachausgabe vor. Blendet sich aus, wenn der Browser das nicht unterstützt.
 */
export function SpeakButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { supported, speaking, speak, stop } = useSpeech();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(stripMarkdown(text)))}
      aria-pressed={speaking}
      aria-label={speaking ? "Vorlesen stoppen" : "Vorlesen"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)] ${className}`}
    >
      <span aria-hidden="true">{speaking ? "■" : "🔊"}</span>
      {speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}
