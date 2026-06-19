import { Router } from "express";
import { z } from "zod";
import { env, hasTts } from "../env";

// Natürliche Sprachausgabe über ElevenLabs. Der Key bleibt im Backend; das
// Frontend schickt nur den vorzulesenden Text und bekommt MP3-Audio zurück.
export const ttsRouter = Router();

const schema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
});

ttsRouter.post("/tts", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  if (!hasTts()) {
    res.status(503).json({
      error: "Keine Sprachausgabe konfiguriert (ELEVENLABS_API_KEY fehlt).",
    });
    return;
  }

  const text = parsed.data.text.slice(0, 1500);
  const voiceId = parsed.data.voiceId || env.elevenLabsVoiceId;

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": env.elevenLabsApiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      res
        .status(502)
        .json({ error: `TTS-Fehler: ${r.status} ${detail.slice(0, 200)}` });
      return;
    }

    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(audio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `TTS-Fehler: ${message}` });
  }
});
