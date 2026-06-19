import { useCallback, useEffect, useRef, useState } from "react";

// Sprachausgabe per Browser (Web Speech API · SpeechSynthesis). Lokal, ohne
// API-Key/Cloud. Wählt nach Möglichkeit eine deutsche Stimme und liest in
// Satz-Häppchen vor (umgeht den Chrome-Abbruch bei langen Texten).

function pickGermanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const de = voices.filter((v) => v.lang?.toLowerCase().startsWith("de"));
  // Bevorzugt eine lokale/Standard-Stimme, sonst die erste deutsche.
  return de.find((v) => v.localService) ?? de[0] ?? null;
}

export function useSpeech() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voiceRef.current = pickGermanVoice();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
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

      const chunks = clean.match(/[^.!?\n]+[.!?]*/g) ?? [clean];
      const parts = chunks.map((c) => c.trim()).filter(Boolean);
      if (!parts.length) return;

      setSpeaking(true);
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = "de-DE";
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 0.97;
        u.pitch = 1;
        if (i === parts.length - 1) u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      });
    },
    [supported],
  );

  return { supported, speaking, speak, stop };
}
