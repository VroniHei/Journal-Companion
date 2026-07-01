import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./ui";

export type ConfirmConfig = {
  /** Ruhige, klare Frage als Überschrift. */
  title: string;
  /** Optionaler erläuternder Satz (z. B. „kann nicht rückgängig gemacht werden"). */
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destruktive Aktion → gefüllter Brick-Ton für den Bestätigen-Button. */
  danger?: boolean;
};

/**
 * Ruhiger In-App-Bestätigungsdialog (ersetzt natives `confirm()`): zentriertes
 * Panel im App-Stil über gedimmtem Hintergrund, auf allen Breiten. Der Fokus
 * startet bewusst auf „Abbrechen" (sichere Aktion), Escape und Klick auf den
 * Hintergrund brechen ab.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmConfig & {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(35,34,26,.46)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_40px_90px_rgba(35,34,26,.3)]"
      >
        <h2 id={titleId} className="serif text-xl font-semibold">
          {title}
        </h2>
        {body && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {body}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {danger ? (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--danger)] px-5 py-2.5 text-sm font-semibold text-white transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
            >
              {confirmLabel}
            </button>
          ) : (
            <Button onClick={onConfirm}>{confirmLabel}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
