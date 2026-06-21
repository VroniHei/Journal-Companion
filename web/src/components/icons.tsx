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
  wave: <path d="M4 16 C8 16 9 7 12 7 C15 7 16 17 20 11" />,
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
  heart: <path d="M12 20s-7-4.3-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.7 12 20 12 20z" />,
  mic: (
    <path d="M12 4v8m0 0a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v3a3 3 0 0 0 3 3zM7 11a5 5 0 0 0 10 0M12 16v3" />
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 4-4 2 2-4z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  pen: (
    <>
      <path d="M12 19l7-7-3-3-7 7-1 4 4-1z" />
      <path d="M15 6l3 3" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  swap: (
    <>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </>
  ),
} as const;
