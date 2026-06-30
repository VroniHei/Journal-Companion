import { useEffect, useRef, useState } from "react";
import { useDictation } from "../hooks/useDictation";
import { useServerDictation } from "../hooks/useServerDictation";
import { useSettings } from "../hooks/useData";
import { getConfig, postPunctuate } from "../lib/apiClient";
import { looksUnpunctuated } from "../lib/text";

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
  // Nach einem Server-STT-Fehler (z.B. Guthaben leer) kann auf das
  // Browser-Mikrofon umgeschaltet werden, damit man nicht festhängt.
  const [forceBrowser, setForceBrowser] = useState(false);

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

  // Nach dem Diktat Satzzeichen/Absätze setzen — aber nur, wenn der Text wie ein
  // unpunktierter „Worthaufen" wirkt (Browser-Spracherkennung). Mechanisch, ändert
  // keine Wörter; bei Fehler/ohne Key bleibt das Roh-Transkript.
  const [polishing, setPolishing] = useState(false);
  async function handleResult(full: string) {
    if (!looksUnpunctuated(full)) return;
    setPolishing(true);
    try {
      const improved = await postPunctuate(full);
      // Nur ersetzen, wenn der Feldinhalt seit dem Diktat unverändert ist.
      if (improved && improved !== full && valueRef.current === full) {
        onChange(improved);
      }
    } finally {
      setPolishing(false);
    }
  }

  const common = {
    getBase: () => valueRef.current,
    onChange,
    onActivate,
    onResult: handleResult,
  };
  const server = useServerDictation(common);
  const browser = useDictation(common);

  const settings = useSettings();
  // Kostenlos zuerst: ElevenLabs (kostet Guthaben) nur, wenn der Browser keine
  // Spracherkennung kann — oder wenn die Nutzerin es ausdrücklich bevorzugt.
  const preferFree = settings.preferFreeSpeech !== false;
  const serverAvailable = cloud && server.supported;
  const useServer =
    !forceBrowser &&
    serverAvailable &&
    !(preferFree && browser.supported);

  if (!useServer && !browser.supported && !server.supported) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] ${className}`}
        title="Spracheingabe wird in diesem Browser nicht unterstützt (am besten Chrome oder Edge)."
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
          <path d="M4 4l16 16" />
        </svg>
        Sprache nicht verfügbar
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
          className={`inline-flex ${active || busy ? "animate-pulse" : ""}`}
        >
          {busy ? (
            // Spinner (Punkte-Ersatz)
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          ) : active ? (
            // Aufnahme läuft: Stopp-Quadrat
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          ) : (
            // Mikrofon
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
            </svg>
          )}
        </span>
        {label}
      </button>

      {useServer && active && (
        <span className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--danger)]"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </span>
          Ich höre zu… Text kommt nach dem Stoppen
        </span>
      )}
      {useServer && active && seconds >= 60 && (
        <span className="text-[13px] text-[var(--clay,#8a4f2a)]">
          Aufnahme wird lang – das verbraucht Sprach-Guthaben.
        </span>
      )}
      {busy && (
        <span aria-live="polite" className="text-[13px] text-[var(--muted)]">
          Transkribiere auf Deutsch…
        </span>
      )}
      {polishing && (
        <span aria-live="polite" className="text-[13px] text-[var(--muted)]">
          Setze Sätze und Satzzeichen…
        </span>
      )}
      {err && (
        <span role="alert" className="text-[13px] text-[var(--danger)]">
          {err}
        </span>
      )}
      {err && browser.supported && (
        <button
          type="button"
          onClick={() => {
            setForceBrowser(true);
            browser.toggle();
          }}
          className="text-[13px] font-medium text-[var(--accent-text)] hover:underline"
        >
          Stattdessen Browser-Mikrofon nutzen
        </button>
      )}
    </span>
  );
}
