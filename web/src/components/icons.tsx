import type { ReactNode } from "react";

// Eine Quelle für alle Inline-SVG-Icons der App (24er-Viewbox, stroke, round).
// Wird in Layout, Karten und Screens genutzt, damit überall dasselbe Set gilt.
export function Icon({ d, size = 22 }: { d: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}

export const ICONS = {
  home: (
    <>
      <path d="M3 10.8 12 4l9 6.8" />
      <path d="M5.5 9.6V20h13V9.6" />
    </>
  ),
  wave: <path d="M4 15 C7.5 15 8.5 7 12 7 C15.5 7 16.5 16 20 11" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  // Kontaktimpuls = Sprechblase (Claude Design).
  chat: <path d="M4 5.5h16v10H9l-4 3.4V15.5H4z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.9 9.1 11 11l-1.9 3.9 3.9-1.9 1.9-3.9z" />
    </>
  ),
  // Tagesritual = Sonnenaufgang. Eine Variante überall (Profil, Karten, FAB,
  // Dashboard-Ritual-Badge) für einen einheitlichen Wiedererkennungswert.
  sun: (
    <>
      <path d="M3 18h18M5.6 18a6.4 6.4 0 0 1 12.8 0" />
      <path d="M12 4.5v2.4M5 9l1.6 1.2M19 9l-1.6 1.2" />
    </>
  ),
  pen: (
    <>
      <path d="M12 19l7-7-3-3-7 7-1 4 4-1z" />
      <path d="M15 6l3 3" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  // Routine-Wechsel (Claude Design).
  swap: (
    <>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M18 3v3.5h-3.5M6 21v-3.5h3.5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </>
  ),
} as const;
