import { useCallback, useRef, useState } from "react";
import { postStt } from "../lib/apiClient";

// Diktat über serverseitige Spracherkennung (ElevenLabs Scribe, Deutsch).
// Nimmt per MediaRecorder auf, schickt die Aufnahme ans Backend und hängt den
// transkribierten Text an das Feld an. Zuverlässiger für Deutsch als die
// Browser-Spracherkennung.
export function useServerDictation(opts: {
  getBase: () => string;
  onChange: (full: string) => void;
  onActivate?: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        if (blob.size === 0) return;
        setBusy(true);
        try {
          const text = await postStt(blob);
          if (text) {
            const base = optsRef.current.getBase();
            optsRef.current.onChange(base ? `${base} ${text}` : text);
            optsRef.current.onActivate?.();
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Spracherkennung fehlgeschlagen.");
        } finally {
          setBusy(false);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Kein Mikrofon-Zugriff. Bitte erlauben.");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recording) stop();
    else if (!busy) void start();
  }, [recording, busy, start, stop]);

  return { supported, recording, busy, error, toggle };
}
