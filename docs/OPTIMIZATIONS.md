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
- 🟢 **Export/Import** der Einträge (JSON) als Backup-Möglichkeit für Nutzer.
- 🟢 **Daten-Migrationsstrategie** für `STORAGE_KEY`-Versionen, falls sich das
  Eintragsschema ändert.

## Erledigt

- ✅ Next.js auf gepatchte Version `^15.5.19` angehoben (CVE-2025-66478).
- ✅ Engineering-Doku (`CLAUDE.md` + `docs/`) als selbstpflegendes Setup angelegt.
- ✅ Automatik-Hooks: pre-commit (Lint/Typecheck-Gate) + Stop-Hook (Doku-Erinnerung).
- ✅ Lint sauber (keine Warnungen in `app/page.tsx`).
