// Einmaliger Datenschutz-/Abgrenzungshinweis. Reiner UI-Flag (kein Journaling-Datum),
// daher in localStorage statt in AppSettings.
const KEY = "journal-companion.disclaimerAcceptedAt";

export function isDisclaimerAccepted(): boolean {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function acceptDisclaimer(): void {
  try {
    localStorage.setItem(KEY, new Date().toISOString());
  } catch {
    /* localStorage nicht verfügbar — ignorieren */
  }
}
