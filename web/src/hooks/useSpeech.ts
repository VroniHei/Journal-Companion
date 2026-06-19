import { useCallback, useEffect, useRef, useState } from "react";

// Sprachausgabe per Browser (Web Speech API · SpeechSynthesis). Lokal, ohne
// API-Key/Cloud. Wählt nach Möglichkeit eine deutsche (bevorzugt männliche)
// Stimme, liest tief/ruhig und in Satz-Häppchen vor (umgeht den Chrome-Abbruch
// bei langen Texten). Hinweis: Die Qualität hängt von den Stimmen des
// Betriebssystems ab — für eine wirklich organische Stimme braucht es Cloud-TTS.

const MALE_HINTS = [
  "stefan",
  "conrad",
  "markus",
  "hans",
  "viktor",
  "klaus",
  "bernd",
  "fabian",
  "jonas",
  "male",
  "männ",
  "mann",
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
  if (male) return male;
  return de.find((v) => v.localService) ?? de[0];
}

/** Reaktive Liste der verfügbaren deutschen Stimmen (für die Auswahl). */
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

export function useSpeech(opts?: {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
}) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!supported) return;
    // Stimmen vorab laden (manche Browser liefern sie erst nach diesem Event).
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener("voiceschanged", warm);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", warm);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      const clean = text.trim();
      if (!clean) return;
      window.speechSynthesis.cancel();

      const voice = pickVoice(optsRef.current?.voiceURI);
      // Tief & ruhig: etwas langsamer, tiefere Tonhöhe → weniger „Roboter".
      const rate = optsRef.current?.rate ?? 0.9;
      const pitch = optsRef.current?.pitch ?? 0.85;

      const chunks = clean.match(/[^.!?\n]+[.!?]*/g) ?? [clean];
      const parts = chunks.map((c) => c.trim()).filter(Boolean);
      if (!parts.length) return;

      setSpeaking(true);
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = "de-DE";
        if (voice) u.voice = voice;
        u.rate = rate;
        u.pitch = pitch;
        if (i === parts.length - 1) u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      });
    },
    [supported],
  );

  return { supported, speaking, speak, stop };
}
