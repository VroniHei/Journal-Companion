import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useEntries } from "../hooks/useData";
import { formatDateTime } from "../lib/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
}

function topTopics(topics: string[][]): [string, number][] {
  const counts = new Map<string, number>();
  for (const list of topics)
    for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export function Dashboard() {
  const navigate = useNavigate();
  const entries = useEntries();
  const last5 = entries.slice(0, 5);
  const topics = topTopics(entries.map((e) => e.topics));
  const recurring = topics.find(([, n]) => n >= 3);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="serif text-3xl font-semibold">{greeting()}.</h1>
        <p className="mt-1 text-[var(--muted)]">
          Was möchtest du gerade sortieren?
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/neu")}>Neuer Eintrag</Button>
        <Button variant="ghost" onClick={() => navigate("/kontaktimpuls")}>
          Kontaktimpuls prüfen
        </Button>
      </div>

      {recurring && (
        <Card className="border-l-2 border-l-[var(--accent)]">
          <p className="text-sm">
            Du hast in letzter Zeit mehrfach über{" "}
            <strong>{recurring[0]}</strong> geschrieben ({recurring[1]} Einträge).
            Das darf sein — vielleicht magst du im Wochenrückblick schauen, was
            sich da zeigt.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
            Stimmung zuletzt
          </h2>
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Noch keine Daten.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {entries
                .slice(0, 10)
                .reverse()
                .map((e) => (
                  <span
                    key={e.id}
                    title={`${formatDateTime(e.createdAt)} · Stimmung ${e.mood}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--foreground)",
                    }}
                  >
                    {e.mood}
                  </span>
                ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
            Häufige Themen
          </h2>
          {topics.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Noch keine Daten.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map(([t, n]) => (
                <span
                  key={t}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
                >
                  {t} · {n}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-[var(--muted)]">
          Letzte Einträge
        </h2>
        {last5.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)]">
              Noch keine Einträge. Dein erster Gedanke ist nur ein paar Zeilen
              entfernt.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {last5.map((e) => (
              <Link key={e.id} to={`/eintrag/${e.id}`} className="block">
                <Card className="transition hover:border-[var(--accent)]">
                  <div className="mb-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>{formatDateTime(e.createdAt)}</span>
                    <span>· Stimmung {e.mood}</span>
                    {e.crisisFlag && (
                      <span className="text-[var(--danger)]">· Schutzhinweis</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm">{e.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
