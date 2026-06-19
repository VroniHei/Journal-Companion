import type { IncomingMessage, ServerResponse } from "node:http";

// Vercel-Serverless-Einstieg: leitet alle /api/*-Anfragen an die Express-App.
// Die App wird "lazy" importiert, damit ein etwaiger Init-/Bundling-Fehler
// abgefangen und sichtbar gemacht werden kann (statt eines nackten
// FUNCTION_INVOCATION_FAILED). Der ANTHROPIC_API_KEY kommt aus den Vercel-Env-Vars.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const mod = await import("../server/src/app");
    const app = mod.default as unknown as (
      r: IncomingMessage,
      s: ServerResponse,
    ) => void;
    app(req, res);
  } catch (err) {
    const detail =
      err instanceof Error ? (err.stack ?? err.message) : String(err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`INIT_ERROR\n${detail}`);
  }
}
