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

## Therapeuten-Übergabeprotokoll

Strukturierter Export einer Eintrags-Historie für die Übergabe an echte
Therapeut:innen/Ärzt:innen. Macht aus „ersetzt das Therapie?" ein klares
**„es ergänzt Therapie"** — das entlastet regulatorisch (kein Therapieersatz)
und ist ein im Markt seltenes Differenzierungsmerkmal.

Ablauf (später):
1. Zeitraum wählen (z.B. letzte 4 Wochen).
2. Digest erzeugen: Stimmungs-/Intensitätsverlauf, häufige Themen/Bedürfnisse,
   erkannte Muster, stabile Momente.
3. Pro Eintrag: Eintrag + Reflexion + Gespräch.
4. Therapie-fokussierte Zusammenfassung (Erkenntnisse, Muster, hilfreiche/
   unhilfreiche Strategien).
5. Export als PDF oder ZIP mehrerer Markdown-Dateien.

**Vorbereitet (wiederverwendbar):** `web/src/lib/export.ts` (`entryToMarkdown`,
`patternToMarkdown`, `exportAllJson`), `web/src/db/queries.ts` (`toDigest()`,
Zeitraum-/Chat-/Muster-Abfragen), `web/src/lib/context.ts` (`recentDigests()` +
`latestPattern`) und die therapie-relevanten `PatternSummary`-Felder in
`shared/src/types.ts` (`helpfulRegulationStrategies`, `contactImpulsePatterns`,
`unhelpfulThoughtLoops`, `groundingActionsThatWorked`, `helpfulSentences`).

**Datenschutz:** Export bleibt nutzer-initiiert und lokal erzeugt (Tagebuch-/
Stimmungsdaten = Gesundheitsdaten, DSGVO Art. 9).

## Voice-Ausbau (Vollduplex: reinsprechen → gesprochene Antwort)

Ein zusammenhängender, freihändiger Modus: einfach reinsprechen und automatisch
eine gesprochene Antwort zurückbekommen — als Herzstück des Begleiters (Voice ist
ein starker Markttrend 2025/26).

**Heute vorhanden:** Diktat (`useDictation` Browser-STT, `useServerDictation`
ElevenLabs), strukturierte Auswertung `/api/voice-reflect`, Vorlesen (`useSpeech`
ElevenLabs + Browser-Fallback). **Fehlt:** der durchgängige „sprechen → Antwort
hören"-Fluss ohne Zwischenschritte.

**Offene Punkte:** Kosten ElevenLabs (STT Scribe + TTS) vs. kostenlose Browser-
Pfade; Default-Strategie (Browser zuerst, ElevenLabs optional); Barrierefreiheit
(sichtbarer Stopp, kein Autoplay-Problem auf Mobile).

## Ikigai-Kompass (Werte & Sinn, ACT)

Ein ruhiges Werte-Werkzeug rund um die vier Ikigai-Felder (was ich liebe / was
ich kann / was die Welt braucht / wovon ich leben kann). Hilft besonders bei
Sinn- und Selbstständigkeits-Themen. Baut auf `focusArea`/Onboarding auf;
verbindet sich mit ACT-Werteklärung statt fester Ziele.

## Kintsugi-Ansicht (Wachstum aus Brüchen, Selbstmitgefühl)

Geklärte schwere Themen (geschlossene Open Loops, reflektierte Entscheidungen,
ältere belastende Einträge) später wieder ansehen und das „Gold" markieren:
Was ist daran gewachsen? Bildsprache der goldenen Bruchnähte (Kintsugi) als
warmer Ausdruck von posttraumatischem Wachstum — passt zur Markenlinie.

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
