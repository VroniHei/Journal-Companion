# Projekt-Protokoll

Chronologisches Log relevanter Arbeitseinheiten. Neueste oben.
Format pro Eintrag: Datum · Was · Warum · Ergebnis/Status.

---

## 2026-06-18 — Innerline-Design importiert & angewendet

**Was:**
- Claude-Design-Connector (DesignSync) genutzt: Projekt „Innerline Design System"
  gelesen (tokens.css, colors_and_type.css, comp-buttons, Wortmarke-SVGs).
- `globals.css` auf Innerline gemappt: Palette (Chalk/Sand/Ink/Lime/Clay/Forest),
  warmer Hintergrund-Schleier, `accent` = Lime mit Ink-Text, `accent-text` =
  lesbares Grün, Dark-Theme abgeleitet.
- Typo: Figtree (UI/Headlines via `.serif`→Sans-Display) + Newsreader-Italic (`.g`),
  via Google Fonts. Wortmarke = echtes Innerline-SVG-Logo (Light/Dark) im Header.
- Komponenten: Buttons als Pills (Lime-Fill/Ink-Text, Outline-Sekundär), Card mit
  weicheren Radien + Innerline-Schatten, ScaleField Ink-auf-Lime, Akzent-Texte/Fokus
  auf lesbares Grün (A11y).

**Ergebnis/Status:** Typecheck/Lint/Build/10 Tests grün. Token-getrieben → Light +
Dark + Fokus bleiben intakt.

---

## 2026-06-18 — Latenz-Tuning (Antworten schneller)

**Was:**
- Claude-Service: `effort` + `think` pro Aufruf steuerbar (`tuningFor(model)`).
- Standard (Sonnet): **kein adaptives Thinking**, niedrigere `effort` → erstes Byte
  ~2s statt langer Denkpause. Grübelmodus & strukturierte Antworten bewusst flott.
- High-Quality-Modus (Opus): Thinking + höhere `effort` (gründlicher, langsamer).

**Warum:** Nutzerin-Feedback „ein bisschen langsam". Geschwindigkeit zählt für das
„Gefühl"; Tiefe bleibt über den Opus-Modus wählbar.

**Ergebnis/Status:** Typecheck/Lint/10 Tests grün; echter Reflexions-Call verifiziert
(HTTP 200, erstes Byte ~2s).

---

## 2026-06-18 — Sprach-Check-in (strukturierte Voice-Reflexion)

**Was:**
- `/api/voice-reflect` (nicht-streamend): strukturierte JSON-Auswertung eines
  Transkripts (Zusammenfassung, Haupt-Emotionen, Bedürfnis, Trigger, Erkenntnisse,
  was jetzt hilft, **was jetzt eher nicht hilfreich wäre**, nächster Schritt);
  Krisen-Gate; robustes Parsing (geteilte `extractJson`-Util, auch von Kontaktimpuls).
- Neue Seite **„Sprechen"** (/sprechen): frei erzählen (Diktat) → Auswerten →
  strukturierte Anzeige → als `JournalEntry` speichern (`inputType:"voice"`,
  Transkript + strukturierte Felder + komponierte Reflexion).
- Nav-Eintrag + Router.

**Warum:** Voice-Journaling end-to-end mit strukturierter, regulierender Auswertung
(Lightly/Honestly-inspiriert).

**Ergebnis/Status:** Typecheck/Lint/Build/10 Tests grün; Route + Krisen-Gate verifiziert.

---

## 2026-06-18 — Spracheingabe (Diktat)

**Was:**
- `useDictation`-Hook + `DictationButton` auf Basis der Web Speech API (de-DE),
  mit Browser-Support-Erkennung und freundlichem Fallback.
- Diktieren statt Tippen in: neuer Eintrag, Gesprächsmodus, Kontaktimpuls.
- Voice-Einträge werden mit `inputType: "voice"` + `transcript` gespeichert.

