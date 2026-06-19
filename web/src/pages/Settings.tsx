import type { ReactNode } from "react";
import { Button, Card } from "../components/ui";
import { useSettings } from "../hooks/useData";
import { useSpeech, useVoices } from "../hooks/useSpeech";
import { updateSettings } from "../lib/settings";
import { db } from "../db/dexie";
import { exportAllJson } from "../lib/export";
import type {
  ApiMode,
  ClaudeModel,
  ResponseLength,
  ResponseStyle,
} from "@journal/shared";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {children}
    </div>
  );
}

const selectClass =
  "rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

export function Settings() {
  const s = useSettings();
  const voices = useVoices();
  const {
    supported: speechSupported,
    cloud: naturalVoice,
    speak,
  } = useSpeech({ voiceURI: s.speechVoiceURI });

  async function clearAll() {
    if (
      !confirm(
        "Wirklich ALLE Einträge, Gespräche und Muster löschen? Das kann nicht rückgängig gemacht werden.",
      )
    )
      return;
    await db.transaction(
      "rw",
      db.entries,
      db.chatMessages,
      db.patternSummaries,
      async () => {
        await db.entries.clear();
        await db.chatMessages.clear();
        await db.patternSummaries.clear();
      },
    );
    alert("Alle Daten wurden gelöscht.");
  }

  return (
    <section className="space-y-6">
      <h1 className="serif text-3xl font-semibold">Einstellungen</h1>

      <Card className="space-y-5">
        <Row label="App-Name">
          <input
            className={selectClass}
            value={s.appName}
            onChange={(e) => updateSettings({ appName: e.target.value })}
          />
        </Row>

        <Row label="Claude-Modell" hint="Sonnet ist Standard und kosteneffizient.">
          <select
            className={selectClass}
            value={s.claudeModel}
            onChange={(e) =>
              updateSettings({ claudeModel: e.target.value as ClaudeModel })
            }
          >
            <option value="claude-sonnet-4-6">claude-sonnet-4-6 (Standard)</option>
            <option value="claude-opus-4-8">claude-opus-4-8 (Qualität)</option>
          </select>
        </Row>

        <Row
          label="Qualitätsmodus"
          hint="Nutzt Opus für besonders tiefe Auswertungen — unabhängig vom gewählten Modell."
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(s.highQualityMode)}
              onChange={(e) =>
                updateSettings({ highQualityMode: e.target.checked })
              }
            />
            High-Quality-Modus (Opus)
          </label>
        </Row>

        <Row label="Antwortstil">
          <select
            className={selectClass}
            value={s.responseStyle}
            onChange={(e) =>
              updateSettings({ responseStyle: e.target.value as ResponseStyle })
            }
          >
            <option value="sanft">sanft</option>
            <option value="klar">klar</option>
            <option value="direkt">direkt</option>
            <option value="sehr-direkt-warm">sehr direkt &amp; warm</option>
          </select>
        </Row>

        <Row label="Antwortlänge">
          <select
            className={selectClass}
            value={s.maxResponseLength}
            onChange={(e) =>
              updateSettings({
                maxResponseLength: e.target.value as ResponseLength,
              })
            }
          >
            <option value="kurz">kurz</option>
            <option value="mittel">mittel</option>
            <option value="ausführlich">ausführlich</option>
          </select>
        </Row>

        <Row label="API-Modus" hint="Lokaler Modus (Ollama) ist für später vorgesehen.">
          <select
            className={selectClass}
            value={s.apiMode}
            onChange={(e) =>
              updateSettings({ apiMode: e.target.value as ApiMode })
            }
          >
            <option value="claude">Claude API</option>
            <option value="local">Lokal (später)</option>
          </select>
        </Row>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-sm font-medium text-[var(--muted)]">
          Stimme &amp; Vorlesen
        </h2>

        {naturalVoice && (
          <p className="rounded-lg border-l-2 border-l-[var(--accent)] bg-[var(--surface-2)] p-3 text-sm">
            Natürliche Stimme aktiv (ElevenLabs). Die untenstehende Browser-Stimme
            dient nur als Fallback, falls die natürliche Stimme nicht erreichbar ist.
          </p>
        )}

        {!speechSupported ? (
          <p className="text-sm text-[var(--muted)]">
            Dein Browser unterstützt keine Sprachausgabe (am besten Chrome oder
            Edge).
          </p>
        ) : (
          <>
            <Row
              label="Stimme"
              hint="Die Auswahl hängt von deinem Betriebssystem ab. Lokale, männliche Stimmen klingen meist am ruhigsten."
            >
              <select
                className={selectClass}
                value={s.speechVoiceURI ?? ""}
                onChange={(e) =>
                  updateSettings({ speechVoiceURI: e.target.value || undefined })
                }
              >
                <option value="">Automatisch (männlich, wenn vorhanden)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                    {v.localService ? " · lokal" : ""}
                  </option>
                ))}
              </select>
            </Row>

            <Row
              label="Automatisch vorlesen"
              hint="Antworten des Begleiters (Reflexion & Chat) direkt vorlesen."
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(s.autoSpeak)}
                  onChange={(e) => updateSettings({ autoSpeak: e.target.checked })}
                />
                Antworten automatisch vorlesen
              </label>
            </Row>

            <div>
              <Button
                variant="ghost"
                onClick={() =>
                  speak(
                    "Hallo. Ich bin dein Begleiter. So klingt meine Stimme, ruhig und in deinem Tempo.",
                  )
                }
              >
                Stimme testen
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">Daten</h2>
        <p className="text-sm">
          Deine Einträge liegen ausschließlich lokal in diesem Browser. Du kannst
          sie jederzeit als Sicherung exportieren oder alles löschen.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportAllJson}>
            Alle Daten exportieren (JSON)
          </Button>
          <Button variant="danger" onClick={clearAll}>
            Alle Daten löschen
          </Button>
        </div>
      </Card>

      <p className="text-xs text-[var(--muted)]">
        Diese App ersetzt keine Therapie. Sie unterstützt beim Sortieren,
        Reflektieren und Stabilisieren. Bei akuter Gefahr: 112 ·
        TelefonSeelsorge 0800 111 0 111.
      </p>
    </section>
  );
}
