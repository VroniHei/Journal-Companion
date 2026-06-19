// Vercel Edge Middleware: einfacher HTTP-Basic-Auth-Passwortschutz für die
// gesamte Seite (inkl. /api). So kann nur, wer das Passwort kennt, die App und
// den Claude-Proxy nutzen. Das Passwort kommt aus der Env-Variable ACCESS_PASSWORD.
// Ist sie nicht gesetzt, bleibt die Seite offen (z. B. lokale Entwicklung).

export const config = {
  // Auf alles anwenden außer Vercel-Interna, Favicon und dem harmlosen
  // Diagnose-Endpunkt /api/config (liefert nur true/false-Flags).
  matcher: ["/((?!_vercel/|favicon|api/config).*)"],
};

export default function middleware(request: Request): Response | undefined {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return undefined; // nicht konfiguriert → offen lassen

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const sep = decoded.indexOf(":");
    const provided = sep >= 0 ? decoded.slice(sep + 1) : decoded;
    if (provided === password) return undefined; // Zugang gewährt
  }

  return new Response("Authentifizierung erforderlich.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Innerline", charset="UTF-8"',
    },
  });
}
