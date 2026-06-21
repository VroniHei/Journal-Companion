import { useCallback, useEffect, useRef, useState } from "react";

// Minimale Typen für die Web Speech API (nicht in den DOM-Standardtypen enthalten).
interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternative;
}
interface SpeechResultList {
  readonly length: number;
  [index: number]: SpeechResult;
}
interface SpeechEvent {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Diktat per Browser-Spracherkennung (Web Speech API, de-DE).
 *
 * Nutzt `interimResults` für sofortiges Feedback: Während des Sprechens wird der
 * laufende (noch nicht finale) Text live mitgeschrieben und nach jedem fertigen
 * Satzstück verfestigt. Das Feld zeigt damit `Basis + gesprochener Text`.
 *
 * - `getBase()` liefert den Feldinhalt beim Start (an den angehängt wird).
 * - `onChange(full)` wird bei jeder Erkennung mit dem vollständigen neuen Wert
 *   aufgerufen (Basis + bisher Gesprochenes, inkl. Live-Zwischenstand).
 * - `onActivate()` feuert einmal, sobald das erste finale Stück erkannt wurde
 *   (z. B. um „per Stimme erstellt" zu markieren).
 */
export function useDictation(opts: {
  getBase: () => string;
  onChange: (full: string) => void;
  onActivate?: () => void;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  // Finale Stücke der Sitzung, indiziert nach result-Index. Pro Index wird der
  // Text ÜBERSCHRIEBEN (nicht angehängt) — egal wie oft ein Browser denselben
  // finalen Treffer (auch mit resultIndex=0) erneut meldet, er zählt nur einmal.
  // Verhindert „ich ich ich …" auf Mobile-Browsern zuverlässig.
  const finalsRef = useRef<string[]>([]);
  const activatedRef = useRef(false);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const supported = Boolean(getCtor());

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true; // Live-Zwischenergebnisse → sofort sichtbar
    baseRef.current = optsRef.current.getBase();
    finalsRef.current = [];
    activatedRef.current = false;

    rec.onresult = (event) => {
      // Alle Ergebnisse durchgehen: finale werden pro Index GESPEICHERT
      // (überschrieben, daher idempotent), Interim pro Event frisch gebaut.
      let interim = "";
      let newFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const t = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const piece = t.trim();
          if (piece && finalsRef.current[i] !== piece) {
            finalsRef.current[i] = piece;
            newFinal = true;
          }
        } else {
          interim += t;
        }
      }
      const finalText = finalsRef.current.filter(Boolean).join(" ");
      const spoken = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
      const base = baseRef.current;
      const full = base ? (spoken ? `${base} ${spoken}` : base) : spoken;
      optsRef.current.onChange(full);

      if (newFinal && !activatedRef.current) {
        activatedRef.current = true;
        optsRef.current.onActivate?.();
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => recRef.current?.abort();
  }, []);

  return { supported, listening, toggle };
}
