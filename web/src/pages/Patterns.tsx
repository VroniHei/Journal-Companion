import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "../components/ui";
import { useEntries } from "../hooks/useData";
import { listStabilityMoments } from "../db/queries";
import { aggregate } from "../lib/patterns";
import { formatDateTime } from "../lib/format";

function Chips({ items }: { items: [string, number][] }) {
  if (!items.length) return <span className="text-sm text-[var(--muted)]">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, n]) => (
        <span
          key={label}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
        >
          {label} · {n}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

export function Patterns() {
  const entries = useEntries();
  const a = aggregate(entries);
  const moments = useLiveQuery(() => listStabilityMoments(), [], []);

  if (entries.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="serif text-3xl font-semibold">Muster</h1>
        <Card>
          <p className="text-[var(--muted)]">
            Noch keine Einträge — sobald du schreibst, zeigen sich hier
            Stimmung, Themen, Bedürfnisse und stabilisierende Handlungen.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="serif text-3xl font-semibold">Muster</h1>

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Einträge" value={String(a.count)} />
          <Stat label="Ø Stimmung" value={a.avgMood?.toString() ?? "—"} />
          <Stat label="Ø Intensität" value={a.avgIntensity?.toString() ?? "—"} />
          <Stat label="Kontaktimpulse" value={String(a.contactImpulses)} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Häufigste Emotionen
          </h2>
          <Chips items={a.topEmotions} />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Häufigste Themen
          </h2>
          <Chips items={a.topTopics} />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Häufigste Bedürfnisse
          </h2>
          <Chips items={a.topNeeds} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Stabilisierende Handlungen
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Tage mit Bewegung" value={String(a.movementDays)} />
          <Stat label="Tage draußen" value={String(a.outsideDays)} />
          <Stat label="erkannte Schleifen" value={String(a.ruminations)} />
        </div>
      </Card>

      {a.highIntensity.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">
            Einträge mit hoher Intensität
          </h2>
          <div className="space-y-2">
            {a.highIntensity.slice(0, 8).map((e) => (
              <Link key={e.id} to={`/eintrag/${e.id}`} className="block">
                <Card className="transition hover:border-[var(--accent)]">
                  <div className="text-xs text-[var(--muted)]">
                    {formatDateTime(e.createdAt)} · Intensität {e.intensity}
                  </div>
                  <p className="line-clamp-1 text-sm">{e.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {moments.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
            Stabile Momente
          </h2>
          <ul className="space-y-1.5 text-sm">
            {moments.slice(0, 12).map((m) => (
              <li key={m.id} className="flex items-baseline gap-2">
                <span style={{ color: "var(--accent-text)" }}>•</span>
                <span>{m.label}</span>
                <span className="text-xs text-[var(--muted)]">
                  {formatDateTime(m.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
