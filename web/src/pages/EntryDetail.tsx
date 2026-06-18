import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useEntry } from "../hooks/useData";
import { deleteEntry } from "../db/queries";
import { formatDateTime } from "../lib/format";

function MetaRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-xs text-[var(--muted)]">{label}:</span>
      {values.map((v) => (
        <span
          key={v}
          className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs"
        >
          {v}
        </span>
      ))}
    </div>
  );
}

export function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = useEntry(id);

  if (entry === undefined) {
    return <p className="text-[var(--muted)]">Lädt…</p>;
  }
  if (entry === null) {
    return <p className="text-[var(--muted)]">Eintrag nicht gefunden.</p>;
  }

  async function remove() {
    if (!entry) return;
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    await deleteEntry(entry.id);
    navigate("/");
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">
            {formatDateTime(entry.createdAt)}
          </p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Stimmung {entry.mood} · Intensität {entry.intensity}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>

      <Card className="space-y-4">
        <p className="whitespace-pre-wrap">{entry.text}</p>
        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <MetaRow label="Emotionen" values={entry.emotions} />
          <MetaRow label="Körper" values={entry.bodySignals} />
          <MetaRow label="Themen" values={entry.topics} />
          <MetaRow label="Bedürfnisse" values={entry.needs} />
          <MetaRow label="Impuls" values={entry.impulse ? [entry.impulse] : []} />
          <MetaRow label="Absicht" values={entry.intention} />
        </div>
      </Card>

      {/* Reflexion & Gespräch werden in Phase 3/4 ergänzt. */}

      <div className="flex justify-end">
        <Button variant="danger" onClick={remove}>
          Eintrag löschen
        </Button>
      </div>
    </section>
  );
}