**Warum:** Frei sprechen, was los ist (aus dem Briefing/ROADMAP) — ohne extra Key
oder Audio-Versand an Dritte (Web Speech API läuft im Browser).

**Ergebnis/Status:** Typecheck/Lint/Build/Tests grün. Funktioniert in Chrome/Edge
(HTTPS + Mikro-Erlaubnis). Offen: vollständige strukturierte Voice-Reflexion
(`VOICE_REFLECTION_STRUCTURE`) als eigener Modus.

---

## 2026-06-18 — Phase 8: Export, Tests, README, A11y-Feinschliff

**Was:**
- Export: einzelner Eintrag & Wochenrückblick als **Markdown**, alle Daten als
  **JSON** (`lib/export.ts`); Buttons in EntryDetail, WeeklyReview, Settings.
- **Tests** (Vitest) für die Sicherheits-Heuristiken: `crisis.test.ts` (5) und
  `rumination.test.ts` (5) — alle grün. `npm test` läuft im Server-Workspace.
- README mit Funktionsübersicht + Doku-Links vervollständigt.
- A11y-Feinschliff: sichtbarer `:focus-visible`-Fokus, `prefers-reduced-motion`,
  Button-Cursor.

**Warum:** „Definition of Done" des MVP erfüllen (Export, README) und die
sicherheitskritische Logik absichern.

**Ergebnis/Status:** Typecheck + Lint + Build + 10 Tests grün. **MVP funktional
vollständig.**

---

## 2026-06-18 — Phase 7: Muster + Wochenrückblick

**Was:**
- `/api/weekly-review` (nicht-streamend): ruhiger Wochenrückblick aus Eintrags-Digests.
- Muster-Seite: Aggregate aus den lokalen Daten (Ø Stimmung/Intensität, häufigste
  Emotionen/Themen/Bedürfnisse, hohe Intensität, Kontaktimpulse, Schleifen,
  stabilisierende Handlungen) + Liste der „stabilen Momente".
- Wochenrückblick-Seite: Zeitraum wählen → Rückblick erstellen → als
  `PatternSummary` speichern (fließt als Ebene 3 in spätere Reflexionen).

**Ergebnis/Status:** Typecheck/Lint/Build grün; Route gemountet.

---

## 2026-06-18 — Phase 5: Kontaktimpuls-Schutzraum

**Was:**
- `/api/contact-impulse` (nicht-streamend): strukturierte Empfehlung als JSON
  (nicht-senden / später-prüfen / kurze-würdevolle-nachricht) mit robustem
  JSON-Parsing + Fallback; Krisen-Gate; Nachricht nur, wenn würdevoll/kurz.
- Frontend-Seite: Check-in (Situation, Ziel, Aktivierungsskala, optional Entwurf)
  → Empfehlung + Reflexion/Bedürfnis/Begründung/nächster Schritt.
- **Schutzraum**: Entwürfe „in Quarantäne" (localStorage) mit 20-Minuten- bzw.
  „morgen prüfen"-Wartezeit, Re-Check nach Ablauf, Verwerfen. Kein Senden-Button
  (drängt bewusst nicht). Gentle-Gamification-Moment „entwurf-statt-senden".

**Warum:** Impulse aus hoher Aktivierung abfangen, Regulation vor Kontakt.

**Ergebnis/Status:** Typecheck/Lint/Build grün; Route + Krisen-Gate verifiziert.

---

## 2026-06-18 — Phase 4: Gesprächsmodus + .env-Fix

**Was:**
- Claude-Service auf Mehr-Nachrichten-Verläufe verallgemeinert (`ChatTurn[]`).
- `/api/chat`: Krisen-Gate auf die neue Nachricht, Eintrags-Hintergrund +
  optionale Gesprächs-Zusammenfassung im System-Prompt, nur die letzten ~8
  Nachrichten (Kosten/Fokus), Schleifen-Erkennung im Prompt.
