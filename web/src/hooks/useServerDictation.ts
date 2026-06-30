import { useCallback, useRef, useState } from "react";
import { postStt } from "../lib/apiClient";

// Diktat über serverseitige Spracherkennung (ElevenLabs Scribe, Deutsch).
// Aufnehmen → Transkribieren → Text anhängen. Da es keine Live-Transkription
// gibt, liefert der Hook Live-Feedback (Pegel + Sekunden), damit klar ist, dass
// die Aufnahme läuft.
export function useServerDictation(opts: {
  getBase: () => string;
  onChange: (full: string) => void;
  onActivate?: () => void;
  /** Feuert am Ende einer Transkription mit dem vollständigen Feldtext. */
  onResult?: (full: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  function pickMime(): string | undefined {
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported)
      return undefined;
    return [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ].find((c) => MediaRecorder.isTypeSupported(c));
  }

  const cleanupMeter = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current != null) clearInterval(timerRef.current);
    timerRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setLevel(0);
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const w = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) {
          const x = (v - 128) / 128;
          sum += x * x;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* Pegel optional — ohne ist die Aufnahme trotzdem ok */
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startMeter(stream);
      timerRef.current = window.setInterval(
        () => setSeconds((s) => s + 1),
        1000,
      );
      const mime = pickMime();
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cleanupMeter();
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || mime || "audio/webm",
        });
        if (blob.size === 0) return;
        setBusy(true);
        try {
          const text = await postStt(blob);
          if (text) {
            const base = optsRef.current.getBase();
            const full = base ? `${base} ${text}` : text;
            optsRef.current.onChange(full);
            optsRef.current.onActivate?.();
            optsRef.current.onResult?.(full);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Spracherkennung fehlgeschlagen.",
          );
        } finally {
          setBusy(false);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      cleanupMeter();
      setError("Kein Mikrofon-Zugriff. Bitte erlauben.");
    }
  }, [cleanupMeter, startMeter]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recording) stop();
    else if (!busy) void start();
  }, [recording, busy, start, stop]);

  return { supported, recording, busy, error, level, seconds, toggle };
}
