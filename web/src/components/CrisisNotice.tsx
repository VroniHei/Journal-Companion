import type { CrisisLevel } from "@journal/shared/crisis";
import {
  CRISIS_MESSAGE,
  CONCERN_MESSAGE,
  HELP_RESOURCES,
} from "@journal/shared/crisis";

// Warmer, nicht-alarmierender Hinweis, der live am Textfeld erscheint, sobald
// die Krisen-Heuristik anschlägt (Level "concern" weich, "acute" mit
// Ressourcen). Bewusst keine Alarm-/Danger-Optik — ruhig und zugewandt.
export function CrisisNotice({
  level,
  className = "",
}: {
  level: CrisisLevel;
  className?: string;
}) {
  if (level === "none") return null;
  const acute = level === "acute";

  return (
    <div
      role="note"
      aria-live="polite"
      className={`rounded-[18px] border p-4 ${className}`}
      style={{
        borderColor: acute ? "rgba(205,138,91,.45)" : "rgba(203,190,244,.55)",
        background: acute
          ? "linear-gradient(135deg,#FBF1E9,#FBF6F0)"
          : "linear-gradient(135deg,#F4F0FB,#FAF8F4)",
      }}
    >
      <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[var(--foreground)]">
        {acute ? CRISIS_MESSAGE : CONCERN_MESSAGE}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {HELP_RESOURCES.map((r) => (
          <a
            key={r.tel}
            href={`tel:${r.tel}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
            </svg>
            {r.label}: {r.display}
          </a>
        ))}
      </div>
    </div>
  );
}
