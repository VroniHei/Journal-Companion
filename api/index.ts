// Vercel-Serverless-Einstieg: leitet alle /api/*-Anfragen an die Express-App.
// Vercel ruft die App als (req, res)-Handler auf. Der ANTHROPIC_API_KEY kommt
// aus den Vercel-Environment-Variablen (nie im Frontend).
import app from "../server/src/app";

export default app;
