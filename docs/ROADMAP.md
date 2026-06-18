# Roadmap (nach MVP)

Bewusst **nicht** im MVP, aber vorbereitet bzw. vorgemerkt. Reihenfolge ≈ Priorität.

## Voice-Reflection (Voice Check-in)

Inspiriert von AI-Journaling-Apps (Lightly/Honestly). Die Nutzerin erzählt frei per
Sprache; daraus entsteht ein normaler `JournalEntry` plus strukturierte Reflexion.

Ablauf (später):
1. Freies Sprechen in die App.
2. Aufnahme → Transkription.
3. Transkript als `JournalEntry` speichern (`inputType: "voice"`, `transcript`,
   optional `audioNoteId`).
4. Claude erzeugt zusätzlich strukturiert: Zusammenfassung (`entrySummary`),
   Hauptemotionen, mögliche Bedürfnisse (`mainNeed`), zentrale Trigger
   (`mainTrigger`), wichtige Erkenntnisse (`keyInsights`), was jetzt hilfreich wäre
   (`supportiveImpulse`), **was jetzt eher nicht hilfreich wäre** (`dontDoNow`),
   ein kleiner nächster Schritt.

**Vorbereitet:** Datenmodellfelder in `JournalEntry` (siehe `shared/src/types.ts`),
Prompt-Strukturkonstante `VOICE_REFLECTION_STRUCTURE` in
`server/src/prompts/builders.ts`.

**Umgesetzt (Diktat):** Spracheingabe via Web Speech API (`useDictation` +
`DictationButton`) in neuem Eintrag, Gespräch und Kontaktimpuls; Voice-Einträge
mit `inputType: "voice"` + `transcript`. Sprechen → Text → normale Reflexion.

**Umgesetzt (strukturierter Sprach-Check-in):** Seite „Sprechen" + `/api/voice-reflect`
liefern Zusammenfassung, Haupt-Emotionen/Bedürfnis/Trigger, Erkenntnisse, was jetzt
hilft / eher nicht hilfreich wäre, nächster Schritt; speicherbar als Voice-Eintrag.

**Noch offen:** optionale Audioaufnahme/Transkription für Browser ohne Web Speech
API (z.B. Whisper) — bewusst zurückgestellt (Privacy, kein Extra-Key).

## „Was jetzt eher nicht hilfreich wäre" als wiederkehrender Baustein

Bereits Teil der 8-teiligen Reflexionsstruktur (Punkt 6) und sinngemäß im
Grübelmodus. Bei hoher Aktivierung, Kontaktimpulsen und Grübelschleifen soll dieser
Abschnitt verlässlich erscheinen (z.B. nicht sofort schreiben, nicht weiter
spekulieren, keine großen Entscheidungen im aktivierten Zustand).

## Weitere Erweiterungen (aus dem Briefing)

- Lokaler Ollama-Modus (`apiMode: "local"`, `localModelEndpoint`)
- Desktop-App mit Tauri
- Lokale Verschlüsselung der Daten
- Erweitertes Tracking: Zyklus, Schlaf, Sport, Kiffen — als Verlaufskurven
- Visuelle Timeline
- PDF-Export, Therapie-Export für echte Sitzungen
- „Nicht schreiben"-Timer
- Gespeicherte Nachrichtenentwürfe mit 24-Stunden-Prüfung

## Gentle Gamification (später ausbauen)

Aus den vorbereiteten „stabilen Momenten" kann später eine ruhige visuelle
Fortschrittslogik entstehen (Pfad/Faden/Lichtspur, Wochen-Erkenntnisse). Leitplanke:
warm und bestärkend, **kein** Nutzungsdruck — keine harten Streaks, Punkte, Level,
App-Store-Badges, Leaderboards oder Healing-Scores. Belohnt wird Selbstführung
(Impuls halten, Schleife erkennen, Abschluss), nicht „mehr App öffnen".
