import { useDictation } from "../hooks/useDictation";

/**
 * Mikrofon-Button: hängt erkannten Sprachtext über `onText` an.
 * Blendet sich aus, wenn der Browser keine Spracherkennung unterstützt.
 */
export function DictationButton({
  onText,
  className = "",
}: {
  onText: (segment: string) => void;
  className?: string;
}) {
  const { supported, listening, toggle } = useDictation(onText);

  if (!supported) {
    return (
      <span
        className={`text-xs text-[var(--muted)] ${className}`}
        title="Spracheingabe wird in diesem Browser nicht unterstützt (am besten Chrome oder Edge)."
      >
        🎙 nicht verfügbar
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${className}`}
      style={{
        borderColor: listening ? "var(--danger)" : "var(--border)",
        background: listening
          ? "color-mix(in srgb, var(--danger) 12%, transparent)"
          : "transparent",
        color: listening ? "var(--danger)" : "var(--foreground)",
      }}
    >
      <span>{listening ? "●" : "🎙"}</span>
      {listening ? "Hört zu… (stopp)" : "Sprechen"}
    </button>
  );
}
