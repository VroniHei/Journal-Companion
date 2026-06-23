import { useState } from "react";
import { acceptDisclaimer, isDisclaimerAccepted } from "../lib/disclaimer";
import { Button } from "./ui";
import { HelpLine } from "./HelpLine";

export function DisclaimerGate() {
  const [accepted, setAccepted] = useState(isDisclaimerAccepted);

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="serif text-xl font-semibold">Bevor wir starten</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Diese App ersetzt keine Therapie. Sie hilft dir beim Sortieren,
          Reflektieren und Stabilisieren. Deine Einträge werden lokal auf deinem
          Gerät gespeichert. Wenn du die KI-Funktionen nutzt, werden die
          jeweiligen Inhalte zur Verarbeitung an die Claude-API gesendet.
        </p>
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <HelpLine />
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => {
              acceptDisclaimer();
              setAccepted(true);
            }}
          >
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
}
