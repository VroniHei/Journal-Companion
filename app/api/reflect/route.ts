import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Du bist ein einfühlsamer Begleiter für Tagebuch-Reflexion.
Jemand teilt dir gerade einen Tagebucheintrag. Deine Aufgabe ist es NICHT,
Ratschläge zu erteilen oder zu therapieren, sondern behutsam beim Nachdenken zu helfen.

Antworte auf Deutsch, warm und ruhig. Halte dich kurz (4–7 Sätze). Konkret:
- Spiegele in ein, zwei Sätzen wider, was du an Gefühlen und Themen wahrnimmst.
- Stelle danach ein bis zwei offene, sanfte Fragen, die zum Weiterdenken einladen.
- Bewerte nicht und beschönige nicht. Keine Floskeln, keine Diagnosen.
- Wenn der Eintrag auf eine akute Krise oder Selbstgefährdung hindeutet,
  ermutige freundlich dazu, mit einem Menschen des Vertrauens oder einer
  Beratungsstelle zu sprechen (z. B. Telefonseelsorge 0800 111 0 111).

Sprich die Person direkt mit "du" an.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Kein ANTHROPIC_API_KEY gesetzt. Lege eine .env.local an (siehe .env.local.example).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { text?: string; mood?: string | null };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ungültige Anfrage." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return new Response(
      JSON.stringify({ error: "Der Eintrag ist leer." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = new Anthropic();

  const userMessage = body.mood
    ? `Stimmung: ${body.mood}\n\nEintrag:\n${text}`
    : `Eintrag:\n${text}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        claudeStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await claudeStream.finalMessage();
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unbekannter Fehler.";
        controller.enqueue(encoder.encode(`\n\n[Fehler: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