- Frontend: `streamChat`, `ChatThread` (Bubbles, Live-Streaming, Cmd/Strg+Enter),
  in EntryDetail unter „Weiter darüber sprechen".
- Bugfix: `dotenv.config({ override: true })` — `.env` hat Vorrang.

**Warum:** Weiterreden zu einem Eintrag, ohne den ganzen Verlauf teuer mitzuschicken.

**Ergebnis/Status:** Typecheck/Lint/Build grün; `/api/chat` live, Krisen-Gate
verifiziert. Reflexion von Nutzerin erfolgreich getestet (echter Key).
Offen/Backlog: automatische Gesprächs-Zusammenfassung bei sehr langen Chats.

---

## 2026-06-18 — Phase 3: Backend + Reflexion (+ Produkt-Nachschärfungen)

**Was:**
- Backend: Claude-Service (`@anthropic-ai/sdk`, adaptives Thinking, Streaming +
  nicht-streamend), System-Prompt (separat pflegbar), Prompt-Builder (Stil/Länge,
  8-teilige bzw. 5-teilige Grübel-Struktur, interner Klarheit/Beruhigung/Kontrolle/
  Grübel-Check, Aktivierungs-Sensibilität, 3-Ebenen-Kontext), **deterministisches
  Krisen-Gate** (`safety/crisis.ts`), serverseitige Grübel-Signale
  (`analysis/rumination.ts`), Route `POST /api/reflect`.
- Frontend: API-Client (Streaming, X-Crisis/X-Rumination), Kontext-Builder
  (`buildReflectionContext`, `clientRuminationHint`), Reflexion in EntryDetail mit
  Live-Streaming, Krisen-Styling, Session-Abschluss.
- Nachschärfungen eingearbeitet: Startscreen „Was brauchst du gerade?" (Intent →
  Modus/Prompt), minimales Alltagstracking (Schlaf/Bewegung/Draußen/Kiffen),
  PatternSummary-Erweiterungen (Strategien-Bibliothek), Voice-Reflection
  vorbereitet (Datenmodell + `VOICE_REFLECTION_STRUCTURE` + `docs/ROADMAP.md`),
  Leitplanke „keine Gamification" dokumentiert.

**Warum:** KI-Reflexion ist das Herzstück; Sicherheit (Krise) muss verlässlich und
modellunabhängig sein.

**Ergebnis/Status:** Typecheck + Lint grün. Backend-Smoke-Test verifiziert:
Krisen-Pfad liefert ohne API-Key die feste Sicherheitsantwort (HTTP 200, X-Crisis);
ohne Key bei Normaleintrag → 503 mit freundlicher Erklärung. Echte Reflexion
benötigt `server/.env` mit `ANTHROPIC_API_KEY` (noch zu testen durch Nutzerin).

---

## 2026-06-18 — Phase 1 & 2: Datenebene + Kern-Journaling-UI

**Was:**
- Phase 1: Dexie-Schema (`entries`/`chatMessages`/`patternSummaries`/`settings`),
  Query-Helfer (CRUD, `recentDigests`, `sameTopicSameDayCount`), Options-Listen
  (Emotionen/Körper/Themen/Bedürfnisse/Impulse/Absichten), Settings-Defaults
  (Sonnet, `toPrefs`/`effectiveModel`), Disclaimer (localStorage), Dexie-Hooks
  (`useSettings`/`useEntries`/`useEntry`/`useMessages`).
- Phase 2: UI-Bausteine (Card/Button/Felder: ScaleField, ChipSelect), Layout mit
  Live-App-Name + Disclaimer-Gate, Dashboard (Begrüßung, Aktionen, letzte Einträge,
  Stimmungsverlauf, häufige Themen, Themen-Hinweis), NewEntry (alle Felder),
  EntryDetail (Eintrag + Löschen), Settings (Name/Modell/Stil/Länge/API-Modus +
  Daten löschen).

