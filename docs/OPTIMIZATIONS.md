# Optimierungen & Vorschläge

Laufender Backlog aktiver Verbesserungsvorschläge. Erledigtes abhaken,
neue Erkenntnisse ableiten. Priorität: 🔴 hoch · 🟡 mittel · 🟢 niedrig.

---

## Offen

- 🟡 **Automatische Gesprächs-Zusammenfassung** bei sehr langen Chats (>~12
  Nachrichten): ältere Turns serverseitig zu `conversationSummary` verdichten,
  statt nur die letzten 8 zu schicken.

- 🟡 **Adaptives Thinking reaktivieren**, sobald die SDK-Version `adaptive`
  typisiert — verbessert die Qualität der Reflexionen.
- 🟡 **Rate-Limiting / Missbrauchsschutz** für `/api/reflect`, bevor öffentlich
  deployt wird (sonst kann der API-Key teuer werden).
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
