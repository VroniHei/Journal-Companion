import type { ReactNode } from "react";

// Renderer für alle Icons. Die Pfade selbst liegen in `iconset.tsx` (ICONS),
// dort auch das Kachel-Token `tileRelief`. Trennung, damit Fast-Refresh sauber
// bleibt (diese Datei exportiert nur die Komponente).
export function Icon({ d, size = 22 }: { d: ReactNode; size?: number }) {
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
      {d}
    </svg>
  );
}
