import { Button, Card } from "./ui";

// Session-Abschluss: unterstützt Selbstregulation & Abschluss statt endlosem Weiterreden.
export function SessionClose({
  onClose,
  note,
}: {
  onClose: () => void;
  note?: string;
}) {
  return (
    <Card className="space-y-3 bg-[var(--surface-2)]">
      <p className="text-sm font-medium">Für heute reicht Analyse.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
        <li>Was ist jetzt ein kleiner körperlicher Schritt?</li>
        <li>Was musst du heute nicht mehr entscheiden?</li>
      </ul>
      <div>
        <Button variant="ghost" onClick={onClose}>
          Eintrag für heute schließen
        </Button>
      </div>
      {note && <p className="text-xs italic text-[var(--muted)]">{note}</p>}
    </Card>
  );
}
