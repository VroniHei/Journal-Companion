import { useEffect, type ReactNode } from "react";

/**
 * Desktop-Overlay (APP-STYLE §9): Momente/Fokus-Screens erscheinen ab großen
 * Breiten als zentriertes Modal über gedimmtem Hintergrund mit Schließen-Weg.
 * Reiner Darstellungs-Wrapper: ab `lg` Modal + Scrim, darunter rendert der
 * Inhalt ganz normal als Vollbild-Seite (keine Logikänderung an der Seite).
 */
export function DesktopModal({
  children,
  onClose,
  maxWidth = 560,
}: {
  children: ReactNode;
  onClose: () => void;
  maxWidth?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Scrim nur ab lg */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[90] hidden bg-[rgba(35,34,26,.46)] lg:block"
      />
      {/* Ab lg: zentriertes, scrollbares Modal. Darunter: transparenter
          Passthrough (Inhalt rendert normal im Seitenfluss). */}
      <div className="lg:fixed lg:inset-0 lg:z-[91] lg:flex lg:items-start lg:justify-center lg:overflow-y-auto lg:p-8">
        <div
          className="lg:w-full lg:rounded-[26px] lg:border lg:border-[var(--border)] lg:bg-[var(--surface)] lg:p-7 lg:shadow-[0_40px_90px_rgba(35,34,26,.3)]"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
