import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { ReflectionView } from "../components/ReflectionView";
import { FormattedText } from "../components/FormattedText";
import { SessionClose } from "../components/SessionClose";
import { ChatThread } from "../components/ChatThread";
import { DesktopModal } from "../components/DesktopModal";
import { useEntry, useMessages, useSettings } from "../hooks/useData";
import { useConfig } from "../hooks/useConfig";
import {
  deleteEntry,
  recordStabilityMoment,
  updateEntry,
} from "../db/queries";
import { formatDateTime, formatShort } from "../lib/format";
import { nowIso } from "../lib/ids";
import { stripMarkdown } from "../lib/text";
import { toPrefs } from "../lib/settings";
import { streamReflect } from "../lib/apiClient";
import { buildReflectionContext, clientRuminationHint } from "../lib/context";
import { intentLabel } from "../lib/intents";
import { CLOSE_MICROCOPY, reflectionMicrocopy } from "../lib/microcopy";
import { downloadEntryMarkdown } from "../lib/export";

type Tab = "eintrag" | "reflexion" | "gespraech";

/**
 * Kurzer, einzeiliger Anriss einer Reflexion für die Verlaufs-Liste.
 * Überspringt die (immer gleiche) erste Überschrift und nimmt den ersten echten
 * Inhaltssatz — so unterscheiden sich die Versionen sichtbar.
 */
function reflectionSnippet(text: string): string {
  const lines = stripMarkdown(text)
    .split(/\n+/)
    .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  const body = lines.slice(1); // erste Zeile ist meist die Abschnitts-Überschrift
  const pick = body.find((l) => l.length > 24) ?? body[0] ?? lines[0] ?? "";
  const plain = pick.replace(/\s+/g, " ").trim();
  return plain.length > 72 ? `${plain.slice(0, 72)}…` : plain;
}

function MetaRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-[13px] text-[var(--muted)]">{label}:</span>
      {values.map((v) => (
        <span
          key={v}
          className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[13px]"
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
  const config = useConfig();
  // Proaktiver, ruhiger Hinweis: Reflexion/Chat brauchen einen API-Key. Wird erst
  // gezeigt, wenn der Zustand bekannt ist (config !== null) und kein Key da ist.
  const noApiKey = config !== null && !config.hasApiKey;

  // `null` = noch keine manuelle Wahl → der Default richtet sich nach den Daten
  // (mit Reflexion → „reflexion", sonst „eintrag"), damit leere Einträge nicht
  // im Reflexions-Leerzustand landen.
  const [tabOverride, setTabOverride] = useState<Tab | null>(null);
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
    setTabOverride("reflexion");
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
      // Bisherige Reflexion als Verlauf bewahren (neueste zuerst, max. 5).
      const history = e.aiReflection
        ? [
            { text: e.aiReflection, at: nowIso() },
            ...(e.previousReflections ?? []),
          ].slice(0, 5)
        : e.previousReflections;
      await updateEntry(e.id, {
        aiReflection: acc,
        previousReflections: history,
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
        } else {
          recordStabilityMoment(
            "reflektiert",
            "Eintrag in Ruhe reflektiert",
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

  const reflexionCount =
    (e.aiReflection ? 1 : 0) + (e.previousReflections?.length ?? 0);
  // Aktiver Tab: manuelle Wahl gewinnt; sonst datengetriebener Default.
  const tab: Tab = tabOverride ?? (reflexionCount > 0 ? "reflexion" : "eintrag");
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "eintrag", label: "Eintrag" },
    { key: "reflexion", label: "Reflexion", count: reflexionCount || undefined },
    { key: "gespraech", label: "Gespräch", count: messages.length || undefined },
  ];

  return (
    <DesktopModal onClose={() => navigate("/")}>
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

      {/* Segmentierte Steuerung (App-Style): Sand-Track, aktives Segment weiß +
          Soft-Schatten, Zähler inline als „· N". */}
      <div
        role="tablist"
        aria-label="Ansicht wählen"
        className="flex gap-[3px] rounded-full bg-[var(--sand)] p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTabOverride(t.key)}
              className="flex-1 rounded-full py-2 text-center text-[13px] transition"
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted)",
                fontWeight: active ? 600 : 500,
                boxShadow: active ? "0 2px 8px rgba(35,34,26,.08)" : "none",
              }}
            >
              {t.label}
              {t.count ? ` · ${t.count}` : ""}
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="border-l-2 border-l-[var(--danger)]">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
          {!reflecting && (
            <button
              type="button"
              onClick={reflect}
              className="mt-2 text-sm font-medium text-[var(--accent-text)] hover:underline"
            >
              Erneut versuchen
            </button>
          )}
        </Card>
      )}

      {noApiKey && (
        <Card className="border-l-2 border-l-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">
            Die Reflexion und das Gespräch mit dem Begleiter brauchen einen
            API-Schlüssel. Solange keiner hinterlegt ist, kannst du in Ruhe
            schreiben — deine Einträge bleiben lokal gespeichert.
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
                  {messages.length > 0
                    ? "Mit Gespräch neu reflektieren"
                    : "Neu reflektieren"}
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
              {!reflecting && e.aiReflection && messages.length > 0 && (
                <p className="text-[13px] text-[var(--muted)]">
                  Bezieht Eintrag + Gespräch ein. „Mit Gespräch neu reflektieren"
                  greift die neuen Themen auf.
                </p>
              )}
              {!reflecting && e.aiReflection && !e.crisisFlag && (
                <p className="text-sm italic text-[var(--muted)]">
                  {reflectionMicrocopy(e)}
                </p>
              )}
              {!reflecting &&
                e.previousReflections &&
                e.previousReflections.length > 0 && (
                  <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <summary className="cursor-pointer text-sm font-medium text-[var(--muted)]">
                      Frühere Reflexionen ({e.previousReflections.length})
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {e.previousReflections.map((p, i) => (
                        <li key={i}>
                          <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
                            <summary className="flex cursor-pointer items-center gap-2.5 text-sm marker:content-['']">
                              <span className="shrink-0 text-[13px] tabular-nums text-[var(--muted)]">
                                {formatShort(p.at)}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[var(--foreground)]">
                                {reflectionSnippet(p.text)}
                              </span>
                              <span
                                aria-hidden="true"
                                className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180"
                              >
                                ⌄
                              </span>
                            </summary>
                            <div className="mt-3 border-t border-[var(--border)] pt-3">
                              <FormattedText
                                text={p.text}
                                className="text-[14px] text-[var(--muted)]"
                              />
                            </div>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </details>
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
        <div className="space-y-4">
          <Card>
            <ChatThread entry={e} />
          </Card>
          {messages.length > 0 && (
            <div className="space-y-1.5">
              <Button
                onClick={reflect}
                disabled={reflecting}
                className="w-full sm:w-auto"
              >
                {reflecting
                  ? "Der Begleiter denkt nach…"
                  : e.aiReflection
                    ? "Mit Gespräch neu reflektieren"
                    : "Mit Gespräch reflektieren"}
              </Button>
              <p className="text-[13px] text-[var(--muted)]">
                Fasst Eintrag + Gespräch zu einer aktualisierten Reflexion
                zusammen (öffnet den Reflexion-Tab).
              </p>
            </div>
          )}
        </div>
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
    </DesktopModal>
  );
}
