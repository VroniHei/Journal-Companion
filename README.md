# Journal Companion

Ein privates, lokales Tagebuch mit KI-gestützter Reflexion (Claude) — ein ruhiger,
therapeutisch *informierter* (nicht therapeutischer) Begleiter für Gedanken,
Gefühle, Beziehungsthemen, Kontaktimpulse und Grübelschleifen.

> Kein Ersatz für Therapie. Einträge bleiben lokal auf deinem Gerät. Nur bei
> angeforderten KI-Funktionen wird der jeweilige Text an die Claude-API gesendet.

## Architektur

Monorepo (npm workspaces) mit klarer Trennung:

- **`web/`** — Frontend: Vite + React + TypeScript + Tailwind v4, Daten lokal in
  IndexedDB (Dexie).
- **`server/`** — Backend: Express + TypeScript, dünner Claude-Proxy. Der
  API-Key liegt ausschließlich hier (`server/.env`), nie im Frontend.
- **`shared/`** — gemeinsame TypeScript-Typen (Datenmodelle + API-Verträge).

Das Frontend ruft ausschließlich `/api/*` des eigenen Backends; das Backend ruft
Claude. Details der Entscheidungen: [docs/DECISIONS.md](docs/DECISIONS.md).

## Funktionen

- **Startscreen „Was brauchst du gerade?"** — wählt Modus & Tonalität.
- **Tagebuch** mit Stimmung, Intensität, Emotionen, Körpergefühl, Themen,
  Bedürfnissen, Impuls, Absicht und optionalem Alltagstracking (Schlaf/Bewegung/
  Draußen/Kiffen).
- **KI-Reflexion** (Streaming, 8-teilige Struktur; aktivierungs-sensibel).
- **Gesprächsmodus** — zu einem Eintrag weiterschreiben (mit Verlaufs-Kontext).
- **Kontaktimpuls-Schutzraum** — Impuls prüfen, Entwurf „in Quarantäne" (20 Min /
  morgen), strukturierte Empfehlung statt Drängen.
- **Grübelschleifen-Erkennung** — kurze, stabilisierende Antwort statt tieferer
  Analyse.
- **Muster** & **Wochenrückblick** — Aggregate + ruhige Zusammenfassung, speicherbar.
- **Krisen-Schutz** — deterministische Sicherheitsantwort mit Hilfehinweisen.
- **Export** — Eintrag/Wochenrückblick als Markdown, alle Daten als JSON.
- **Gentle Gamification** — ruhige Bestärkungen für Selbstführung, kein Nutzungsdruck.

## Einrichtung

1. Abhängigkeiten installieren (vom Repo-Root):

   ```bash
   npm install
   ```

2. API-Key hinterlegen:

   ```bash
   cp server/.env.example server/.env
   # ANTHROPIC_API_KEY=sk-ant-...   (Key von https://console.anthropic.com/)
   ```

3. Git-Hook (Qualitäts-Gate) einmalig aktivieren:

   ```bash
   git config core.hooksPath .githooks
   ```

4. Entwicklung starten (Frontend + Backend gleichzeitig):

   ```bash
   npm run dev
   ```

   Frontend: <http://localhost:5173> · Backend: <http://localhost:3001>

## Skripte (Root)

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Vite (:5173) + Express (:3001) parallel |
| `npm run build` | Build Frontend + Typecheck Backend |
| `npm run typecheck` | Typecheck aller Workspaces |
| `npm run lint` | ESLint über das ganze Repo |
| `npm test` | Unit-Tests (Backend, u.a. Sicherheits-Heuristiken) |

## Modell

Standard: `claude-sonnet-4-6` (kosteneffizient). Optionaler Qualitätsmodus:
`claude-opus-4-8`. In den Einstellungen umstellbar.

## Datenschutz

Keine Cloud, kein Login, kein Tracking. Alle Einträge liegen lokal (IndexedDB).
Der API-Key verlässt nie das Backend.

## Doku

- [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) — Protokoll der Arbeitseinheiten
- [docs/DECISIONS.md](docs/DECISIONS.md) — technische Entscheidungen
- [docs/LEARNINGS.md](docs/LEARNINGS.md) — Erkenntnisse
- [docs/OPTIMIZATIONS.md](docs/OPTIMIZATIONS.md) — offene Verbesserungen
- [docs/ROADMAP.md](docs/ROADMAP.md) — geplante Erweiterungen (z.B. Voice-Reflection)

## Status

MVP funktional vollständig (alle Modi + Muster/Wochenrückblick + Export). Weitere
Ideen siehe Roadmap.
