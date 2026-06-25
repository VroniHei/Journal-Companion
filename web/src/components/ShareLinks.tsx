import { Link } from "react-router-dom";

// Zentrale Links der „Was sich zeigt"-Kachel — vorher 3× inline dupliziert
// (Dashboard Mobile/Desktop + Muster). Ein Ort für Markup + Icons.

// Upload-/Teilen-Icon (Lucide „share").
function UploadGlyph({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M12 14V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M5 12.5V18.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12.5" />
    </svg>
  );
}

/**
 * „Als Karte teilen"-Link. `full` = volle Breite (Desktop-Spalte mit Hover-Lift),
 * sonst kompakte Pille (Mobile/Muster).
 */
export function ShareCardLink({ full = false }: { full?: boolean }) {
  return (
    <Link
      to="/teilen"
      className={
        full
          ? "flex w-full flex-none items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--foreground)]"
          : "inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[7px] text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
      }
    >
      <UploadGlyph size={full ? 16 : 15} />
      Als Karte teilen
    </Link>
  );
}

/** „Roter Faden ansehen"-Link mit Pfeil. */
export function RoterFadenLink() {
  return (
    <Link
      to="/roter-faden"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--green-text,#447510)]"
    >
      Roter Faden ansehen
      <svg
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="15"
        height="15"
        aria-hidden="true"
      >
        <path d="M4 9h10M9.5 4.5 14 9l-4.5 4.5" />
      </svg>
    </Link>
  );
}
