import { Router } from "express";
import { z } from "zod";
import { hasApiKey } from "../env";
import { generateText, LIGHT_MODEL, singleUser } from "../services/claude";

// Setzt Interpunktion/Großschreibung/Absätze in ein Roh-Transkript (z. B. aus der
// Browser-Spracherkennung, die keine Satzzeichen liefert). REIN MECHANISCH: die
// Wörter der Person bleiben unverändert, es wird nichts hinzugefügt oder
// umformuliert. Schlankes Modell (Sonnet), günstig. Bei fehlendem Key 503 → der
// Client behält das Roh-Transkript.
export const punctuateRouter = Router();

const schema = z.object({
  text: z.string().min(1).max(8000),
});

const SYSTEM = `Du bekommst ein Roh-Transkript gesprochener Sprache ohne Satzzeichen. Setze Interpunktion (Punkte, Kommas, Frage- und Ausrufezeichen), Großschreibung am Satzanfang und sinnvolle Absätze, sodass natürlich lesbare deutsche Sätze entstehen.

STRENGE REGELN:
- Ändere KEINE Wörter. Füge keine Wörter hinzu und lass keine weg.
- Formuliere nichts um, korrigiere weder Grammatik noch Wortwahl noch Rechtschreibung der Wörter.
- Nur Satzzeichen, Großschreibung und Absätze hinzufügen.
- Wenn schon Satzzeichen vorhanden sind, übernimm sie und ergänze nur Fehlendes.
- Gib ausschließlich den überarbeiteten Text aus. Keine Anführungszeichen, keine Einleitung, kein Kommentar.`;

punctuateRouter.post("/punctuate", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage." });
    return;
  }
  if (!hasApiKey()) {
    res.status(503).json({ error: "Kein API-Key konfiguriert." });
    return;
  }
  const text = parsed.data.text;
  try {
    const raw = await generateText({
      // Mechanischer Kurztext → fest LIGHT_MODEL.
      model: LIGHT_MODEL,
      system: SYSTEM,
      messages: singleUser(text),
      // Ausgabe ~ so lang wie die Eingabe; großzügig, aber gedeckelt.
      maxTokens: Math.min(2000, Math.ceil(text.length / 2) + 200),
      effort: "low",
      think: false,
    });
    const cleaned = raw.trim();
    res.json({ text: cleaned || text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    res.status(502).json({ error: `Interpunktion fehlgeschlagen: ${message}` });
  }
});
