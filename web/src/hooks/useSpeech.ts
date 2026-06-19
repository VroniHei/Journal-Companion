import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTts, getConfig } from "../lib/apiClient";

// Sprachausgabe. Bevorzugt die natürliche neuronale Stimme (ElevenLabs über das
// Backend), wenn konfiguriert; sonst Fallback auf die Browser-Sprachausgabe
// (Web Speech API). Die Tagebuchtexte bleiben lokal — nur der vorzulesende
// Begleiter-Text geht (bei Cloud-Stimme) an das eigene Backend → ElevenLabs.

const MALE_HINTS = [
  "stefan", "conrad", "markus", "hans", "viktor",
  "klaus", "bernd", "fabian", "jonas", "male", "männ", "mann",
];

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

function browserSpeak(text: string, voiceURI?: string, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const voice = pickVoice(voiceURI);
  const chunks = text.match(/[^.!?\n]+[.!?]*/g) ?? [text];
  const parts = chunks.map((c) => c.trim()).filter(Boolean);
  if (!parts.length) {
    onEnd?.();
    return;
  }
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = "de-DE";
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 0.9;
    if (i === parts.length - 1) u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  });
}

export function useSpeech(opts?: { voiceURI?: string }) {
  const browserSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [cloud, setCloud] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

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

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanupAudio();
    if (browserSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [browserSupported, cleanupAudio]);

  const speak = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      cleanupAudio();
      if (browserSupported) window.speechSynthesis.cancel();

      const fallback = () => {
        if (browserSupported) {
          browserSpeak(clean, optsRef.current?.voiceURI, () =>
            setSpeaking(false),
          );
        } else {
          setSpeaking(false);
        }
      };

      setSpeaking(true);
      if (cloud) {
        fetchTts(clean)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            urlRef.current = url;
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              setSpeaking(false);
              cleanupAudio();
            };
            audio.onerror = () => fallback();
            return audio.play();
          })
          .catch(() => fallback());
      } else {
        fallback();
      }
    },
    [browserSupported, cloud, cleanupAudio],
  );

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (browserSupported) window.speechSynthesis.cancel();
    };
  }, [browserSupported, cleanupAudio]);

  return { supported: cloud || browserSupported, cloud, speaking, speak, stop };
}
