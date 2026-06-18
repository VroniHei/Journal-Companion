# Projekt-Protokoll

Chronologisches Log relevanter Arbeitseinheiten. Neueste oben.
Format pro Eintrag: Datum · Was · Warum · Ergebnis/Status.

---

## 2026-06-18 — Neuausrichtung nach Briefing: Plan + Phase 0

**Was:**
- Ausführliches Briefing erhalten → im Plan-Modus vollständigen Umsetzungsplan
  erstellt (`~/.claude/plans/…`), Stack-Entscheidung: **Vite + React + Express +
  Dexie** (Monorepo). Nachschärfungen eingearbeitet (Sonnet als Default, Opus als
  Qualitätsmodus; Streaming nur reflect/chat; AppSettings ohne API-Key +
  `highQualityMode`; PatternSummary erweitert; Kontaktimpuls strukturiert).
- `docs/DECISIONS.md` angelegt (Begründungen Stack/Sicherheit/Modell/Streaming).
- **Phase 0:** Next.js-Prototyp entfernt; npm-workspaces `shared`/`web`/`server`;
  Frontend (Vite+React+TS+Tailwind v4, React Router, Platzhalterseiten);
  Backend (Express+dotenv, /api/health, /api/config); `shared/types.ts`
  (Datenmodelle + API-Verträge); Root-ESLint, Dev-Script (concurrently), Vite-Proxy
  /api→:3001; README neu.
- SDK auf `@anthropic-ai/sdk@0.104.2` (adaptives Thinking getypt); vite@6.4.3 /
  vitest@3 → Audit 0 Vulnerabilities.

**Warum:** Das Briefing beschreibt eine deutlich größere App als der Prototyp;
sauberes Fundament mit klarer FE/BE-Trennung.

**Ergebnis/Status:** Typecheck + Lint grün; Web-Build ok; Backend bootet,
Endpunkte antworten. Bereit für Phase 1 (Dexie/Settings).

---

## 2026-06-18 — Baseline auf GitHub & Automatik-Hooks

**Was:**
- Baseline committet & nach `main` gepusht (Repo: Journal-Companion).
- Git pre-commit Hook (`.githooks/pre-commit`) eingerichtet: Lint + Typecheck
  als Commit-Gate; aktiviert via `git config core.hooksPath .githooks`.
  Dafür `typecheck`-Script (`tsc --noEmit`) ergänzt.
- Stop-Hook in `.claude/settings.json`: erinnert an Doku-Pflege, wenn `app/`/
  `lib/` ohne `docs/PROJECT_LOG.md`-Update geändert wurde.
- Lint-Warnungen in `app/page.tsx` behoben (ungenutzter Import, redundantes
  eslint-disable → `for (;;)`).
- `.gitignore`: Skill-Inhalte (`.agents/`, `.claude/skills/`) und
  `settings.local.json` ausgeschlossen; `skills-lock.json` versioniert.

**Warum:** Qualität automatisch absichern und die Living Docs zuverlässig
aktuell halten.

**Ergebnis/Status:** Hooks getestet (jq-Schema-Check + Befehlslauf grün).

---

## 2026-06-18 — Projekt-Setup & Grundgerüst

**Was:**
- GitHub-Repo verknüpft und von `Innerline-Journal-Companion` zu
  `Journal-Companion` umbenannt; Begleiter-Name „Innerline" überall entfernt.
- Next.js 15 + React 19 + TypeScript + Tailwind v4 Grundgerüst aufgesetzt.
- Journal-UI gebaut: Editor mit Stimmungswahl, Einträgeliste, Reflexion mit
  Live-Streaming (`app/page.tsx`).
- Server-Route `app/api/reflect/route.ts`: ruft `claude-opus-4-8` (Streaming)
  über `@anthropic-ai/sdk` auf; einfühlsamer System-Prompt.
- localStorage-Persistenz (`lib/journal.ts`); Einträge bleiben lokal.
- 9 Agent-Skills installiert (frontend-design, ui-ux-pro-max, web-design-
  guidelines, vercel-react-best-practices, vercel-composition-patterns,
  deploy-to-vercel, find-skills, m14-mental-model, health).
- Engineering-Setup angelegt: `CLAUDE.md`, `docs/PROJECT_LOG.md`,
  `docs/LEARNINGS.md`, `docs/OPTIMIZATIONS.md`.

**Warum:** Sauberer, reproduzierbarer Projektstart mit klaren Arbeitsregeln und
selbstpflegender Doku.

**Ergebnis/Status:** `npm run build` grün. Baseline bereit für GitHub.

**Offen:** Mit ChatGPT ausgearbeitete Feature-Spec im Plan-Modus planen
(Inhalt steht noch aus). Adaptives Thinking aktivieren, sobald SDK es typisiert.
