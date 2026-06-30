# Optimierungen & Vorschläge

Laufender Backlog aktiver Verbesserungsvorschläge. Erledigtes abhaken,
neue Erkenntnisse ableiten. Priorität: 🔴 hoch · 🟡 mittel · 🟢 niedrig.

---

## Erledigt (jüngste oben)
- ✅ **Modell-Staffelung umgesetzt:** tiefe Reflexion → Opus (Default), Titel/
  Teilen-Karte → fest Sonnet (`LIGHT_MODEL`, server). Behebt den Sonnet-vs-Opus-
  Widerspruch zu CLAUDE.md. (2026-06-30)
- ✅ **Mehr Kandidaten für „Was sich zeigt"** (Tageszeit, Wochenende vs. Werktag,
  Anspannungs-Trend) + `POSITIVE_EMOTIONS` erweitert; toter `buildInsights`
  entfernt. (2026-06-30)
- ✅ **„Was sich zeigt" positiv-psychologisch entschärft** (`insights.ts`):
  `bright`/`tender`-Trennung, Ressourcen führen, Schwieriges akzeptierend
  gerahmt (SFBT + ACT) statt Negativwort-Spotlight. (2026-06-30)
- ✅ **„Was sich zeigt" rotiert wieder täglich** (`insights.ts`): bei genau zwei
  zutreffenden Aussagen wird nicht mehr dauerhaft das gleiche Satzpaar gezeigt,
  sondern täglich rotierend der Primärsatz; zweiter Satz erst ab drei Kandidaten.
  Regressionstest ergänzt. (2026-06-30)
- 💡 **Folge-Idee:** `POSITIVE_EMOTIONS` ist eine kuratierte Liste; bei Bedarf
  durch ein kleines Sentiment-Lexikon ersetzen, damit auch unbekannte positive
  Leitgefühle als Ressource (statt nur akzeptierend) gerahmt werden.

## Offen

### Nächster großer Block: Seiten- & Zustands-Pass (priorisiert)
- 🔴 **Systematischer „jede Seite, jeder Zustand"-Pass:** Dashboard ist jetzt
  stark; die übrigen Seiten (Muster, Klärung, Rückblick, Archiv, Einstellungen,
  Ritual, Energie, Soforthilfe/Relief, Loosen, Kontaktimpuls, EntryDetail,
  NewEntry, Suche, RedThread, Verlauf, WeeklyLetter, ShareCard) einzeln gegen
  Design + Konsistenz prüfen — **inkl. aller Zustände**: leer / wenig Daten /
  voll, Morgen vs. Abend, Lade-/Fehler-/Krisen-Zustand. Pro Seite: Radien,
  Eyebrows, Touch-Targets, Spacing, Tokens-statt-Hex, Buttons, Empty-States.
- 🟡 **Token-/Style-Konsolidierung parallel dazu:** wiederkehrende Inline-Hex
  (`#9a917f`, `#5d4f3f`, CTA-Gradient) und Inline-SVGs in Tokens/Icon-Set/kleine
  Komponenten ziehen (siehe Audit §D) — reduziert Drift beim Seiten-Pass.

