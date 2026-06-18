import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { ReflectionView } from "../components/ReflectionView";
import { SessionClose } from "../components/SessionClose";
import { ChatThread } from "../components/ChatThread";
import { useEntry, useSettings } from "../hooks/useData";
import {
  deleteEntry,
  recordStabilityMoment,
  updateEntry,
} from "../db/queries";
import { formatDateTime } from "../lib/format";
import { toPrefs } from "../lib/settings";
import { streamReflect } from "../lib/apiClient";
import { buildReflectionContext, clientRuminationHint } from "../lib/context";
import { intentLabel } from "../lib/intents";
import { CLOSE_MICROCOPY, reflectionMicrocopy } from "../lib/microcopy";
import { downloadEntryMarkdown } from "../lib/export";

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
  const settings = useSettings();

  const [reflecting, setReflecting] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (entry === undefined) {
    return <p className="text-[var(--muted)]">Lädt…</p>;
  }
  if (entry === null) {
    return <p className="text-[var(--muted)]">Eintrag nicht gefunden.</p>;
  }
  const e = entry;

  async function reflect() {
    setError(null);
    setStreamText("");
    setReflecting(true);
    try {
      const [context, hint] = await Promise.all([
        buildReflectionContext(e),
        clientRuminationHint(e),
      ]);
      let acc = "";
      const result = await streamReflect(
        {
          entry: e,
          context,
          ruminationHint: hint || e.startIntent === "schleife",
          intent: intentLabel(e.startIntent),
          prefs: toPrefs(settings),
        },
        (delta) => {
          acc += delta;
          setStreamText(acc);
        },
      );
      await updateEntry(e.id, {
        aiReflection: acc,
        crisisFlag: result.crisis,
        ruminationFlag: result.rumination,
      });
      // Gentle Gamification: stabilen Moment erfassen (kein Punkte-/Streak-System).
      if (!result.crisis) {
        if (result.rumination) {
          recordStabilityMoment(
            "schleife-erkannt",
            "Schleife erkannt statt weiter gegrübelt",
            e.id,
          );
        } else if (e.impulse === "ihm schreiben") {
          recordStabilityMoment(
            "sortiert-vor-handeln",
            "Erst sortiert, bevor gehandelt",
            e.id,
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setReflecting(false);
    }
  }

  async function remove() {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    await deleteEntry(e.id);
    navigate("/");
  }

  async function closeSession() {
    await recordStabilityMoment("abschluss", "Eintrag für heute abgeschlossen", e.id);
    navigate("/");
  }

  const showReflection = reflecting || Boolean(e.aiReflection);

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">
            {formatDateTime(e.createdAt)}
          </p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Stimmung {e.mood} · Intensität {e.intensity}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>

      <Card className="space-y-4">
        <p className="whitespace-pre-wrap">{e.text}</p>
        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <MetaRow label="Emotionen" values={e.emotions} />
          <MetaRow label="Körper" values={e.bodySignals} />
          <MetaRow label="Themen" values={e.topics} />
          <MetaRow label="Bedürfnisse" values={e.needs} />
          <MetaRow label="Impuls" values={e.impulse ? [e.impulse] : []} />
          <MetaRow label="Absicht" values={e.intention} />
        </div>
      </Card>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      )}

      {showReflection && (
        <ReflectionView
          text={reflecting ? streamText : (e.aiReflection ?? "")}
          crisis={!reflecting && e.crisisFlag}
        />
      )}

      {!reflecting && e.aiReflection && !e.crisisFlag && (
        <p className="text-sm italic text-[var(--muted)]">
          {reflectionMicrocopy(e)}
        </p>
      )}

      {!reflecting && e.aiReflection && (
        <SessionClose onClose={closeSession} note={CLOSE_MICROCOPY} />
      )}

      <Card>
        <ChatThread entry={e} />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={reflect} disabled={reflecting}>
          {reflecting
            ? "Der Begleiter denkt nach…"
            : e.aiReflection
              ? "Neu reflektieren"
              : "Mit dem Begleiter reflektieren"}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => downloadEntryMarkdown(e)}>
            Als Markdown
          </Button>
          <Button variant="danger" onClick={remove}>
            Löschen
          </Button>
        </div>
      </div>
    </section>
  );
}
