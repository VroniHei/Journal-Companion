import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { ReflectionView } from "../components/ReflectionView";
import { SessionClose } from "../components/SessionClose";
import { ChatThread } from "../components/ChatThread";
import { useEntry, useMessages, useSettings } from "../hooks/useData";
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

type Tab = "eintrag" | "reflexion" | "gespraech";

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
  const messages = useMessages(id);
  const settings = useSettings();

  const [tab, setTab] = useState<Tab>("reflexion");
  const [reflecting, setReflecting] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reflectionTopRef = useRef<HTMLDivElement>(null);

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
    setTab("reflexion");
    setTimeout(
      () =>
        reflectionTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      60,
    );
    try {
      const [context, hint] = await Promise.all([
        buildReflectionContext(e),
        clientRuminationHint(e),
      ]);
      // Bei „Neu reflektieren" das bisherige Gespräch mitgeben, damit die neue
      // Reflexion die Chat-Nachrichten einbezieht.
      const conversation = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      let acc = "";
      const result = await streamReflect(
        {
          entry: e,
          context,
          ruminationHint: hint || e.startIntent === "schleife",
          intent: intentLabel(e.startIntent),
          conversation: conversation.length ? conversation : undefined,
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
        } else if (e.impulse.includes("schreiben")) {
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

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "eintrag", label: "Eintrag" },
    { key: "reflexion", label: "Reflexion" },
    { key: "gespraech", label: "Gespräch", badge: messages.length || undefined },
  ];

  return (
    <section className="space-y-5">
      {/* Kopf: Datum + Kennzahlen, Zurück */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">{formatDateTime(e.createdAt)}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Stimmung {e.mood} · Intensität {e.intensity}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>

      {/* Segmentierte Steuerung: ein Bereich pro Tab statt endlosem Scrollen */}
      <div
        role="tablist"
        aria-label="Ansicht wählen"
        className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
                active
                  ? "bg-[var(--surface)] font-semibold text-[var(--foreground)] shadow-[var(--shadow-card)]"
                  : "font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
        </Card>
      )}

      {/* --- Tab: Eintrag --- */}
      {tab === "eintrag" && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <p className="whitespace-pre-wrap leading-relaxed">{e.text}</p>
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <MetaRow label="Emotionen" values={e.emotions} />
              <MetaRow label="Körper" values={e.bodySignals} />
              <MetaRow label="Themen" values={e.topics} />
              <MetaRow label="Bedürfnisse" values={e.needs} />
              <MetaRow label="Impuls" values={e.impulse ? [e.impulse] : []} />
              <MetaRow label="Absicht" values={e.intention} />
            </div>
          </Card>
          {!e.aiReflection && !reflecting && (
            <Button onClick={reflect} className="w-full sm:w-auto">
              Mit dem Begleiter reflektieren
            </Button>
          )}
        </div>
      )}

      {/* --- Tab: Reflexion --- */}
      {tab === "reflexion" && (
        <div ref={reflectionTopRef} className="scroll-mt-20 space-y-4">
          {(e.aiReflection || reflecting) && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                {reflecting
                  ? e.aiReflection
                    ? "Der Begleiter denkt neu nach…"
                    : "Der Begleiter denkt nach…"
                  : "Reflexion des Begleiters"}
              </p>
              {!reflecting && e.aiReflection && (
                <Button variant="ghost" onClick={reflect}>
                  Neu reflektieren
                </Button>
              )}
            </div>
          )}

          {e.aiReflection || reflecting ? (
            <>
              <ReflectionView
                text={
                  reflecting
                    ? streamText || (e.aiReflection ?? "")
                    : (e.aiReflection ?? "")
                }
                crisis={!reflecting && e.crisisFlag}
              />
              {!reflecting && e.aiReflection && !e.crisisFlag && (
                <p className="text-sm italic text-[var(--muted)]">
                  {reflectionMicrocopy(e)}
                </p>
              )}
              {!reflecting && e.aiReflection && messages.length > 0 && (
                <p className="text-xs text-[var(--muted)]">
                  Tipp: „Neu reflektieren" bezieht jetzt auch euer Gespräch mit ein.
                </p>
              )}
              {!reflecting && e.aiReflection && (
                <SessionClose onClose={closeSession} note={CLOSE_MICROCOPY} />
              )}
            </>
          ) : (
            <Card className="space-y-4 text-center">
              <p className="text-sm text-[var(--muted)]">
                Noch keine Reflexion. Der Begleiter liest deinen Eintrag, spiegelt
                ihn und stellt dir eine Frage zum Weiterdenken.
              </p>
              <div>
                <Button onClick={reflect}>Mit dem Begleiter reflektieren</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* --- Tab: Gespräch --- */}
      {tab === "gespraech" && (
        <Card>
          <ChatThread entry={e} />
        </Card>
      )}

      {/* Stille Fußzeile: sekundäre / destruktive Aktionen, klar abgesetzt */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
        <Button variant="ghost" onClick={() => downloadEntryMarkdown(e)}>
          Als Markdown
        </Button>
        <Button variant="danger" onClick={remove}>
          Löschen
        </Button>
      </div>
    </section>
  );
}
