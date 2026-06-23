import { useSpeech } from "../hooks/useSpeech";
import { useSettings } from "../hooks/useData";
import { stripMarkdown } from "../lib/text";

/**
 * „Vorlesen"-Button: liest den (Markdown-bereinigten) Text per Browser-
 * Sprachausgabe vor — mit der in den Einstellungen gewählten Stimme.
 * Blendet sich aus, wenn der Browser das nicht unterstützt.
 */
export function SpeakButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const settings = useSettings();
  const { supported, speaking, speak, stop } = useSpeech({
    voiceURI: settings.speechVoiceURI,
  });
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(stripMarkdown(text)))}
      aria-pressed={speaking}
      aria-label={speaking ? "Vorlesen stoppen" : "Vorlesen"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[13px] text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)] ${className}`}
    >
      <span aria-hidden="true">{speaking ? "■" : "🔊"}</span>
      {speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}
