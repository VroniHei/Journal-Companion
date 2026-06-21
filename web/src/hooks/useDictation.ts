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
  // Bereits festgeschriebener Text über alle Mini-Sitzungen hinweg. Statt im
  // `continuous`-Modus zu laufen (Mobile-Chrome re-segmentiert und doppelt dann
  // „ich ich ich …"), nutzen wir kurze Sitzungen (continuous=false) und schreiben
  // das Finale JEDER Sitzung GENAU EINMAL hier fest. Danach Auto-Neustart.
  const committedRef = useRef("");
  // Finale der aktuellen Mini-Sitzung (wird beim Sitzungsende committet).
  const sessionFinalRef = useRef("");
  const activatedRef = useRef(false);
  // true, sobald die Nutzerin selbst gestoppt hat → kein Auto-Neustart mehr.
  const userStopRef = useRef(false);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const supported = Boolean(getCtor());

  const emit = useCallback((interim: string) => {
    const spoken = `${committedRef.current} ${sessionFinalRef.current} ${interim}`
      .replace(/\s+/g, " ")
      .trim();
    const base = baseRef.current;
    const full = base ? (spoken ? `${base} ${spoken}` : base) : spoken;
    optsRef.current.onChange(full);
  }, []);

  const stop = useCallback(() => {
    userStopRef.current = true;
    recRef.current?.stop();
    setListening(false);
  }, []);

  // Eine kurze Erkennungs-Sitzung starten; bei normalem Ende automatisch erneut,
  // solange die Nutzerin nicht selbst gestoppt hat.
  const launch = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "de-DE";
    rec.continuous = false; // kurze Sitzung → keine Re-Segmentierungs-Doppler
    rec.interimResults = true;
    sessionFinalRef.current = "";

    rec.onresult = (event) => {
      let finalSeg = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const t = result[0]?.transcript ?? "";
        if (result.isFinal) finalSeg += `${t} `;
        else interim += t;
      }
      sessionFinalRef.current = finalSeg.replace(/\s+/g, " ").trim();
      emit(interim);
      if (sessionFinalRef.current && !activatedRef.current) {
        activatedRef.current = true;
        optsRef.current.onActivate?.();
      }
    };
    rec.onerror = (e) => {
      // „no-speech"/„aborted" sind harmlos; nur bei echten Fehlern abbrechen.
      if (e.error !== "no-speech" && e.error !== "aborted") {
        userStopRef.current = true;
      }
    };
    rec.onend = () => {
      // Finale dieser Sitzung GENAU EINMAL festschreiben.
      if (sessionFinalRef.current) {
        committedRef.current = `${committedRef.current} ${sessionFinalRef.current}`
          .replace(/\s+/g, " ")
          .trim();
        sessionFinalRef.current = "";
        emit("");
      }
      if (userStopRef.current) {
        setListening(false);
      } else {
        // Weiterhören: nächste kurze Sitzung.
        try {
          launch();
        } catch {
          setListening(false);
        }
      }
    };
    recRef.current = rec;
    rec.start();
  }, [emit]);

  const start = useCallback(() => {
    if (!getCtor()) return;
    baseRef.current = optsRef.current.getBase();
    committedRef.current = "";
    sessionFinalRef.current = "";
    activatedRef.current = false;
    userStopRef.current = false;
    setListening(true);
    launch();
  }, [launch]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      userStopRef.current = true; // kein Auto-Neustart nach Unmount
      recRef.current?.abort();
    };
  }, []);

  return { supported, listening, toggle };
}
