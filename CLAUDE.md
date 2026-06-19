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

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** (Theme-Tokens in `app/globals.css`)
- **Claude API** via `@anthropic-ai/sdk`, Modell **`claude-opus-4-8`**, Streaming

```bash
npm run dev     # Entwicklung (http://localhost:3000)
npm run build   # Produktionsbuild + Typecheck (Pflicht-Gate vor Commits)
npm run lint    # ESLint
```

API-Key: `.env.local` (Vorlage: `.env.local.example`). **Nie** committen.

## Struktur

```
app/
  layout.tsx              Layout + Metadaten
  page.tsx                Journal-UI (Editor, Einträge, Reflexion)
  globals.css             Theme & Styles (Tailwind v4)
  api/reflect/route.ts    Server-Route → Claude (Streaming)
lib/journal.ts            Typen + localStorage
docs/                     Protokoll, Learnings, Optimierungen (siehe unten)
.agents/skills/           Installierte Agent-Skills (per `npx skills add`)
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
4. **Datenschutz.** Tagebucheinträge bleiben lokal (localStorage). Nur bei
   angeforderter Reflexion wird der Eintragstext an die Claude-API gesendet.
   Keine Secrets ins Repo.
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
- Farben/Abstände über die Theme-Tokens in `globals.css`, nicht hartkodiert.
- UI-Texte auf Deutsch, ruhiger, wertschätzender Ton (passend zum Produkt).
- Commits klein & thematisch; Nachricht beschreibt das Warum.

## Automatik (Hooks)

- **Git pre-commit Gate** (`.githooks/pre-commit`): blockt Commits, wenn
  `lint` oder `typecheck` fehlschlägt. **Einmalig nach dem Klonen aktivieren:**
  ```bash
  git config core.hooksPath .githooks
  ```
- **Stop-Hook** (`.claude/settings.json`): erinnert nach einer Arbeitseinheit
  daran, die Living Docs zu pflegen — aber nur, wenn `app/` oder `lib/` geändert
  wurde, ohne dass `docs/PROJECT_LOG.md` mitgepflegt wurde (sonst still).

## Modell-Hinweis

Standardmodell ist `claude-opus-4-8`. Adaptives Thinking aktivieren, sobald die
installierte SDK-Version es in den Typen unterstützt (aktuell weggelassen, da
0.69.x `adaptive` noch nicht typisiert).
