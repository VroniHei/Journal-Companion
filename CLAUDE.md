# CLAUDE.md — Arbeitsanweisung & Projektleitfaden

> Diese Datei wird von Claude Code zu **jedem Session-Start automatisch geladen**.
> Sie ist der „Arbeitsvertrag" für dieses Projekt: Überblick, Konventionen und
> die stehenden Regeln, nach denen wir arbeiten.

## Projekt

**Journal Companion** — eine ruhige Tagebuch-Web-App mit einem einfühlsamen
KI-Begleiter (Claude), der beim Reflektieren hilft: er spiegelt Gefühle/Themen
und stellt offene Fragen, statt Ratschläge zu erteilen.

- Repo: <https://github.com/VroniHei/Journal-Companion>
- Sprache der UI & Doku: **Deutsch**.

## Stack & Befehle

> **WICHTIG:** Das ist **kein Next.js-Projekt.** Es ist ein **npm-Workspaces-
> Monorepo** mit **Vite + React Router** (Frontend) und **Express** (Backend).
> Es gibt **kein** `app/`-Verzeichnis, **keine** App-Router-Routen, **kein** Port 3000.

- **Frontend:** **Vite 6** + **React 19** + **React Router** + **TypeScript** (strict)
- **Styling:** **Tailwind CSS v4**, Theme-Tokens in **`web/src/styles/globals.css`**
- **Daten lokal:** **Dexie/IndexedDB** (`web/src/db/`); optionaler Geräte-Sync über
  den Server-Proxy (`web/src/lib/sync.ts` → `/api/sync`)
- **Backend:** **Express** (`server/`), Claude via `@anthropic-ai/sdk`, Modell
  **`claude-opus-4-8`**, Streaming
- **Deploy:** **Vercel** (`vercel.json`); statisches Frontend aus `web/dist`,
  Server als Serverless-Function unter `api/`

```bash
npm run dev        # startet web (Vite :5173) + server (Express :3001) zusammen
npm run build      # baut web + server (inkl. Typecheck) — Pflicht-Gate vor Commits
npm run lint       # ESLint (gesamtes Repo)
npm run typecheck  # tsc --noEmit über shared/web/server
```

App im Dev unter **http://localhost:5173** (Vite proxyt `/api` → `:3001`).

API-Key: **`server/.env`** (Vorlage `server/.env.example`) bzw. Vercel-Env-Vars.
**Nie** im Frontend, nie im Repo, nie in den Chat. Das Frontend ruft nur sein
eigenes Backend.

## Struktur

```
package.json              Workspaces-Root (web, server, shared); dev/build-Scripts
vercel.json               Vercel-Build + Rewrites (Frontend statisch, /api → Function)
api/                      Vercel-Serverless-Einstieg (index.ts → gebündelte Express-App)
shared/src/types.ts       Gemeinsame TS-Typen (eine Quelle der Wahrheit)
web/
  index.html
  vite.config.ts          Proxy /api → :3001
  src/
    main.tsx, router.tsx  Einstieg + Routen (React Router)
    pages/                Dashboard, Patterns (Muster), Clarity (Klärung),
                          WeeklyReview (Rückblick), Ritual, Archive, Settings, …
    components/           Layout, MoodCard, JournalCard, FabSheet, icons.tsx, …
    db/                   Dexie-Schema (dexie.ts) + Queries (queries.ts)
    lib/                  insights, daypart, sync, settings, focus, …
    styles/globals.css    Theme & Tokens (Tailwind v4)
server/
  src/                    Express-App (app.ts), Routen (routes/), Claude-Service,
                          Prompts, Krisen-Heuristik (safety/)
  .env.example            ANTHROPIC_API_KEY=
docs/                     Protokoll, Learnings, Optimierungen (siehe unten)
design_handoff_app_shell_navigation/  Verbindliche Claude-Design-Vorlage
```

## Stehende Regeln (das „immer")

