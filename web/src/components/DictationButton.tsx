import { useEffect, useRef, useState } from "react";
import { useDictation } from "../hooks/useDictation";
import { useServerDictation } from "../hooks/useServerDictation";
import { getConfig } from "../lib/apiClient";

/**
 * Mikrofon-Button. Bevorzugt serverseitige Spracherkennung (ElevenLabs Scribe,
 * zuverlässiges Deutsch) — Aufnahme → Transkription → Text einfügen. Fällt auf
 * die Browser-Spracherkennung zurück, wenn kein STT konfiguriert ist.
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
  const [cloud, setCloud] = useState(false);

  useEffect(() => {
    let alive = true;
    getConfig()
      .then((c) => {
        if (alive) setCloud(c.hasStt);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const common = {
    getBase: () => valueRef.current,
    onChange,
    onActivate,
  };
  const server = useServerDictation(common);
  const browser = useDictation(common);

  const useServer = cloud && server.supported;

  if (!useServer && !browser.supported && !server.supported) {
    return (
      <span
        className={`text-xs text-[var(--muted)] ${className}`}
        title="Spracheingabe wird in diesem Browser nicht unterstützt (am besten Chrome oder Edge)."
      >
        🎙 nicht verfügbar
      </span>
    );
  }

  const active = useServer ? server.recording : browser.listening;
  const busy = useServer && server.busy;
  const toggle = useServer ? server.toggle : browser.toggle;
  const level = useServer ? server.level : 0;
  const seconds = useServer ? server.seconds : 0;
  const err = useServer ? server.error : null;

  const mmss = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  };

  const label = busy
    ? "Verarbeite…"
    : active
      ? useServer
        ? `Stoppen · ${mmss(seconds)}`
        : "Hört zu… (stopp)"
      : "Sprechen";

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition disabled:opacity-60 ${className}`}
        style={{
          borderColor: active ? "var(--danger)" : "var(--border)",
          background: active
            ? "color-mix(in srgb, var(--danger) 12%, transparent)"
            : "transparent",
          color: active ? "var(--danger)" : "var(--foreground)",
        }}
      >
        <span
          aria-hidden="true"
          className={active || busy ? "animate-pulse" : ""}
        >
          {busy ? "⋯" : active ? "●" : "🎙"}
        </span>
        {label}
      </button>

      {useServer && active && (
        <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--danger)]"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </span>
          Ich höre zu… Text kommt nach dem Stoppen
        </span>
      )}
      {busy && (
        <span className="text-xs text-[var(--muted)]">
          Transkribiere auf Deutsch…
        </span>
      )}
      {err && <span className="text-xs text-[var(--danger)]">{err}</span>}
    </span>
  );
}
