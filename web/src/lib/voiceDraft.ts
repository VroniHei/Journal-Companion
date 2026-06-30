import type { VoiceDraft } from "@journal/shared";

// Reine, testbare Regeln rund um Sprach-Entwürfe. Die Dexie-Zugriffe liegen in
// db/queries.ts und nutzen diese Prädikate.

const HOUR = 60 * 60 * 1000;
/** Bis zu diesem Alter wird ein Entwurf zum Wiederherstellen angeboten. */
export const VOICE_DRAFT_OFFER_MAX_AGE_MS = 24 * HOUR;
/** Ab diesem Alter (oder wenn verworfen) wird ein Entwurf aufgeräumt. */
export const VOICE_DRAFT_CLEANUP_AGE_MS = 48 * HOUR;

/** Soll dieser Entwurf beim Öffnen ruhig zum Wiederherstellen angeboten werden? */
export function isOfferableVoiceDraft(d: VoiceDraft, now = Date.now()): boolean {
  if (d.status !== "aktiv") return false;
  if (!d.transcript.trim()) return false;
  return now - new Date(d.updatedAt).getTime() <= VOICE_DRAFT_OFFER_MAX_AGE_MS;
}

/** Darf dieser Entwurf beim App-Start entfernt werden (verworfen oder zu alt)? */
export function isStaleVoiceDraft(d: VoiceDraft, now = Date.now()): boolean {
  if (d.status === "verworfen") return true;
  return now - new Date(d.updatedAt).getTime() > VOICE_DRAFT_CLEANUP_AGE_MS;
}