1. **Skills proaktiv nutzen.** Zu jeder Aufgabe prüfen, welche installierten
   Skills passen, und sie einsetzen — ohne dass es extra angefordert wird.
   UI-Arbeit → `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`;
   Code-Struktur/Perf → `vercel-react-best-practices`, `vercel-composition-patterns`.
   **Therapeutische/reflexive Inhalte** (Begleiter-Prompts, Übungen, Krisen-/
   Reflexionslogik) → IMMER zuerst `therapist-safety` (Krisen-Check, nicht
   umgehbar), dann je nach Anliegen `therapist` (Router) bzw. die Modalität
   (`therapist-cbt/-dbt/-act/-sfbt/-mi/-assessments`); für ausführliche,
   schrittweise CBT/DBT-Protokolle `cognitive-toolkit/references/` als kuratierte
   Wissensbasis. Inhalte **kuratiert** übernehmen, nicht blind; keine Diagnosen,
   keine Medikamenten-Tipps, klare Abgrenzung „kein Therapieersatz".
2. **Qualitäts-Gate vor Commits.** `npm run build` (inkl. Typecheck) und
   `npm run lint` müssen grün sein, bevor committet wird.
3. **Branch statt direkt `main`.** Feature-Arbeit auf einem Branch; `main`
   bleibt deploybar. (Ausnahme: das initiale Setup.)
4. **Datenschutz.** Tagebucheinträge bleiben lokal (**Dexie/IndexedDB**); nur bei
   angeforderter Reflexion wird der Eintragstext an die Claude-API gesendet.
   Optionaler Geräte-Sync läuft über den eigenen Server-Proxy. Keine Secrets ins
   Repo, API-Key nur in `server/.env` bzw. Vercel-Env.
5. **Living Docs pflegen** (siehe `docs/`) — nach jeder relevanten
   Arbeitseinheit:
   - `docs/PROJECT_LOG.md`: kurzer Protokolleintrag (was, warum, Ergebnis).
   - `docs/LEARNINGS.md`: neue Erkenntnisse/Entscheidungen festhalten.
   - `docs/OPTIMIZATIONS.md`: offene Verbesserungsvorschläge aktualisieren
     (erledigte abhaken, neue ableiten).
6. **Aktiv verbessern.** Am Ende einer Arbeitseinheit kurz auswerten:
   Was lässt sich vereinfachen, absichern oder beschleunigen? Konkrete
   Vorschläge in `docs/OPTIMIZATIONS.md` notieren.

## Konventionen

- TypeScript strict; SDK-Typen nutzen statt eigene nachbauen.
- Farben/Abstände über die Theme-Tokens in `web/src/styles/globals.css`, nicht hartkodiert.
- UI-Texte auf Deutsch, ruhiger, wertschätzender Ton (passend zum Produkt).
- Commits klein & thematisch; Nachricht beschreibt das Warum.

## Automatik (Hooks)

- **Git pre-commit Gate** (`.githooks/pre-commit`): blockt Commits, wenn
  `lint` oder `typecheck` fehlschlägt. **Einmalig nach dem Klonen aktivieren:**
  ```bash
  git config core.hooksPath .githooks
  ```
- **Stop-Hook** (`.claude/settings.json`): erinnert nach einer Arbeitseinheit
  daran, die Living Docs zu pflegen — aber nur, wenn `web/` oder `server/`
  geändert wurde, ohne dass `docs/PROJECT_LOG.md` mitgepflegt wurde (sonst still).

## Deploy (Vercel)

- Build via `vercel.json`: `npx esbuild server/src/app.ts … && cd web && npm run build`.
  `esbuild` ist als Root-Dev-Abhängigkeit deklariert; `npx` findet es zuverlässig
  (sonst bricht der Build im Monorepo ab und Vercel behält die alte Version).
- Frontend statisch aus `web/dist`, alle `/api/*`-Anfragen → Serverless-Function
  `api/index.ts` (lädt die gebündelte Express-App `api/_server-app.mjs`, Build-Artefakt).
- `ANTHROPIC_API_KEY` und Sync-Keys liegen in den Vercel-Env-Vars, nicht im Repo.

## Modell-Hinweis

Standardmodell ist `claude-opus-4-8`. Adaptives Thinking aktivieren, sobald die
installierte SDK-Version es in den Typen unterstützt (aktuell weggelassen, da
0.69.x `adaptive` noch nicht typisiert).
