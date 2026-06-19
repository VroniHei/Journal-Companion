import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTts, getConfig } from "../lib/apiClient";

// Sprachausgabe. Bevorzugt die natürliche neuronale Stimme (ElevenLabs über das
// Backend), wenn konfiguriert; sonst Fallback auf die Browser-Sprachausgabe.
//
// Die Wiedergabe ist GLOBAL (modul-weite Referenz + Abbruch-Token): Es läuft
// immer höchstens ein Ton, und „Stopp" bricht ihn zuverlässig ab — auch wenn er
// von einer anderen Schaltfläche gestartet wurde oder gerade noch lädt.

const MALE_HINTS = [
  "stefan", "conrad", "markus", "hans", "viktor",
  "klaus", "bernd", "fabian", "jonas", "male", "männ", "mann",
];

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playToken = 0;
// Instanzen, die ihren „speaking"-Zustand zurücksetzen wollen, wenn global gestoppt wird.
const stopListeners = new Set<() => void>();

function hardStop() {
  playToken++; // macht laufende/ladende Wiedergaben ungültig
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  stopListeners.forEach((fn) => fn());
}

function germanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith("de"));
}

function pickVoice(preferredURI?: string): SpeechSynthesisVoice | null {
  const de = germanVoices();
  if (!de.length) return null;
  if (preferredURI) {
    const exact = de.find((v) => v.voiceURI === preferredURI);
    if (exact) return exact;
  }
  const male = de.find((v) =>
    MALE_HINTS.some((h) => v.name.toLowerCase().includes(h)),
  );
  return male ?? de.find((v) => v.localService) ?? de[0];
}

/** Reaktive Liste der verfügbaren deutschen Browser-Stimmen (für die Auswahl). */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(germanVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

function browserSpeak(text: string, voiceURI: string | undefined, token: number, onEnd: () => void) {
  const voice = pickVoice(voiceURI);
  const chunks = text.match(/[^.!?\n]+[.!?]*/g) ?? [text];
  const parts = chunks.map((c) => c.trim()).filter(Boolean);
  if (!parts.length) {
    onEnd();
    return;
  }
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = "de-DE";
    if (voice) u.voice = voice;
    u.rate = 1;
    u.pitch = 0.85;
    if (i === parts.length - 1)
      u.onend = () => {
        if (token === playToken) onEnd();
      };
    u.onerror = () => {
      if (token === playToken) onEnd();
    };
    window.speechSynthesis.speak(u);
  });
}

export function useSpeech(opts?: { voiceURI?: string }) {
  const browserSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [cloud, setCloud] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  useEffect(() => {
    let alive = true;
    getConfig()
      .then((c) => {
        if (alive) setCloud(c.hasTts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Auf globalen Stopp reagieren (z. B. wenn anderswo Vorlesen gestartet wird).
  useEffect(() => {
    const reset = () => setSpeaking(false);
    stopListeners.add(reset);
    return () => {
      stopListeners.delete(reset);
    };
  }, []);

  const stop = useCallback(() => {
    hardStop();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      hardStop(); // bricht alles Vorherige ab und vergibt neuen Token
      const token = playToken;
      setSpeaking(true);

      const finish = () => {
        if (token === playToken) {
          setSpeaking(false);
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
            currentUrl = null;
          }
          currentAudio = null;
        }
      };

      const fallback = () => {
        if (token !== playToken) return;
        if (browserSupported) browserSpeak(clean, optsRef.current?.voiceURI, token, finish);
        else setSpeaking(false);
      };

      if (cloud) {
        fetchTts(clean)
          .then((blob) => {
            if (token !== playToken) return; // zwischenzeitlich gestoppt
            const url = URL.createObjectURL(blob);
            currentUrl = url;
            const audio = new Audio(url);
            currentAudio = audio;
            audio.onended = finish;
            audio.onerror = () => fallback();
            return audio.play();
          })
          .catch(() => fallback());
      } else {
        fallback();
      }
    },
    [browserSupported, cloud],
  );

  // Beim Verlassen nur stoppen, wenn DIESE Instanz gerade vorliest.
  useEffect(
    () => () => {
      if (speakingRef.current) hardStop();
    },
    [],
  );

  return { supported: cloud || browserSupported, cloud, speaking, speak, stop };
}
