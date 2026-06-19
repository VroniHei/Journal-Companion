import { Router, raw } from "express";
import { env, hasStt } from "../env";

// Spracherkennung (Deutsch) über ElevenLabs Speech-to-Text („Scribe").
// Der Client schickt die Audioaufnahme als Rohdaten; der Key bleibt im Backend.
export const sttRouter = Router();

sttRouter.post(
  "/stt",
  raw({
    type: ["audio/*", "application/octet-stream"],
    limit: "25mb",
  }),
  async (req, res) => {
    if (!hasStt()) {
      res
        .status(503)
        .json({ error: "Keine Spracherkennung konfiguriert (ELEVENLABS_API_KEY)." });
      return;
    }
    const buf = req.body as Buffer;
    if (!buf || buf.length === 0) {
      res.status(400).json({ error: "Keine Audiodaten empfangen." });
      return;
    }

    try {
      const type =
        (req.headers["content-type"] as string | undefined) ?? "audio/webm";
      const ext = type.includes("mp4")
        ? "mp4"
        : type.includes("ogg")
          ? "ogg"
          : type.includes("mpeg") || type.includes("mp3")
            ? "mp3"
            : "webm";
      const form = new FormData();
      form.append("file", new Blob([buf], { type }), `aufnahme.${ext}`);
      form.append("model_id", "scribe_v1");
      form.append("language_code", "de");

      const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": env.elevenLabsApiKey },
        body: form,
      });

      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        res
          .status(502)
          .json({ error: `STT-Fehler: ${r.status} ${detail.slice(0, 200)}` });
        return;
      }

      const data = (await r.json()) as { text?: string };
      res.json({ text: (data.text ?? "").trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
      res.status(502).json({ error: `STT-Fehler: ${message}` });
    }
  },
);
