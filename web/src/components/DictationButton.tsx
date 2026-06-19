import { useRef } from "react";
import { useDictation } from "../hooks/useDictation";

/**
 * Mikrofon-Button: schreibt erkannten Sprachtext live in das Feld.
 * `value` ist der aktuelle Feldinhalt, `onChange` setzt den neuen Gesamtwert
 * (Basis + Gesprochenes). Blendet sich aus, wenn der Browser keine
 * Spracherkennung unterstützt.
 */
export function DictationButton({
  value,
  onChange,
  onActivate,
  className = "",
}: {
  value: string;
  onChange: (full: string) => void;
  onActivate?: () => void;
  className?: string;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const { supported, listening, toggle } = useDictation({
    getBase: () => valueRef.current,
    onChange,
    onActivate,
  });

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
      <span aria-hidden="true" className={listening ? "animate-pulse" : ""}>
        {listening ? "●" : "🎙"}
      </span>
      {listening ? "Hört zu… (stopp)" : "Sprechen"}
    </button>
  );
}
