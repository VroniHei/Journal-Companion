import { useRef, type ChangeEvent, type ReactNode } from "react";
import { Button, Card } from "../components/ui";
import { useSettings } from "../hooks/useData";
import { useSyncStatus } from "../hooks/useSync";
import { useSpeech, useVoices } from "../hooks/useSpeech";
import { updateSettings } from "../lib/settings";
import { FOCUS_OPTIONS } from "../lib/focus";
import { syncNow } from "../lib/sync";
import { clearAllData } from "../db/queries";
import { exportAllJson, importAllJson } from "../lib/export";
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
      {hint && <span className="text-[13px] text-[var(--muted)]">{hint}</span>}
      {children}
    </div>
  );
}

const selectClass =
  "w-full max-w-md rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

export function Settings() {
  const s = useSettings();
  const sync = useSyncStatus();
  const voices = useVoices();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const r = await importAllJson(file);
      alert(
        `Import abgeschlossen: ${r.added} neu, ${r.updated} aktualisiert, ${r.skipped} übersprungen.`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  }
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
    await clearAllData();
    alert("Alle Daten wurden gelöscht.");
  }

  return (
    <section className="space-y-6">
      {/* Titel (Zurück liegt zentral in der Topbar) */}
      <h1 className="serif text-3xl font-semibold">Einstellungen</h1>

      {/* Bento: auf Desktop 2-spaltig, mobil gestapelt */}
      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
      <Card className="space-y-5">
        <Row label="App-Name">
          <input
            className={selectClass}
            value={s.appName}
            onChange={(e) => updateSettings({ appName: e.target.value })}
          />
        </Row>

        <Row
          label="Dein Name"
          hint="Für die persönliche Ansprache (z.B. Vroni)."
        >
          <input
            className={selectClass}
            value={s.userName ?? ""}
            placeholder="Vorname"
            onChange={(e) => updateSettings({ userName: e.target.value })}
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
          hint="Nutzt Opus für besonders tiefe Auswertungen, unabhängig vom gewählten Modell."
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

            <p className="text-sm text-[var(--muted)]">
              Vorgelesen wird nur, wenn du selbst auf „Vorlesen" tippst (bei der
              Reflexion und bei den Antworten im Gespräch). Nichts startet
              automatisch. So kannst du es jederzeit selbst steuern und stoppen.
            </p>

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

      <Card className="space-y-5">
        <h2 className="text-sm font-medium text-[var(--muted)]">
          Tagesritual &amp; Fokus
        </h2>
        <Row
          label="Dein Fokus"
          hint="Worum es dir gerade geht. Jederzeit änderbar."
        >
          <select
            className={selectClass}
            value={s.focusArea ?? ""}
            onChange={(e) =>
              updateSettings({ focusArea: e.target.value || undefined })
            }
          >
            <option value="">Kein Fokus</option>
            {FOCUS_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Row>
        <Row
          label="Erinnerung"
          hint="Ein sanfter Anhaltspunkt fürs Ritual (keine Benachrichtigung)."
        >
          <input
            type="time"
            className={selectClass}
            value={s.reminderTime ?? ""}
            onChange={(e) =>
              updateSettings({ reminderTime: e.target.value || undefined })
            }
          />
        </Row>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">Spracheingabe</h2>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={s.preferFreeSpeech !== false}
            onChange={(e) =>
              updateSettings({ preferFreeSpeech: e.target.checked })
            }
          />
          <span>Kostenlose Browser-Spracherkennung bevorzugen</span>
        </label>
        <p className="text-[13px] text-[var(--muted)]">
          Empfohlen. Nutzt die gratis Spracherkennung deines Browsers, wo möglich
          (Desktop Chrome/Edge, Android). Die natürliche ElevenLabs-Erkennung
          (verbraucht Guthaben) springt nur ein, wenn der Browser keine
          Spracheingabe kann, etwa auf dem iPhone.
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--muted)]">Geräte-Sync</h2>
        {sync.state === "off" ? (
          <p className="text-sm text-[var(--muted)]">
            Der Geräte-Abgleich ist aktuell nicht eingerichtet. Deine Einträge
            bleiben lokal auf diesem Gerät. Sobald der Sync auf dem Server
            konfiguriert ist, gleichen sich Handy und Desktop automatisch ab.
          </p>
        ) : (
          <>
            <p className="text-sm">
              Deine Einträge, Gespräche und Muster gleichen sich automatisch
              zwischen deinen Geräten ab. Stimme und andere Geräte-Einstellungen
              bleiben lokal.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => void syncNow()}
                disabled={sync.state === "syncing"}
              >
                {sync.state === "syncing"
                  ? "Synchronisiere…"
                  : "Jetzt synchronisieren"}
              </Button>
              <span aria-live="polite" className="text-[13px] text-[var(--muted)]">
                {sync.state === "error"
                  ? `Fehler: ${sync.error}`
                  : sync.lastSync
                    ? `Zuletzt abgeglichen: ${new Date(
                        sync.lastSync,
                      ).toLocaleString("de-DE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })} Uhr`
                    : "Noch nicht abgeglichen."}
              </span>
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--muted)]">Daten</h2>
        <p className="text-sm">
          {sync.state === "off"
            ? "Deine Einträge liegen ausschließlich lokal in diesem Browser."
            : "Deine Einträge liegen lokal und werden zusätzlich zwischen deinen Geräten abgeglichen."}{" "}
          Du kannst sie jederzeit als Sicherung exportieren oder alles löschen.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportAllJson}>
            Alle Daten exportieren (JSON)
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Sicherung importieren (JSON)
          </Button>
          <Button variant="danger" onClick={clearAll}>
            Alle Daten löschen
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden"
        />
        <p className="text-[13px] text-[var(--muted)]">
          Import führt zusammen: Vorhandenes bleibt erhalten, nur Neueres aus der
          Sicherung wird ergänzt. Einstellungen werden nicht überschrieben.
        </p>
      </Card>
      </div>

      {/* Status-Zeile: die App speichert jede Änderung sofort. */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6E9B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
          <path d="M5 12.5l4 4 10-10" />
        </svg>
        Änderungen werden automatisch gesichert.
      </div>

      <p className="text-[13px] text-[var(--muted)]">
        Diese App ersetzt keine Therapie. Sie unterstützt beim Sortieren,
        Reflektieren und Stabilisieren. Bei akuter Gefahr: 112 ·
        TelefonSeelsorge 0800 111 0 111.
      </p>
    </section>
  );
}