**Warum:** Lokales Journaling soll vollständig ohne KI funktionieren (Privacy-first);
KI wird in Phase 3 ergänzt.

**Ergebnis/Status:** Typecheck + Lint + Web-Build grün. Reflexion/Chat-Sektionen in
EntryDetail bewusst für Phase 3/4 freigelassen.

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

## 2026-06-18 — Innerline-Design, Bildwelt, personalisiertes Dashboard

**Was:**
- Design auf das Innerline Design System (Claude Design) ausgerichtet; Dark Mode
  entfernt (Design System ist bewusst hell-only), `color-scheme: light`.
- Moderner/fröhlicher Pass: Glasmorphismus (`.glass`), fröhliche Blur-Blobs im
  Hintergrund, Lift-Hover (`.lift`), Eyebrow-Komponente (Label + grüner Punkt),
  Newsreader-Kursiv-Signatur, frostiger Sticky-Header mit Pill-Navigation.
- Bildwelt eingebaut: See-Panorama als Dashboard-Hero (Scrim + Gruß),
  Schreibtisch-Stillleben im Empty-State (aus dem Design-System-Bildordner).
- Personalisiertes Dashboard mit Auswertungen: `lib/insights.ts` (Streak,
  Wochenwerte, Stimmungsverlauf, sanfte Beobachtungen) + `Sparkline.tsx`
  (abhängigkeitsfreies SVG). Stat-Kacheln, Verlaufschart, „Was sich zeigt".
- Filterauswahl übersichtlicher: `ChipSelect` mit Häkchen + Zähler; `NewEntry`
  gruppiert (Gefühl · Worum es geht · Impuls & Absicht, 2-Spalten) + „Alltag"
  als aufklappbares `<details>` (Progressive Disclosure, Daylio-Prinzip).

**Warum:** Hellere, freundlichere, modernere Anmutung passend zur Marke; weniger
Reizüberflutung im Eintragsformular; ein Dashboard, das eigene Muster spiegelt.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün. Deployt im Codespace.

**Offen:** Bilder ggf. auf weitere Seiten (Muster/Wochenrückblick/Kontaktimpuls);
Insights um KI-gestützte Beobachtungen erweitern; Monatsansicht des Verlaufs.

## Geräte-Sync (Handy ↔ Desktop)

**Was:** Optionaler Cloud-Sync, damit auf allen Geräten dieselben Einträge
erscheinen. Server-seitiger Proxy `/api/sync` (pull/push) auf eine Supabase-
Postgres-Tabelle (`sync_records`), generisch über alle Tabellen
(entries, chatMessages, patternSummaries, stabilityMoments, patternInsights).
Client-Engine (`web/src/lib/sync.ts`): pull → merge (Last-Write-Wins per ISO-
Zeitstempel) → push. Lauf bei Start, alle 30 s, bei Tab-Fokus und entprellt nach
jeder Änderung (`notifyDataChanged` in den Mutations-Queries). Status + manueller
Button in den Einstellungen (`useSync`).

**Warum:** Daten lagen pro Gerät in IndexedDB → Handy und Desktop zeigten
verschiedene Einträge. Single-User hinter dem Passwort-Gate, daher ohne
zusätzliche Konten; der Service-Role-Key bleibt server-seitig.

**Datenschutz:** „alles lokal" gilt nur noch ohne konfigurierten Sync. Mit Sync
liegen Einträge zusätzlich in Supabase (EU/Frankfurt). UI-Texte (Footer, Profil,
Einstellungen) sind sync-bewusst. Einstellungen/Stimme bleiben geräte-lokal.

**Setup:** `docs/SUPABASE_SYNC.md` (Tabelle + `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` in Vercel-Env). Ohne diese Werte bleibt alles lokal.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle (Vercel)
ok. Aktiv, sobald die Env-Vars hinterlegt sind.

**Offen:** Lösch-Propagation (Tombstones); evtl. echte Konten/Verschlüsselung.
