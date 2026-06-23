# Optimierungen & Vorschläge

Laufender Backlog aktiver Verbesserungsvorschläge. Erledigtes abhaken,
neue Erkenntnisse ableiten. Priorität: 🔴 hoch · 🟡 mittel · 🟢 niedrig.

---

## Offen

- 🟡 **Affirmation & „Dein Satz" wirklich KI-generieren:** Die Zitat-Karte zeigt
  beide Felder mit `✦ KI-Vorschlag`-Optik, der Default ist aber statisch bzw. aus
  dem letzten Eintrag. Sinnvoll: einen kurzen, personalisierten Satz + passende
  Affirmation aus den Journal-Mustern serverseitig vorschlagen (wie Pattern-Insights).
- 🟢 **Mini-Karten-Schlüsselwort schärfen:** aktuell das häufigste Wort
  (`wordsOfWeek`). Könnte stärker an den „Roten Faden"/Top-Cluster gekoppelt
  werden, damit Mini-Karte und Themenliste dasselbe Leitwort zeigen.
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
- 🟢 **Tests** aufsetzen (Unit für `lib/journal.ts`, später E2E für den
  Reflexionsfluss).
- 🟢 **Barrierefreiheit prüfen** mit `web-design-guidelines` (Fokus-Reihenfolge,
  Kontraste, Screenreader-Labels der Mood-Buttons).
- 🟢 **Import** von JSON-Backups (Export ist da; Re-Import noch offen).
- 🟢 **Tieferer Design-/A11y-Audit** mit `web-design-guidelines` / `ui-ux-pro-max`
  (aktuell nur leichter Fokus-/Motion-Feinschliff gemacht).
- 🟢 **Daten-Migrationsstrategie** für `STORAGE_KEY`-Versionen, falls sich das
  Eintragsschema ändert.

## Erledigt

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
