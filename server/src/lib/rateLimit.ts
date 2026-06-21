// Leichtgewichtiges, dependency-freies Rate-Limiting (Fixed-Window pro IP).
//
// Zweck: Missbrauchsschutz für die teuren KI-Routen, bevor die App öffentlich
// erreichbar ist — sonst kann ein offener Endpunkt den Anthropic-/ElevenLabs-
// Key teuer machen. Bewusst ohne Zusatz-Abhängigkeit, damit es auch als
// Vercel-Serverless-Funktion ohne Setup läuft.
//
// Grenze: Der Zähler liegt im Prozess-Speicher. Lokal ist das global; auf
// Vercel gilt er pro Instanz (mehrere Lambdas teilen ihn nicht). Das ist als
// erste Bremse trotzdem wirksam; ein verteiltes Limit (z.B. via Supabase/Redis)
// wäre der nächste Schritt, falls nötig.

import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
// Schutz gegen unbegrenztes Wachstum der Map bei vielen verschiedenen IPs.
const MAX_TRACKED = 10_000;

function clientIp(req: Request): string {
  // Hinter Vercel/Proxy steht die echte IP in x-forwarded-for (erste Adresse).
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return xff[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

function sweep(now: number): void {
  for (const [ip, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(ip);
  }
}

export interface RateLimitOptions {
  /** Fenstergröße in Millisekunden (Standard 60 s). */
  windowMs?: number;
  /** Maximale Anfragen pro Fenster und IP. 0 deaktiviert das Limit. */
  max?: number;
}

/**
 * Erstellt eine Express-Middleware, die Anfragen pro IP innerhalb eines
 * Zeitfensters begrenzt. Bei Überschreitung antwortet sie mit HTTP 429 und
 * einer ruhigen deutschen Meldung.
 */
export function rateLimit(opts: RateLimitOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 30;

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // max <= 0 bedeutet: bewusst deaktiviert (z.B. lokale Entwicklung).
    if (max <= 0) {
      next();
      return;
    }

    const now = Date.now();
    if (buckets.size > MAX_TRACKED) sweep(now);

    const ip = clientIp(req);
    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error:
          "Gerade kommen viele Anfragen zusammen. Bitte einen kurzen Moment " +
          `warten (etwa ${retryAfter} Sekunden) und es dann noch einmal versuchen.`,
      });
      return;
    }

    next();
  };
}

// Nur für Tests: setzt den internen Zustand zurück.
export function __resetRateLimit(): void {
  buckets.clear();
}
