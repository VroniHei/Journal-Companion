# Innerline / Journal Companion — Gesamtüberblick

> Lebende Gesamtsicht des Projektstands für schnelles Onboarding (auch für externe
> Tools wie ChatGPT). Detailtiefe: `PROJECT_LOG.md` (Chronik), `DECISIONS.md`
> (Architektur), `ROADMAP.md` (geplant), `OPTIMIZATIONS.md` (Backlog).
>
> Hinweis: Die `CLAUDE.md` im Root beschreibt noch den frühen Next.js-Prototyp.
> Maßgeblich ist dieses Dokument: Die App ist inzwischen ein Vite/Express-Monorepo.

## 1. Idee

Private, lokale Tagebuch-Web-App mit einem therapeutisch *informierten* (nicht
therapeutischen) KI-Begleiter (Claude). Spezialisiert auf **Beziehungsklärung,
Trennung, Bindungsmuster, Selbstwert, Grübelschleifen und emotionale
Selbstregulation**. Der Begleiter spiegelt und sortiert, statt Ratschläge oder
Diagnosen zu geben. Kein Therapieersatz. Deutschsprachig, ruhiger, wertschätzender Ton.

## 2. Architektur

Monorepo (npm workspaces):

| Teil | Stack | Aufgabe |
|---|---|---|
| `web/` | Vite + React 19 + TypeScript + Tailwind v4 | UI; Daten lokal in IndexedDB (Dexie) |
| `server/` | Express + TypeScript | dünner Claude-Proxy, Sicherheits-Gate, Sync-Proxy |
| `shared/` | nur TS-Typen | eine Quelle der Wahrheit (Datenmodelle + API-Verträge) |

- API-Key ausschließlich im Backend (`server/.env`), nie im Frontend.
- 3-Ebenen-Kontext an Claude: aktueller Eintrag + Kurz-Digest der letzten Einträge
  + gespeicherte Muster (nie der ganze Verlauf → günstig & fokussiert).
- Modell: Standard `claude-sonnet-4-6`, Qualitätsmodus `claude-opus-4-8`
  (Thinking + höhere „effort"). Latenz getunt (erstes Byte ~2 s).
- Deploy auf Vercel; Pre-Commit-Gate (Lint + Typecheck).

## 3. Funktionen

**Schreiben & Reflektieren**
- Startscreen „Was brauchst du gerade?" → wählt Modus/Ton (schreiben, Schleife,
  ihm schreiben, Beruhigung, klarer Spiegel, Abend abschließen, Tag sortieren).
- Eintrag mit Stimmung, Intensität, Emotionen, Körpergefühl, Themen, Bedürfnissen,
  Impuls, Absicht + optionalem Alltagstracking (Schlaf/Bewegung/Draußen/Kiffen).
- KI-Reflexion (Streaming, 8-teilig, aktivierungs-sensibel).
- Lebende Reflexion: „Neu reflektieren" bezieht das Gespräch ein; Verlauf bleibt erhalten.
- Gesprächsmodus pro Eintrag; KI-Titel pro Eintrag; Detailseite mit Tabs
  (Eintrag · Reflexion · Gespräch).

**Schutz & Regulation**
- Kontaktimpuls-Schutzraum: Entwurf „in Quarantäne" (20 Min / morgen), strukturierte
  Empfehlung, kein Senden-Button.
- Grübelschleifen-Erkennung → stabilisierend statt vertiefend.
- Krisen-Schutz (deterministisch): feste Sicherheitsantwort + echte Hilfen
  (112, TelefonSeelsorge 0800 111 0 111), kein generativer Call.

**Selbstführung & Auswertung**
- Klärung: Open Loops (offene Schleifen) + Decision Review (Entscheidungs-Rückblick).
- Tagesritual (6-Minuten-Ansatz, eigene Formulierung) mit Abschluss-Moment.
- Muster (Aggregate + KI-Mustererkennung mit Nutzer-Feedback), Wochenrückblick,
  „Worte der Woche".
- Dashboard: Stimmungsverlauf (Punkte/Verlauf), „Was sich zeigt", Serie/Meilenstein
  + Pausentag, „Dein Fokus"-Chip.
- Gentle Gamification: „stabile Momente" für Selbstführung, bewusst keine harten Streaks/Scores.

**Komfort & Daten**
- Spracheingabe (Browser-STT zuerst, ElevenLabs als Fallback) + strukturierter
  Sprach-Check-in; Sprachausgabe (Vorlesen per Tipp).
- Geräte-Sync (Supabase-Proxy, Last-Write-Wins, inkl. Lösch-Sync/Tombstones).
- Export (Markdown/JSON) + Import; Onboarding (Fokus + Erinnerungszeit); A11y-Feinschliff.

## 4. Begleiter (Persona & Sicherheit)

Eigener System-Prompt mit 10 Prinzipien (Validierung ohne Drama, Fakten von
Interpretation trennen, Bedürfnisorientierung, Grübelschleifen begrenzen, keine
Manipulation, immer ein kleiner nächster Schritt, Abschluss statt Endlosschleife).
Sprachstil „Vroni Voice 5.0" mit Anti-KI-Regeln. Krisenlogik deterministisch.

## 5. Offen / Roadmap (Auszug)

- Desktop-Modal-Overlay (Ritual/Eintrag), Detail-Politur einzelner Screens.
- Automatische Gesprächs-Zusammenfassung bei langen Chats.
- Rate-Limiting vor öffentlichem Deploy; mehr Tests; inkrementeller Sync.
- Größer: lokaler Ollama-Modus, Tauri-Desktop, lokale Verschlüsselung, visuelle
  Timeline, PDF-/Therapie-Export, Zyklus-/Schlaf-Kurven.