### Produkt-Reife (Richtung „anbietbar")
- 🔴 **Datenschutz/DSGVO sauber aufsetzen (vor jedem öffentlichen Angebot):** Bei
  „Reflektieren" verlässt Eintragstext das Gerät → Claude-API (Anthropic, US).
  Nötig: klare Einwilligung + Transparenz im UI, Auftragsverarbeitungs-Vertrag,
  Datenschutzerklärung, ggf. EU-Region/Proxy, Lösch-/Export-Recht (Export ist da).
  Therapeutische Abgrenzung („kein Therapieersatz") ist vorhanden — juristisch
  final prüfen lassen.
- 🟡 **Performance/Bundle:** `index.js` ~679 kB (gzip ~202 kB). Routen per
  `React.lazy`/dynamic import code-splitten; größte Abhängigkeiten prüfen.
- 🟡 **Onboarding & Retention:** sanfter, aber klarer Erststart; optionale,
  freundliche Tageserinnerung (kein Druck); Streak bewusst niederschwellig
  (bereits entschärft) — Balance Motivation vs. Calm halten.
- 🟡 **Konten/Multi-Device & Monetarisierung (strategisch):** aktuell lokal-first
  + optionaler Proxy-Sync. Für ein echtes Angebot: Account-Modell, Abrechnung der
  Claude-API-Kosten (pro Reflexion), Preis-/Limit-Modell.
- 🟢 **A11y vollständig:** Touch-Targets begonnen; Fokus-Reihenfolge, Screenreader-
  Labels (Mood-/Energie-Buttons), Kontraste flächendeckend prüfen.

- 🟡 **Build-Härtung gegen Workspace-Laufzeitimporte:** Der `--alias`-Fix in
  `vercel.json` ist gezielt, aber jedes **neue** Subpfad-Export aus
  `@journal/shared` (außer `.`/`crisis`) bräuchte einen weiteren Alias, sonst
  droht derselbe `ERR_MODULE_NOT_FOUND`-Absturz. Robustere Optionen: (a)
  `@journal/shared` als echtes Paket nach JS kompilieren (eigener Build-Step,
  `exports` auf `dist/*.js` statt `src/*.ts`), oder (b) Server-Build ohne
  `--packages=external` voll bündeln. Bis dahin: bei neuen Shared-Exports an den
  Alias denken.
- ✅ **Smoke-Test für `/api/health` nach Deploy:** `scripts/smoke.mjs` (+ `npm run
  smoke <url>`) prüft `/api/health` (200 + `{ok:true}`) und `/api/config`; Exit 1
  bei Ausfall, 2 bei Fehlbedienung. Manuell oder als CI-/Post-Deploy-Step nutzbar.
  (2026-06-25) Offen: als GitHub-Action automatisieren.
- 🟢 **Zitat-Karte: Bildauswahl an Stimmung/Thema koppeln:** Pool ist jetzt groß
  (40 Fotos, `CARD_PHOTOS` + `dailyPhotos`, 3 Tagesvorschläge), aber die Auswahl
  rotiert rein nach Datum. Optional die 3 Vorschläge stärker an Stimmung/Top-Thema
  des Tages ausrichten (z. B. Landschaft bei „leicht", Stillleben bei „schwer").
- 🟢 **Mini-Karten-Schlüsselwort schärfen:** seit 2026-06-25 zentral
  (`showcaseKeyword`/`showcaseSeed` in `lib/insights.ts`) und auf Dashboard +
  Muster identisch; rotiert mit dem Seed durch die Top-Themen. **Offen:** noch
  stärker an den „Roten Faden"/Top-Cluster koppeln, damit Mini-Karte und
  Themenliste exakt dasselbe Leitwort zeigen.
- 🟢 **Teilen-Karte auch auf „Roter Faden"/Spur:** dort wird `ThemeMiniCard`
  aktuell nicht genutzt. Für ein durchgängiges Teilen-Erlebnis könnte die Seite
  dieselbe Karte (aus `showcaseKeyword`) bekommen.
- 🟢 **`ThemeMiniCard`-Auto-Fit ist Heuristik:** Wortgröße wird per Zeichenzahl
  geschätzt (`maxChars`/Untergrenze), nicht gemessen. Für Extremfälle (sehr breite
  Karte, sehr langes Wort) ggf. messbasiert verfeinern (Canvas-Textbreite oder
  `ResizeObserver`), statt fester Schwellen.
- 🟢 **Tageszeit-Schwellen hardcodiert:** `timeOfDay()` (Dashboard) nutzt feste
  Grenzen (11/17 Uhr) für Morgen/Tag/Abend. Falls gewünscht später konfigurierbar
  oder an die Wunsch-Ritualzeit koppeln.
- 🟢 **Fokus-Modell vereinheitlicht (Doku-Hinweis):** Der Dashboard-Fokus kommt
  seit 2026-06-25 primär aus `settings.focusArea` (Ritual `makeGreat` überschreibt
  für den Tag). Das löst die frühere Entscheidung „Fokus = reines Tagesergebnis"
  (LEARNINGS 2026-06-23) ab. Optional: den Ritual-Schritt „Was macht den Tag gut?"
  klarer als „Tagesfokus" benennen, damit beide Quellen erkennbar zusammenpassen.
- 🟡 **Themen-Normalisierung für den Roten Faden:** aktuell clustern `topics`
  nur per `toLowerCase`. Synonyme/Beugungen („Arbeit"/„Job", „Trennung"/
  „Trennungen") landen in getrennten Fäden. Optional: leichte Stemming-/
  Synonym-Zuordnung (kuratierte Map), damit echte Themen zusammenlaufen.
- 🟢 **„Abmelden"/Konto-Frage offen:** bewusst weggelassen, da App lokal-first
  ohne Login. Falls später Konten/echter Account-Sync kommen, Menüpunkt
  (Profil-Sheet `Layout.tsx`) mit echter Semantik nachrüsten.
- 🟢 **Roter-Faden-Notiz noch reicher:** begleitende Bedürfnisse (`needs`) oder
  Körpersignale könnten den Untertext weiter personalisieren; aktuell nur
  Trend/Abklingen/Emotion/Häufigkeit.
- 🟡 **Visueller Gesamt-Abgleich gegen `Innerline-App-VORSCHAU.html`:** jeden
  betroffenen Screen einmal komplett gegen den Master-Frame legen und Restabweichungen
  mitnehmen. Die 9 Haupt-Punkte des Korrektur-Briefings sind auf
  `claude/charming-ride-rvi3rj` (PR #1) umgesetzt — nach Merge abhaken. Die im
  Briefing zusätzlich genannten Eintrag-Detail-Tabs und der Muster
  „Punkte/Verlauf"-Umschalter mit Legende sind bereits im Code vorhanden
  (`EntryDetail.tsx`, `MoodCard.tsx`).
- 🟢 **clay-Wortmarke** (`innerline-wordmark-clay.svg`): Master nutzt sie an
  einigen Stellen; im Repo nur dunkel + light. Optional ergänzen.
- 🟢 **Ritual-Abschluss als Eintrag:** beim Abschluss zusätzlich einen
  JournalEntry erzeugen, damit das Ritual in „Letzte Einträge"/Archiv erscheint
  und die Serie (computeStreak) mitzählt (Spec START-HIER). Aktuell nur in der
  eigenen `dailyRituals`-Tabelle gespeichert.
- 🟢 **Routine-Wechsel Geräte-Muster klären:** START-HIER sagt „kanonisch in
  Einstellungen, kein Overlay", APP-STYLE §9 listet es als Desktop-Overlay.
  Aktuell als eigene Seite belassen; bei Bedarf vereinheitlichen.
- 🟢 **Roter Faden / Verlauf vertiefen:** echte KI-Cluster (statt nur `topics`-
  Aggregation) und Themen-Verschiebungen sprachlich glätten, sobald genug Daten.
- 🟡 **Automatische Gesprächs-Zusammenfassung** bei sehr langen Chats (>~12
  Nachrichten): ältere Turns serverseitig zu `conversationSummary` verdichten,
  statt nur die letzten 8 zu schicken.

- 🟡 **Adaptives Thinking reaktivieren**, sobald die SDK-Version `adaptive`
  typisiert — verbessert die Qualität der Reflexionen.
- 🟡 **Fehler-/Leerzustände der UI** verfeinern (z.B. klarer Hinweis, wenn kein
  API-Key gesetzt ist; Retry-Button bei Streaming-Abbruch).
- 🟡 **Tests ausbauen:** Vitest jetzt auch im **web**-Workspace
  (`web/src/lib/insights.test.ts`, 11 Tests: wordsOfWeek/showcaseKeyword/-Seed/
  showcaseInsight/computeStreak); `npm test` läuft server **und** web. Offen:
  weitere `lib/`-Module abdecken, später E2E für den Reflexionsfluss.
- 🟢 **Barrierefreiheit prüfen** mit `web-design-guidelines` (Fokus-Reihenfolge,
  Kontraste, Screenreader-Labels der Mood-Buttons).
- 🟢 **Import** von JSON-Backups (Export ist da; Re-Import noch offen).
- 🟢 **Tieferer Design-/A11y-Audit** mit `web-design-guidelines` / `ui-ux-pro-max`
  (aktuell nur leichter Fokus-/Motion-Feinschliff gemacht).
- 🟢 **Daten-Migrationsstrategie** für `STORAGE_KEY`-Versionen, falls sich das
  Eintragsschema ändert.

## Erledigt

- ✅ Zitat-Karte: **KI-Vorschlag** (Satz + Affirmation) serverseitig generiert
  (`/api/share-suggestion`, on-demand, Krisen-Fallback); echtes Logo statt Text;
  Bild-Pool mit 3 wählbaren Tagesvorschlägen. (2026-06-23)
- ✅ Next.js auf gepatchte Version `^15.5.19` angehoben (CVE-2025-66478).
- ✅ Engineering-Doku (`CLAUDE.md` + `docs/`) als selbstpflegendes Setup angelegt.
- ✅ Automatik-Hooks: pre-commit (Lint/Typecheck-Gate) + Stop-Hook (Doku-Erinnerung).
- ✅ Export (Markdown je Eintrag/Wochenrückblick, JSON für alle Daten).
- ✅ Unit-Tests für Krisen-/Grübel-Heuristik (Vitest, 10 grün).
- ✅ Barrierefreiheit-Basis: sichtbarer Fokus, reduzierte Bewegung.
- ✅ Claude-Design-Screens übernommen: Roter Faden, Verlauf, Schleife lösen,
  Impuls-Pakete, Zitat-Karte teilen, Wochen-Brief, Energie-Check (2026-06-21).
- ✅ Schrift-Optik korrigiert (Font-Smoothing entfernt) + Einträge nach Prototyp.
- ✅ Rate-Limiting für die KI-/Sprach-Routen (Fixed-Window pro IP, dependency-frei,
  `RATE_LIMIT_PER_MIN`, 429 + Retry-After; Sync/Health/Config ausgenommen; 5 Tests).
- ✅ Desktop-Bento (volle Breite) für Muster/Klärung/Rückblick/Archiv; Tagesritual
  Erledigt-Zustand; Moment-Screens (Energie/Soforthilfe/Zitat) als Desktop-Modal;
  Onboarding Schritt 2 (Tageszeit + ohne Erinnerung + Step-Dots). (2026-06-21)

## Geräte-Sync (Folgearbeiten)

- 🟢 **Konfliktfeste Push-Logik:** aktuell plain Upsert; bei seltenem Parallel-
  Edit desselben Datensatzes greift Last-Write-Wins. Optional conditional Upsert
  per Supabase-RPC (`excluded.updated_at >= updated_at`).
- 🟢 **Echte Konten / E2E-Verschlüsselung:** falls später mehr als Single-User
  oder höhere Vertraulichkeit gewünscht ist (Supabase Auth + RLS).
- 🟢 **Inkrementeller Pull** per `since`-Cursor (Param ist serverseitig schon da)
  statt Voll-Pull, sobald die Datenmenge wächst.
- ✅ Lösch-Sync (Tombstones): Löschungen propagieren über Geräte (LWW inkl. Delete).
- ✅ Selbstführung „Klärung": Open Loops + Decision Review (mit Geräte-/Lösch-Sync).
- ✅ JSON-Import (Sicherung zurückspielen, zusammenführend; Export deckt nun alle Tabellen ab).
- ✅ A11y-Feinschliff: touch-action/Tap-Highlight, Such-Input-Semantik, aria-live/role="alert" für Status & Fehler.

## Ideen / Erweiterungen (Stand 2026-06-20 Abend)

- 🟡 **Design-Pass einarbeiten** (von Claude Design): neue Bereiche stylen, mehr
  Tiefe/Bewegung (Verläufe, Bilder, Icons, grafische Elemente). Siehe Claude-
  Design `DESIGN-AUFTRAG.md`.
- 🟢 **Tagesritual ausbauen:** Wochenfrage (6-Min), sanfte Tageserinnerung,
  Ritual-Historie ansehen, ins Wochenrückblick einfließen lassen, kleine
  Streak/Visualisierung.
- 🟢 **KI-Titel-Backfill** für bestehende alte Einträge (einmalig, on demand).
- 🟢 **Voice-Eingabe in VS-Code-Chat** (separat vom App-Thema; morgen klären).
- 🟢 **Tests** für Krisen-/Sync-/Titel-Logik.

## Feinschliff aus Block B (Stand 2026-06-22)

- 🟡 **Tile-Relief flächig:** `tileRelief()`-Token aus `icons.tsx` noch auf alle
  Icon-Kacheln ausrollen (FabSheet-Optionen, JournalCard-Ritual-Kachel,
  Dashboard-Auswertungs-Kacheln, Profil schon erledigt).
- 🟡 **Mindest-Schriftgrößen (APP-STYLE §14):** systematisch prüfen — Tab-Labels
  ≥11.5px, Body ≥14px; vereinzelte 10.5–12.5px-Eyebrows sind ok als Label, aber
  Fließtext-Stellen gegenchecken.
- 🟢 **`icons.tsx` Lint-Warnung** (react-refresh/only-export-components): ICONS +
  tileRelief in eigene Nicht-Komponenten-Datei auslagern, damit Fast-Refresh
  sauber bleibt (kein Fehler, nur Warnung).
- 🟢 **Bundle-Größe** >500 KB: Code-Splitting per Route (`React.lazy`) erwägen.

## Gesamt-Audit 2026-06-23 (UI/UX · Brand · Psychologie)

Vier-Linsen-Review der kompletten App (alle 22 Seiten Desktop+Mobile, Shell,
Microcopy, Begleiter-Prompts, Krisen-Heuristik). **Teil „Entdopplung" ist
erledigt** (`lib/colors.ts`, `KIND_DOT` zentral — s. PROJECT_LOG). Hier der
offene Optimierungs-Backlog, priorisiert und entdoppelt.

### A · Psychologie & emotionale Sicherheit (höchste Priorität)

> **Stand 2026-06-23 — Krisennetz geschlossen (s. PROJECT_LOG):** ✅ Krisen-Check
> jetzt in Relief/Loosen/Ritual (vorher umgangen) · ✅ Heuristik um passive
> Hilferufe + weiche 2. Stufe (`concern`) erweitert · ✅ immer sichtbarer
> Hilfe-Anker (Soforthilfe/Reflexion/Disclaimer). · ✅ Hilfe-Karte bei mood ≤2 +
> intensity ≥9 (NewEntry) · ✅ Streak-Sprache entschärft (kein „endet heute
> Nacht" mehr; warmer Re-Entry nach Lücken). **§A damit vollständig abgearbeitet.**

- 🔴 **Krisennetz greift nicht überall:** `detectCrisis()` läuft nur in
  reflect/chat/contact-impulse/voiceReflect. **Nicht** in Soforthilfe „nur
  rauslassen" (`Relief.tsx:117`, Intensität-Default 7 = riskanteste Stelle),
  Gedankenschleife (`Loosen.tsx`) und Ritual-Reflexionsfeldern (`Ritual.tsx`).
  → `detectCrisis` (reine clientfähige Regex) auf alle substanziellen
  Freitextfelder anwenden, bei Treffer `CRISIS_MESSAGE` einblenden.
- 🔴 **Heuristik-Lücken** (`server/src/safety/crisis.ts:21`): passive/indirekte
  Hilferufe fehlen („ich kann nicht mehr", „es soll aufhören", „besser ohne
  mich", „alle nur eine Last", Mittel/Plan/Abschied, engl. Formulierungen).
  → Pattern-Liste erweitern + **zweite, weiche Stufe** (kein Block, aber warmer
  Zusatzhinweis + TelefonSeelsorge 0800 111 0 111).
- 🔴 **Kein Safety-Net bei mood ≤2 + intensity ≥9:** nicht-blockierende Hilfe-
  Karte ergänzen (`builders.ts:105` schaltet nur „kürzer", ohne Eskalation).
- 🔴 **Hilfe-Anker unsichtbar:** Krisennummer nur tief in Settings
  (`Settings.tsx:383`), nicht im Disclaimer-Gate. → dezente, immer erreichbare
  „Akute Hilfe"-Zeile (Soforthilfe-Fuß, Reflexions-Footer) + 1 Satz im
  `DisclaimerGate.tsx`.
- 🟡 **Streak erzeugt Leistungsdruck/Scham:** „X Tage · endet heute Nacht"
  (`Dashboard.tsx:859`, Verlust-Aversion), Milestones bis 365 (`insights.ts:101`)
  belohnen App-Nutzung statt Selbstführung (Widerspruch zu `microcopy.ts:3`),
  harter Fall auf 0 ohne Auffang-Text. → einladend statt drohend formulieren,
  warmer Re-Entry-Text nach Lücken (Self-Compassion: erhöht Wiederaufnahme).
- 🟡 **Reflexion enthält Direktiven** trotz „keine Ratschläge": „nächster
  Schritt" als Pflicht (`systemPrompt.ts:19`, `builders.ts:50`). → als freiwillige
  Einladung/Frage formulieren oder Außenkommunikation präzisieren.
- 🟡 **Intensität-Default 7 in Soforthilfe** (`Relief.tsx:28`) = Fremdzuschreibung;
  neutral defaulten (`null`) oder aus Mood-Auswertungen ausschließen.
- 🟢 Energie-Label „leer" → „sehr wenig" (sanfter); Ironie-Zeile
  `microcopy.ts:20` bei mood ≤3 durch warme Variante ersetzen; `TYPE_LABEL`
  Muster-Etiketten (`Patterns.tsx:59`) weicher (Hypothese statt Festschreibung).

### B · Brand & Verbal Identity

> **Stand 2026-06-23 — Quick-Wins umgesetzt:** ✅ Default-App-Name „Journal
> Companion" → **„Innerline"** (+ Tab-Titel) · ✅ „Quarantäne" → „liegen
> bleiben"/„Liegt noch" (ContactImpulse) · ✅ „High-Quality-Modus" → „Gründlicher
> Modus", Modell-Hint nutzerzentriert (kein „kosteneffizient").
> **Offen — Entscheidung der Nutzerin (nicht eigenmächtig):** Sonnet-vs-Opus als
> Code-Default (CLAUDE.md nennt Opus; Code defaultet Sonnet — Kostenfrage) ·
> Eigenname für den Begleiter · Route `soforthilfe` → `kopf-leeren` (Refactor) ·
> Favicon (Lime) vs. Wortmarke (Forest/Clay) gemeinsame Farbe · fester Claim ·
> personalisierte Defaults (Vroni/Lukas/`vroni-*`-Bilder) bei Skalierung.

- 🔴 **Doppelname:** Default `APP_NAME = "Journal Companion"` (`appName.ts:3`)
  widerspricht der Marke „Innerline" (Logo/Favicon/Onboarding). → Default auf
  „Innerline", „Journal Companion" nur intern.
- 🔴 **„Quarantäne"** (`ContactImpulse.tsx:90,245`) = klinisch/kalt. → „Liegen
  lassen" / „Schutzraum" / „Ruht bis morgen früh".
- 🟡 **„Soforthilfe"-Route** (`router.tsx:48`) = Notfall-Sprache, kollidiert mit
  dem warmen UI-Wording „Kopf leeren". → Route `kopf-leeren`.
- 🟡 **Begleiter namenlos** („dein Begleiter") = verschenkte Differenzierung;
  „Vroni Voice 5.0" existiert im Prompt. → eigene ruhige Benennung erwägen.
- 🟡 **Toncbrüche/Denglisch:** „die Akte" + ironische Klammer (`microcopy.ts:20`,
  bricht eigene Prompt-Regel), „High-Quality-Modus" (`Settings.tsx:128`) →
  „Gründlicher Modus"; „Hej" als Zufallsbeimischung (`Dashboard.tsx:77`).
- 🟡 **Modell-Hint widerspricht CLAUDE.md:** „Sonnet ist Standard, kosteneffizient"
  (`Settings.tsx:103`) — Default ist `claude-opus-4-8`; nutzerzentriert texten.
- 🟢 **Eintrag vs. Notiz** bewusst trennen; **Tagesritual**-Schreibweise
  vereinheitlichen; **Favicon (Lime) vs. Wortmarke (Forest/Clay)** teilen keine
  Farbe — bewusst entscheiden.
- 🟢 **Claim verankern** (z.B. „sortieren, bevor du reagierst") — bündelt die
  „Selbstführung statt Performance"-Position. **Personalisierte Defaults**
  (`Vroni`, `Lukas`, `vroni-*`-Bildpool) sind Skalierungs-Blocker, falls über
  Einzelnutzerin hinaus.

### C · UI/UX (seitenübergreifend)

- 🔴 **Touch-Targets <44px global:** Basis-`Button` (`ui.tsx:53`, ~38px),
  `Chips`/Scale-Kreise (`NewEntry`), Inputs (`Clarity.tsx:21`), Range-/Feedback-/
  Filter-Buttons (Patterns, WeeklyReview, Archive). → an der Quelle `py-3`.
- 🔴 **Doppelte Exit-Affordanzen:** Topbar-Zurück + eigenes Schließen-X auf
  Tool-/Modal-Seiten (ShareCard, Energy, Relief, Impulses, EntryDetail) —
  navigieren teils unterschiedlich. → X nur im `DesktopModal`-Kontext.
- 🔴 **VoiceCheckin + ContactImpulse alte UI-Generation** (`rounded-lg`,
  transparente Inputs) — sichtbarster Stilbruch. → auf neuen App-Style heben.
- 🟡 **„Große Zahl"-Pattern dreifach uneinheitlich:** 46px (Dashboard) / 40px
  (Patterns) / 26px (WeeklyReview). → 2-stufige Skala definieren.
- 🟡 **Patterns untere Hälfte „alt"** (`Patterns.tsx:467`, generische Card/Stat
  vs. Bento oben) — an obere Designsprache angleichen.
- 🟡 **WeeklyReview:** Range-Auswahl steuert Kennzahlen, aber MoodCard fix 14
  Tage + Titel „Diese Woche" entkoppelt (`WeeklyReview.tsx:187,240`); Control
  steht zudem unter den gesteuerten Inhalten.
- 🟡 **Settings:** native `alert`/`confirm` (`:51,66`) brechen den ruhigen Ton →
  Inline-Status; Section-Titel ohne Hierarchie; native Mini-Checkboxen.
- 🟡 **EntryDetail:** Default-Tab „reflexion" landet bei leeren Einträgen im
  Leerzustand → bei fehlender Reflexion „eintrag" defaulten; Fehlermeldung
  außerhalb des Viewports nach Scroll.
- 🟡 **Archive:** Monatsgruppen ohne Jahr (Dez 2025/2024 verschmelzen),
  Filter-Chips als Inline-`style` (3 verschiedene Chip-Implementierungen).
- 🟢 Empty-States mit CTA (Archive/RitualHistory/Search-Idle); Suchtreffer-Grid
  `lg:grid-cols-3` (wie Archive); Ritual „Schritt X von 3" an `answered` koppeln
  statt an Sichtbarkeit; Eyebrow-Größen-Drift (11 vs 11.5px) vereinheitlichen.

### D · Code-Qualität / Sicherheit / weitere Entdopplung

- ✅ **`dangerouslySetInnerHTML` komplett entfernt** (war XSS-Risiko): Insight-
  Texte (`insights.ts`: `showcaseInsight`, `themeClusters`, `trendStory`) liefern
  jetzt `*Wort*`-Marker statt `<em class="g">`-HTML; alle Konsumenten (RedThread,
  Progress, Patterns, Dashboard ×2, WeeklyLetter) rendern über den zentralen,
  sicheren `withAccents()`-Helfer (`lib/accents.tsx`). `escapeHtml`-Krücke
  entfällt. 0 `dangerouslySetInnerHTML` im Web-Code. (2026-06-23)
- 🟡 **Farben als Hex statt Tokens** in 14+ Dateien (`#9a917f` Tertiärgrau
  dutzendfach, `#5d4f3f`, `#6a5a48`, `#b0a896`) — eigenes undokumentiertes
  Graustufenset neben `--muted`. → Tokens `--muted-2`/`--ink-faint`. CTA-Gradient
  `180deg,#B4ED63,#A8E84F` 15× inline → 1 Utility/Token.
- 🟡 **Inline-SVGs statt Icon-System:** Pfeil 10×, Schließen-X 6×, Häkchen 7×,
  Upload mehrfach → in `iconset.tsx` ergänzen. „Als Karte teilen"/„Roter Faden"-
  Block dupliziert (Dashboard×2 + Patterns) → `<ShareCardLink/>`.
- 🟡 **`TILE`/`CLUSTER`/impulsePacks-Farben** 3 Varianten derselben Bereichs-
  sprache (`Layout.tsx:25`, `Impulses.tsx:13`, `impulsePacks.ts:14`); doppelte
  Sparkline (`Progress.tsx:29` vs `MoodCard.tsx:51`); `dayLabel` vs `formatShort`.
- 🟢 **6 byte-identische Bild-Paare** (~0,5 MB), alle referenziert. **Verdächtig:**
  `vroni-journaling-schreibtisch.webp` == `vroni-lesen-fenster.webp` (gleicher
  Inhalt, verschiedene Namen = wahrscheinlich Inhalts-Fehler). → fachlich klären,
  dann konsolidieren oder korrektes 2. Foto einsetzen. (Nicht eigenmächtig
  gelöscht.) Paare: about-weg=faden-weg, claim-weg=welcome-still,
  about-notebook-still=notebook-still, about-journal-mat=journal-mat,
  about-claim-see=hero-see.
- 🟢 `FabSheet.tsx:121` `p-[14px_15px]` fragiles Arbitrary → `px-/py-` trennen
  (auch Relief/Energy); doppelter `aria-label="Schließen"` (Scrim+X);
  `DesktopModal` ohne Fokus-Trap/Scroll-Lock.
