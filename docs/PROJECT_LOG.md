# Projekt-Protokoll

Chronologisches Log relevanter Arbeitseinheiten. Neueste oben.
Format pro Eintrag: Datum · Was · Warum · Ergebnis/Status.

---

## 2026-06-23 — App-weiter Mindestschriftgrößen-Pass (UI/UX/Lesbarkeit)

**Was:** Klare Floors gesetzt und app-weit durchgezogen (31 Dateien, 1:1-Swaps):
- **Keine Schrift < 11px** mehr: `text-[10px]`/`text-[10.5px]` → `text-[11px]`.
- **Kleine Lesetexte/Chips ≥ 13px:** `text-[12px]`/`text-[12.5px]` und das Tailwind-
  `text-xs` (=12px) → `text-[13px]`.
- **Tab-Labels ≥ 11,5px** (`Layout.tsx`, APP-STYLE §14).
- Unverändert: Uppercase-Eyebrows/Labels bei 11px (Label-Floor), `text-sm`=14px
  (Body), Headlines, sowie die `cqw`-Container-Query-Größen der Share-Karten-
  Vorschau (skalieren bewusst mit der Kartengröße).

**Warum:** Nutzer-/UI-UX-Wunsch — manche Mobile-Texte waren zu klein; jetzt früh
einen sauberen, konsistenten Mindestgrößen-Standard verankert.

**Status:** `build`/`lint`/`typecheck` grün; keine fixe Schrift mehr unter 11px.

---

## 2026-06-23 — Kontroll-Durchgang: Hero-Fokus-Chip, Mobile-Layout, Brand-Voice, Schriftgrößen

**Was:**
- **Hero-Fokus-Chip (Desktop) optimiert** (`Dashboard.tsx`, nach Claude-Design):
  zeigt nur den Fokus-Text mit Ellipsis-Kürzung (`max-w-[400px]`, `truncate`),
  ohne „Dein Fokus:"-Präfix und ohne Stift; offen: „Fokus noch offen · im Ritual
  setzen". Mobil bleibt „Dein Fokus: … ✎" (designkonform).
- **Mobile-Korrekturen:** Fokus-Chip in den **oberen Bereich** (direkt unter die
  Begrüßung, vor die Willkommenszeile); „Heute im Blick"-Buttons jetzt in **einer
  Zeile** (kein Umbruch, „Dazu schreiben" füllt den Rest).
- **Brand-Voice (keine Em-Dashes) app-weit:** 5 nutzersichtbare Stellen bereinigt
  (RedThread-Caption, 2 Markdown-Export-Überschriften, `CRISIS_MESSAGE`,
  STT-Fehlertext). Übrige Em-Dashes sind Code-Kommentare/Modell-Prompts (nicht
  nutzersichtbar); der System-Prompt schreibt der KI „keine Gedankenstriche"
  ohnehin vor.
- **Mobile-Schriftgrößen (UI/UX):** kleinste Lese-/Label-Texte angehoben
  (Energie-Tipp 12,5→13px, Pausentag-Info 12,5→13px, Recap-Label 9,5→10px,
  Fokus-Chip 12,5→13px). Eyebrows (Uppercase, getrackt) bleiben designkonform.
- **Kontrolle:** alle internen Links → existierende Routen; alle Bildpfade
  vorhanden; alle 40 Pool-Bilder in Verwendung; Working Tree sauber, kein Junk.

**Status:** `build`/`lint`/`typecheck` grün.

---

## 2026-06-23 — Handoff #3: Ritual-erledigt-Recap, Lucide-Icons, Brand-Voice

**Was:** Neues Design-Briefing (HTML +1 Zeile, neue `CLAUDE.md` mit Brand-Regeln:
Icons 1:1 aus Lucide, keine Em-Dashes/Emoji, Desktop+Mobile konsistent).

- **Ritual „erledigt"-Zustand neu** (`Dashboard.tsx`, geteilt Mobile/Desktop):
  Badge ohne doppeltes „6 Min" („Heute erledigt · automatisch gesichert"); Recap
  als **eine** Karte mit 3 Antworten (farbige Punkte clay/gold/sage, „Ein guter
  Satz" in Newsreader-Italic); **Serie-Zeile** mit Lucide-`award` + Streak +
  Pausentag (nur wenn verfügbar); „Eintrag ansehen".
- **Lucide-Icons korrigiert** (1:1): neues `award` (Streak-Recap, in Dashboard +
  `Ritual.tsx`); Pausentag-Konzept durchgängig `pause` (Warnstreifen-Icon,
  Sheet-Tile, CTA) statt der hand­gezeichneten Flamme; „Pause nehmen"-Button ohne
  Icon (wie Design).
- **Brand-Voice (keine Em-Dashes)**: Pausentag-Sheet-Text gemäß Design
  („Manchmal ist aussetzen das Klügste. Heute zählt als Ruhetag. Deine Serie
  läuft weiter."); Em-Dashes aus Begrüßungs-/Impuls-Copy entfernt.

**Status:** `build`/`lint`/`typecheck` grün.

---

## 2026-06-23 — Wärmerer, persönlicher Dashboard-Einstieg

**Was:** Die Begrüßung (`Dashboard.tsx`) ist nun warm + einladend statt statisch.
- **Begrüßung variiert** leicht je Tag (`GREETINGS` pro Tageszeit: „Guten Morgen"/
  „Hej"/„Schön, dass du wach bist" …), deterministisch über `dayIndex`.
- **Einladende zweite Zeile** statt fixem Spruch: `WELCOME_LINES` (rotiert täglich)
  mit sanften, einladenden Fragen in „Vroni-Voice" („Sollen wir gemeinsam auf
  deine *Gedanken* schauen?", „Möchtest du dir etwas von der *Seele* schreiben?",
  „Wie geht es dir *gerade*?" …) — `.g`-Italic-Akzent. Bewusst ohne Druck/Opt-out
  (`therapist-safety` vorab; Recherche zu Empty-State-/Greeting-UX).
- **Freundliches Visual** (mobil): kleines Lucide-`smile`-Icon in warmem grünem
  Tile vor der Begrüßung. Bewusst **kein** Sonne/Mond (kollidiert mit den
  Tageszeit-Icons der Ritual-Karte direkt darunter).

**Status:** `build`/`lint`/`typecheck` grün.

---

## 2026-06-23 — Pausentag-Feature (§8) + „Was sich zeigt" rotiert mit Italic

**Was:**
- **Pausentag/Streak-Schutz** (Claude-Design §8): neues, persistiertes Feature.
  - Datenmodell: `RestDay` (id=Datum), neue Dexie-Tabelle (v10), `SyncKind`
    `restDays` (wird mitsynchronisiert; Server generisch, unverändert), Queries
    `listRestDays`/`addRestDay`, Hook `useRestDays`.
  - Logik (`insights.ts`): `computeStreak(entries, restDays)` zählt eingelöste
    Ruhetage als abgedeckt (Serie bricht nicht); `pauseDaysAvailable(streak,
    redeemed)` = +1 je 7 Tage, max 1, abzüglich eingelöster.
  - UI (`Dashboard.tsx`): „Serie in Gefahr"-Warnstreifen in der Tagesritual-Karte
    (abends ≥18 Uhr, keine Aktivität heute, Serie>0, Pausentag verfügbar) mit
    „Pause nehmen"; **Bottom-Sheet** „Ruhetag nehmen?" (Bestätigen löst Pausentag
    ein → `addRestDay(heute)`, Serie bleibt; „Doch lieber schreiben" → /neu).
    Der „1 Pausentag in Reserve"-Chip erscheint nur noch bei `pauseAvailable>0`
    (auch in `Ritual.tsx`); `computeStreak` überall mit Ruhetagen (Patterns,
    WeeklyReview, Ritual).
- **„Was sich zeigt" dynamisch** (Nutzer-Feedback: stand tagelang derselbe Satz,
  ohne Italic): neue Funktion `showcaseInsight(entries, seed)` — sammelt **alle
  gerade zutreffenden** datengetriebenen Aussagen (Bewegung/Draußen/Wochen-Trend/
  bester Wochentag/Top-Thema/Top-Emotion), **rotiert täglich** und enthält ein
  `.g`-Italic-Akzentwort (Nutzerwörter escaped). Dashboard + Muster rendern jetzt
  via `dangerouslySetInnerHTML`.

**Status:** `build`/`lint`/`typecheck` grün.

---

## 2026-06-23 — Zitat-Karte: 40er-Bild-Pool + Tag-Cutoff behoben

**Was:**
- **Großer Bild-Pool**: 33 kuratierte, ruhige Markenfotos (Landschaften,
  Stillleben, ruhige Szenen) aus dem Website-Repo `VroniHei/Website` gezogen
  (Tarball über `codeload`, da der Git-Proxy nur das Hauptrepo autorisiert) und
  nach `web/public/img/` gelegt. `CARD_PHOTOS` umfasst nun **40 Fotos**; pro Tag
  rotieren 3 wählbare Vorschläge. Text-/Grafik-lastige Bilder (Wireframe,
  Brand-Essence, Moodboards mit Beschriftung, Trust-Grafiken) bewusst aussortiert.
- **Tag-Cutoff** in „Was sich zeigt" (mobil): der 4. Tag wurde durch
  `overflow:hidden` halb abgeschnitten. Jetzt **eine Zeile mit den 3 wichtigsten
  (häufigsten) Tags**, Umbruch statt Clip (`Dashboard.tsx`, `Patterns.tsx`).

**Warum:** Nutzer-Feedback — zu wenig Bildauswahl; abgeschnittene Tags.

**Status:** `build`/`lint`/`typecheck` grün.

---

## 2026-06-23 — Zitat-Karte: KI-Vorschlag, echtes Logo, Bild-Pool

**Was:** Drei Nachbesserungen an „Als Karte teilen" (`ShareCard.tsx`):

1. **KI-Vorschlag funktional** (vorher Deko): neue Route `POST /api/share-suggestion`
   (`routes/shareSuggestion.ts`, Builder `buildShareSuggestion*`, Typen
   `ShareSuggestion*`, `apiClient.postShareSuggestion`). Erzeugt einen ruhigen,
   personalisierten Satz (ein *Akzentwort*) + passende Affirmation aus den
   Journal-Mustern. **On-demand** per Button (Datenschutz: Text geht nur auf Klick
   an den Server). **Krisen-Heuristik** (`detectCrisis`) vorgeschaltet → bei
   Krisensignalen sanfter Fallback statt KI (keine muntere Affirmation). Busy-/
   Fehlerzustand im UI.
2. **Echtes Logo statt Text**: Wortmarke `innerline-wordmark-light.svg` in der
   DOM-Vorschau und im Canvas-Export (mit Text-Fallback), nicht mehr `<span>`-Text.
3. **Bild-Pool statt Einzelbild**: `CARD_PHOTOS`-Liste (aktuell 7 Markenfotos,
   `faden-weg.webp` ergänzt); pro Tag rotieren 3 Vorschläge (`dailyPhotos`,
   deterministisch nach Datum), wählbar als neue **„Bild"-Optionen neben der
   Farbwelt**. Foto entkoppelt vom Theme (Theme = nur Overlay/Akzent).

**Warum:** Nutzer-Feedback — KI-Vorschlag ohne Funktion, Logo war Text, zu wenig
Bildauswahl.

**Status:** `build`/`lint`/`typecheck` grün. `therapist-safety` vorab (Vorschläge
nicht-klinisch, kein Drängen; Krisen-Fallback). **Offen:** echter 30–40-Bilder-Pool
braucht zusätzliche Fotos (aktuell nur 7 im Repo) — Mechanik skaliert, sobald
Bilder unter `web/public/img/` ergänzt werden.

---

## 2026-06-23 — Claude-Design Update Juni 2026 (7 Bereiche) eingebaut

**Was:** Handoff `UPDATE-BRIEFING_JUNI-2026` (Quelle: `Innerline App.dc.html`)
geprüft und alle 7 Bereiche umgesetzt:

1. **„Was sich zeigt" Desktop 3-Spalten** (`Dashboard.tsx`): Einsicht (1.3fr) ·
   Fokus-Themen (1fr) · Mini-Karte + „Als Karte teilen" (1fr), Spalten mit
   Trennlinien — gleiches Raster wie die Auswertungskacheln darüber.
2. **Einheitliche Mini-Karte** (`components/ThemeMiniCard.tsx`, neu): Foto
   `zitat-weg.webp` + dunkelgrüner Verlauf, Schlüsselwort in Newsreader-Italic
   (#A8E84F), kein Logo/Subtext. Genutzt an 4 Stellen (Dashboard Desktop/Mobile,
   Muster Desktop/Mobile).
3. **Dashboard-Reihenfolge + Mobile** (`Dashboard.tsx`): „Was sich zeigt" jetzt
   `order-6` (vor „Kopf leeren" `sm:order-7`) und **auch auf Mobile sichtbar**
   (gestapelt: Text → Tags → Mini-Karte + „Roter Faden ansehen" + Teilen).
4. **Fokus-Chip aus dem Ritual** (`Dashboard.tsx`): kein Onboarding-Wert mehr,
   sondern Output des Tagesrituals (`makeGreat` = „Was macht den Tag gut?").
   Zwei Zustände — gesetzt: Chip mit Fokus + Stift (→ /ritual); offen: leiser
   gestrichelter Hinweis „Fokus heute noch offen · im Ritual setzen". Mobile
   (heller Grund) + Desktop-Hero (dunkles Bild) je eigene Optik. Desktop-Hero
   hatte bisher gar keinen Chip.
5. **Zitat-Karte teilen** (`ShareCard.tsx`): Eyebrow „Mein Muster" (statt „Mein
   Impuls für heute"); neues optionales **Affirmations-Feld** (klein/kursiv
   unter dem Zitat, statt „aus meinem Tagebuch · Datum"); „Entfernen" blendet die
   Zeile aus; „Dein Satz" mit `✦ KI-Vorschlag`-Label. Canvas-Export angepasst.
6. **Muster „Was sich zeigt"-Kachel** (`Patterns.tsx`): aus dem Roter-Faden-Mini
   eine „Was sich zeigt"-Karte — Einsicht + einzeilige Tags + Trennlinie +
   Mini-Karte (86×60 / mobil 110×76) + „Roter Faden ansehen →" + „Als Karte
   teilen".
7. **Chart-Fix ovaler Endpunkt** (`MoodCard.tsx`): bei `preserveAspectRatio="none"`
   wurde der `<circle>` oval. Punkt jetzt als absolut positioniertes `<span>`
   außerhalb des SVG (Wrapper mit fester Höhe).

**Warum:** Weiterentwicklung des verbindlichen Claude-Designs (frische Mini-Karten,
klarere Datenkarten, Fokus als Tagesergebnis, runder Chart-Endpunkt).

**Status:** `npm run build`, `lint`, `typecheck` grün. Mini-Karte als eine Quelle
(`ThemeMiniCard`) statt 4× dupliziert. Affirmations-Default ist vorerst statisch
(KI-Vorschlag-Optik), echte KI-Generierung als Backlog notiert.

---

## 2026-06-23 — „Heute im Blick": Schreib-Impuls rotiert täglich automatisch

**Was:** Der Default-Impuls der „Heute im Blick"-Kachel (`Dashboard.tsx`) war
jeden Tag derselbe (`PROMPTS[0]`). Jetzt seedet der Start-Index deterministisch
über `dayIndex()` (Tage seit lokaler Mitternacht) → jeder Tag startet bei einem
anderen Impuls, wechselt automatisch um Mitternacht. Pool von 4 auf 18 sanfte,
offene Impulse erweitert. Die beiden Buttons („Anderer Impuls" zählt von dort
weiter, „Dazu schreiben") bleiben unverändert. Reflexive Inhalte → vorab
`therapist-safety` (Level 1, keine Krisen-Indikatoren; Leitplanken beachtet).

**Status:** `lint` + `typecheck` grün.

---

## 2026-06-23 — Nachbesserungen: Heute-im-Blick (mobil), Roter Faden (Bild + Logik), Muster-Affordanz

**Was:** Drei Punkte aus dem Review umgesetzt (Branch `claude/wizardly-bardeen-4bicc3`):

1. **„Heute im Blick" mobil** (`Dashboard.tsx`): Die Aktionen „Anderer Impuls" /
   „Dazu schreiben" waren per `hidden sm:flex` nur auf Desktop sichtbar — jetzt
   auch mobil (wie im Mock), Label an den Mock angeglichen (`Dazu schreiben`).
2. **Roter Faden** (`RedThread.tsx`, `lib/insights.ts`):
   - **Bild korrigiert:** `hero-see.webp` (See) → `zitat-weg.webp` (Bergpfad,
     entspricht dem Mock).
   - **Klare, dokumentierte Logik** für `themeClusters` (Markenkern). Fenster =
     letzte 6 Wochen (rollt live). Ein Thema ist erst ein „Faden", wenn es an
     **≥2 verschiedenen Tagen** vorkommt (echte Wiederkehr statt einem vollen
     Tag). Reihung nach „Stärke" = Tage×2 + Häufigkeit + Aktualitäts-Bonus;
     max. 5 Karten. **Randfarbe** = emotionaler Grundton (Ø Stimmung) auf dem
     Marken-Farbsystem clay→gold→sage→grün — zeigt, *wie sich ein Thema
     anfühlt*. **Notiz** datengetrieben (Trend → Abklingen → begleitende Emotion
     → Häufigkeit). Auf der Seite: erklärende Caption + Farb-Legende
     (`TONE_LEGEND` als eine Quelle der Wahrheit). Emotion in der Notiz wird
     ge-escaped (kein Self-XSS via `dangerouslySetInnerHTML`).
3. **Muster-Seite** (`Patterns.tsx`): Roter-Faden-Kachel jetzt erkennbar als
   Drill-in — Chevron oben rechts + „Alle Themen ansehen →"-Footer; der
   Eyebrow-Punkt nimmt den Grundton des Top-Themas an.

**Warum:** Mobile-Buttons fehlten; falsches Hero-Bild; Roter-Faden-Karten waren
inhaltlich nicht nachvollziehbar (Farben/Anzahl/Texte ohne sichtbare Logik); auf
„Muster" war nicht klar, dass die Karte weiterführt.

**Status:** `npm run build`, `lint`, `typecheck` grün. „Abmelden" im Menü auf
Wunsch bewusst weggelassen (App ist lokal-first ohne Login/Konto).

---

## 2026-06-22 — Korrektur-Briefing abgearbeitet (9 Punkte gegen `Innerline App.dc.html`)

**Was:** Den Handoff `design_handoff_app_shell_navigation/` (inkl. `Innerline
App.dc.html`, 34 Screens, `APP-STYLE.md`, `KORREKTUR-BRIEFING`) als ZIP erhalten
(claude_design-MCP-Connector ist in der Web-Session nicht verfügbar) und alle
9 Korrektur-Punkte umgesetzt — je Desktop und Mobile, gegen Master/Screens:

1. **Onboarding** (`Onboarding.tsx`, `focus.ts`, `settings.ts`): Willkommens-Foto,
   Schritt-Punkte im 60px-Header, 8 Fokus-Chips, Schritt 2 als drei Auswahl-Karten
   (Morgen/Mittag/Abend) mit antippbarem Zeit-Chip; Desktop als zentriertes
   Overlay; `DEFAULT_SETTINGS.onboarded=false`.
2. **Leerzustand „Heute leer"** (`Dashboard.tsx`): Clay-Karte mit Stift-Icon,
   „Tagesritual starten"-Zeile, gestrichelter „Muster & Stimmung"-Platzhalter.
3. **Ritual-Abschluss** (`Ritual.tsx`): Punkte-Recap als eine Karte, letzte Zeile
   `.g`-Italic („Ein guter Satz"), Serie-Zeile mit echtem `computeStreak`, Button
   „Zurück zum Tag".
4. **Tab-Leiste** (`Layout.tsx`): feste 82px, Items zentriert, Bodenabstand.
5. **Rückblick** (`WeeklyReview.tsx`): Foto-Band auf Mobile (Desktop ohne Foto).
6. **Wochen-Brief** (`WeeklyLetter.tsx`): ruhiger Leerzustand statt Fehlertext.
7. **Archiv** (`Archive.tsx`): Mobile als kompakte Zeilen-Liste (Punkt = Typ),
   Desktop behält Karten-Raster.
8. **Zitat-Karte** (`ShareCard.tsx`): ein Foto + vier Overlay-Welten (statt 6 Foto-
   Welten + Verläufe); Akzentwort per `*Stern*` in `.g`-Italic (DOM + Canvas).
9. **Routine-Wechsel** (`Routine.tsx`): Kopfzeile, alt→neu als Pills, Toggle in
   das antippbare Wochen-Raster integriert, Desktop zweispaltig.

**Warum:** Vronis Beobachtung „mobile Ansicht weicht ab" + Korrektur-Briefing.
Quelle bewusst der Master-Prototyp, nicht Annahmen.

**Ergebnis/Status:** Build + Typecheck + Lint grün, je Punkt(e) committet und auf
Branch `claude/charming-ride-rvi3rj` gepusht. Offen: Eintrag-Detail-Tabs und
Muster „Punkte/Verlauf"-Umschalter (im Briefing als weitere Abweichungen genannt,
noch nicht umgesetzt); visueller Feinabgleich gegen VORSCHAU steht noch aus.

---

## 2026-06-21 (Teil 6) — Tagesritual als gekennzeichneter Tageseintrag

**Was:** Abgeschlossene Tagesrituale erscheinen jetzt als verknüpfter Tageseintrag
in „Letzte Einträge"/Archiv und zählen in die Serie (`syncRitualEntry`, ein
Eintrag pro Tag, auf den Ritual-Tag datiert). Eigener Eintrags-Typ **„ritual"**
mit Sonnenaufgang-Icon (statt Mood-Punkt) und warmem Clay-Badge „Tagesritual"
für den Wiedererkennungswert; Archiv hat einen „Tagesritual"-Filter. Ritual-
Einträge sind aus der Stimmungs-Statistik herausgefiltert (saubere Mood-Charts).

**Warum:** Nutzerin-Wunsch: die täglichen Mini-Einträge sollen als solche
sichtbar und wiedererkennbar sein.

**Ergebnis/Status:** Build + Lint + 15 Tests grün, gepusht.

---

## 2026-06-21 (Teil 5) — Mobile-Bugfixes + Tagesritual einseh-/änderbar

**Was:**
- **Spracheingabe-Doppler** behoben (`useDictation`): kurze Sitzungen
  (`continuous=false`) mit Auto-Neustart, Finale je Sitzung genau einmal
  festgeschrieben — kein „ich ich ich" mehr auf mobilem Chrome.
- **Dashboard Mobile:** „Letzte Einträge" wieder sichtbar; feste Lilac-Karte
  „Gerade ist viel? · Kopf leeren" ergänzt (Mobile + Desktop); Tagesritual-Karte
  an Prototyp angeglichen (46px-Thumb, kurze Headline, Themen im Fließtext).
- **Profil-Dropdown:** farbcodierte Icon-Kacheln nach README.
- **Tagesritual einseh-/änderbar:** Ritual-Screen hat jetzt einen Morgen/Abend-
  Umschalter (beide Hälften eines Tages ansehen & ändern) und akzeptiert
  `?date=YYYY-MM-DD`. Neue Seite **Ritual-Verlauf** (`/ritual-verlauf`, im Profil-
  Menü) listet alle bisherigen Tage; Tippen öffnet den Tag zum Nachlesen/Ergänzen.
  Neue Query `listDailyRituals()`.

**Warum:** Nutzerin-Feedback: abends war das Früh-Ausgefüllte nicht mehr
einsehbar/änderbar.

**Ergebnis/Status:** Build + Lint + 15 Tests grün, gepusht.

---

## 2026-06-21 (Teil 4) — Claude-Design-Angleichung: Desktop-Bento + Erledigt-Zustand + Modals

**Was:** Frisches Arbeitspaket von Claude Design über den Connector gezogen
(START-HIER, APP-STYLE, README, INDEX, Prototyp `Innerline App.dc.html`, alle
Desktop-Screenshots gerendert). Danach Screen für Screen angeglichen:
- **Desktop-Bento (volle Breite) statt schmaler Spalte** für die vier Hauptseiten:
  Muster („Was sich bei dir durchzieht"), Rückblick („Was sich gezeigt hat"),
  Klärung („Erst sortieren, dann entscheiden" — beide Spalten nebeneinander),
  Archiv („Alle Einträge" — Zeitgruppen, je Gruppe max 3 + „Alle N ansehen",
  Filter-Pills, frühere Monate kompakt). Mobile bleibt kompakt gestapelt.
- **Tagesritual Erledigt-Zustand** auf dem Dashboard (war ein Bug): nach Abschluss
  grüner Haken + „Heute erledigt · 6 Min · automatisch gesichert" + Blick auf die
  gesicherten Antworten + „Eintrag ansehen" statt weiter „Heute noch offen".
- **Moment-Screens als Desktop-Modal** (APP-STYLE §9): Energie, Soforthilfe
  („Gerade ist viel"), Zitat-Karte — zentriertes Modal über gedimmtem Hintergrund,
  Mobile weiterhin Vollbild.
- **Onboarding Schritt 2** ergänzt: Tageszeit-Auswahl (Morgens/Mittags/Abends),
  freie Uhrzeit, „Ohne Erinnerung fortfahren", Schritt-Punkte.
- MoodCard um Props erweitert (Titel/Tage/Verlauf-Default) für die Bento-Nutzung.

**Warum:** Verbindliche Vorgabe „Desktop ist kein verkleinertes Mobile" + „nichts
weglassen, jeder Zustand". Eintrag-Detail-Tabs (Eintrag/Reflexion/Gespräch) und
FAB-Modal waren bereits vorhanden und wurden verifiziert.

**Ergebnis/Status:** Build + Lint + 15 Tests grün, in mehreren Commits gepusht
(je Seite deploybar). Offen/Folge: Ritual-Abschluss könnte zusätzlich einen
Eintrag erzeugen (erscheint dann in „Letzte Einträge"/Archiv, Serie+1).

---

## 2026-06-21 (Teil 3) — Rate-Limiting für die KI-Routen (Backend-Härtung)

**Was:** Dependency-freies Fixed-Window-Rate-Limit pro IP (`server/src/lib/rateLimit.ts`)
als einziger Gate-Filter in `app.ts`. Begrenzt nur die teuren KI-/Sprach-Routen
(reflect, chat, contact-impulse, weekly-review, voice-reflect, tts, stt,
pattern-insights, title); Health, Config und Geräte-Sync sind ausgenommen.
Konfigurierbar über `RATE_LIMIT_PER_MIN` (Default 30, 0 = aus), ruhige deutsche
429-Antwort mit `Retry-After`. 5 Vitest-Tests ergänzt.

**Warum:** Vor öffentlicher Erreichbarkeit (Vercel) konnte ein offener Endpunkt
den Anthropic-/ElevenLabs-Key teuer machen. Nicht-Design-Arbeit, parallel zum
laufenden Design-Refresh — kollidiert nicht mit den UI-Seiten.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün, 15 Tests grün (vorher
10). Hinweis: In-Memory-Zähler gilt auf Vercel pro Lambda-Instanz; ein verteiltes
Limit wäre der nächste Schritt, falls nötig.

---

## 2026-06-21 (Teil 2) — Push-Fix, Bento→App-Quelle, neue Screens, Mobile-UX

**Was:**
- **Push-Fix:** 15 Commits lagen ungepusht → Live-Stand „sah aus wie davor".
  Seitdem konsequent nach jedem Commit `git push origin main`.
- **Quelle korrigiert:** Bento-Dashboard-Handoff ist gelöscht/veraltet; einzige
  Quelle = `design_handoff_app_shell_navigation/` (VORSCHAU + BAU-DAS + APP-STYLE).
  Frischen Prototyp (264 KB) gezogen; alte lokale Kopie war veraltet.
- **Dashboard Desktop** exakt nach Prototyp: Hero → Heute im Blick → **Tagesritual**
  (versehentliche Entfernung rückgängig) → Auswertung → **Energie-Widget** (neu)
  → Was sich zeigt → Letzte Einträge (3 Karten, Sand-Filter, schlichte Card).
- **Neue Screens:** FAB-Auswahl-Sheet („Was möchtest du tun?", Mobile-Sheet/
  Desktop-Modal), **Soforthilfe** (`/soforthilfe`, Kopf leeren), **Routine-Wechsel**
  (`/routine`, Gewohnheit ersetzen; neue Dexie-Tabelle routineDays v9).
- **Mobile-UX-Pass** (ui-ux-pro-max): Stimmung-Kopf gestapelt, Serie/Woche
  nebeneinander, Tagesritual-Badge entzerrt, Heute-im-Blick-Buttons 2-up,
  Energie-Meter volle Breite.
- **Spracheingabe** in allen Schreibfeldern; Browser-STT-Dopplungsbug
  („ich ich ich") über resultIndex-Akkumulation behoben.

**Ergebnis/Status:** Build+Typecheck+Lint grün, alles gepusht. Offen: Desktop-
Overlays (Eintrag-Detail/Ritual-Abschluss), weiterer Mobile-Feinschliff.

---

## 2026-06-21 — Claude-Design-Funktionen übernommen (7 neue Screens)

**Was:**
- **Schrift kräftiger:** `-webkit-font-smoothing: antialiased` aus `body`
  entfernt. Der Prototyp setzt es nicht; antialiased rendert Figtree auf
  Chrome/Safari dünner. Behebt „Schrift wirkt dünner als bei Claude Design".
- **Einträge exakt nach Prototyp:** JournalCard-Abstände (12/8px, lh 1.55),
  Dashboard „Letzte Einträge" als gleichmäßiges 3-Spalten-Grid (gap 18) statt
  asymmetrischem 7/5, Filter-Pillen mit Sand-Aktiv-Style.
- **Roter Faden** (`/roter-faden`): wiederkehrende Themen-Cluster über Wochen
  (`themeClusters` in insights.ts), Drill-in aus Muster.
- **Verlauf** (`/verlauf`): Zeitraum-Analyse (Monat/6 Monate/Jahr), Stimmungs-
  Sparkline + Themen-Verschiebungen (`moodTrend`/`themeShifts`/`trendStory`).
- **Schleife lösen** (`/schleife`): 3-Schritt-Fokus-Flow im Flieder-Ton,
  schließt mit Stability-Moment. Einstieg aus Klärung.
- **Impuls-Pakete** (`/impulse`): kuratierte Schreib-Impulse, an Onboarding-
  Fokus gekoppelt; Impuls startet Eintrag (`/neu?prompt=`).
- **Zitat-Karte teilen** (`/teilen`): Insight als Karte, Format + Farbwelt,
  PNG-Export per Canvas + Web-Share (dependency-frei).
- **Wochen-Brief** (`/wochen-brief`): warmer KI-Brief + Frage; neue Server-Route
  `/api/weekly-letter` (strukturiertes JSON), Vorlesen per SpeechSynthesis.
- **Energie-Check** (`/energie`): Kapazität statt Stimmung, neue Dexie-Tabelle
  `energyLevels` (v8) inkl. Sync.

**Warum:** Vroni: „alles was in Claude Design ist, hier übernehmen und einbauen;
Optik schauen wir am Ende an."

**Ergebnis/Status:** Build + Typecheck + Lint grün, je Screen einzeln committet.
Danach Feinschliff: Eintrag-Detail-Tabs (Sand-Track + „· N"-Zähler), Muster
„Stimmung · 7 Tage" mit Punkte/Verlauf-Umschalter + Legende (neue `MoodCard`),
Archiv-Kopf (Zurück + „Alle Einträge" + Suche). **Noch offen:** Desktop-Modal-
Overlays (Ritual-Abschluss & Eintrag-Detail zentriert über „Heute") — braucht
Background-Location-Routing, bewusst für den Optik-Gesamtpass aufgehoben.

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

## Reflexion-mit-Gespräch + Sprachausgabe entschärft

**Was:**
- „Neu reflektieren" bezieht jetzt das **Gespräch** mit ein: `ReflectRequest.conversation`
  wird mitgesendet; der Reflexions-Prompt (`buildReflectionSystem`/`buildReflectionUser`)
  reflektiert über Eintrag UND Chat zusammen statt nur über den Ausgangstext.
- Auf Mobile sichtbar gemacht: beim Reflektieren wird zur Reflexion gescrollt,
  der alte Text bleibt während des Nachdenkens stehen (kein Leerblitzen), plus
  „denkt nach…"-Hinweis.
- **Automatisches Vorlesen entfernt** (auf Wunsch): kein autoSpeak mehr in
  Reflexion und Chat. Vorgelesen wird nur noch per Tipp auf „Vorlesen" — ein
  direkter Nutzer-Tap, der auf Mobile nicht von der Autoplay-Sperre blockiert
  wird (deshalb bleibt die natürliche Stimme erhalten statt auf die Browser-
  Stimme zurückzufallen) und der zugleich als sichtbarer „Stopp" dient.
  autoSpeak-Schalter aus den Einstellungen genommen.

**Warum:** „Neu reflektieren" wirkte wirkungslos (Gespräch wurde ignoriert, und
auf Mobile lief die Aktualisierung außerhalb des Sichtbereichs); das
Auto-Vorlesen fiel auf Mobile auf die Roboter-Stimme zurück und ließ sich nicht
stoppen, weil es ohne sichtbaren Auslöser startete.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle ok.

## EntryDetail: segmentierte Ansicht statt endlosem Scroll

**Was:** Die Eintrags-Detailseite stapelte alles untereinander (Eintrag + Meta,
lange 8-teilige Reflexion, Session-Close, kompletter Chat, Aktionen ganz unten) —
auf Mobile ein ewiger Scroll. Jetzt **segmentierte Steuerung** (Tabs) mit drei
fokussierten Bereichen: **Eintrag · Reflexion · Gespräch** (mit Zähler-Badge).
Pro Tab eine klare Hauptaktion (Reflexion-Tab: „Neu reflektieren" oben statt
unten; leerer Zustand mit CTA). Sekundär/destruktiv (Markdown/Löschen) in einer
ruhigen, abgesetzten Fußzeile. Standard-Tab: Reflexion.

**Warum:** UX-Feedback „optisch unübersichtlich, mobile ewiger Scroll, Chat füllt
den ganzen Screen". Muster aus `ui-ux-pro-max` (Segmented Control für Top-Level,
eine Haupt-CTA pro View, content-priority mobile, destruktive Aktionen abgesetzt).
Nebeneffekt: der Chat lebt in seinem eigenen Tab und schiebt nichts mehr weg.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün.

## Dashboard: Stimmungs-Umschalter Punkte/Verlauf wieder da + Claude-Design-Abgleich

**Was:**
- Stimmungskarte hat wieder den **Umschalter Punkte / Verlauf** (aus
  Bento-Dashboard.dc.html): „Verlauf" rendert eine Flächen-Linie aus den echten
  Tageswerten (`MoodDay.value` neu in `lib/insights.ts`), „Punkte" die 7
  Tagespunkte; dazu Legende „Schwer → Leicht". Default: Punkte. Bei <2 Tagen mit
  Eintrag zeigt der Verlauf einen ruhigen Hinweis statt einer leeren Linie.
- **Claude-Design-Abgleich:** Handoff `Bento-Dashboard.dc.html` aus dem
  App-Projekt gelesen (Quelle der Wahrheit für den Umschalter). Zusätzlich eine
  rein additive Notiz `IMPLEMENTIERTER-STAND.md` ins App-Projekt geschrieben
  (nichts überschrieben — Plan auf genau diesen einen neuen Pfad begrenzt), damit
  Claude Design den aktuellen App-Stand kennt (Sync, Detailseiten-Tabs, kein
  Auto-Vorlesen, Mood-Umschalter).

**Warum:** Der Umschalter war im Dashboard verloren gegangen; im Design-System
ist er vorgesehen. UI-Skill `ui-ux-pro-max` herangezogen.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün.

## Geräte-Sync: Lösch-Synchronisierung (Tombstones)

**Was:** Löschungen propagieren jetzt über Geräte. Neue Dexie-Tabelle
`tombstones` (Version 4); `deleteEntry` (inkl. zugehöriger Chat-Nachrichten),
`deletePatternInsight` und „Alle Daten löschen" (`clearAllData`) legen Lösch-
Marker an. Server: `/api/sync/pull` liefert auch gelöschte Datensätze (Flag
`deleted`), `/api/sync/push` akzeptiert `deleted`. Client-Merge ist jetzt
echtes Last-Write-Wins inkl. Löschungen: neuere Löschung gewinnt über ältere
Bearbeitung und umgekehrt (Wiederbelebung hebt den Tombstone auf).

**Warum:** Sync v1 war Union-only — auf einem Gerät gelöschte Einträge kamen vom
anderen zurück.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle ok.
Kein DB-Schema-Update nötig (die `deleted`-Spalte gab es bereits).

**Offen:** konfliktfeste Push-Logik (conditional Upsert), inkrementeller Pull,
gelegentliches Aufräumen alter Tombstones.

## Open Loops — Bereich „Klärung"

**Was:** Neuer, ruhiger Bereich **Klärung** (`/klaerung`) für „offene Schleifen"
— innere offene Punkte festhalten, damit sie nicht im Kopf kreisen. Erfassen
(Titel + optionale Notiz), Status **offen → geklärt** (mit kurzer „Wie hat es
sich geklärt?"-Zeile), Wieder-öffnen, Löschen. Sektionen „Offen" / „Geklärt".

**Technik:** Shared-Typ `OpenLoop` + `SyncKind` „openLoops"; Dexie-Tabelle
`openLoops` (Version 5); CRUD in `queries.ts` (mit Tombstone beim Löschen);
`useOpenLoops`-Hook; Seite `pages/Clarity.tsx`; Route + Navigation („Klärung"
als Desktop-Pill und im Profil-Menü, Kompass-Icon). Voll in den Geräte-Sync
eingebunden (SYNC_TABLES + Server-Enum erweitert).

**Warum:** Erstes Stück der gewünschten Selbstführungs-Funktionen
(„Open Loops zuerst", eigener Bereich). Decision Review folgt als nächster Schritt.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle ok.

## Decision Review — „Klärung" zweiter Reiter

**Was:** „Klärung" hat jetzt zwei Reiter (segmentierte Steuerung): **Offene
Schleifen** und **Entscheidungen**. Decision Review: Entscheidung festhalten
(Frage + optional Neigung/Erwartung + „Wie stimmig fühlt es sich gerade an?"
1–10), später **Rückblick** („War stimmig" / „Eher nicht" + optionale Notiz) →
Status reflektiert mit Badge. Wieder-öffnen, Löschen.

**Technik:** Shared-Typ `Decision` + `SyncKind` „decisions"; Dexie v6 Tabelle
`decisions`; CRUD in `queries.ts` (mit Tombstone); `useDecisions`-Hook;
`pages/Clarity.tsx` um Tab-Steuerung + Decisions-Sektion erweitert. Voll im
Geräte-Sync (SYNC_TABLES + Server-Enum), inkl. Lösch-Sync.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle ok.
Damit sind Open Loops UND Decision Review umgesetzt.

## STT: freundlicher Guthaben-Fehler + Browser-Fallback

**Was:** Bei aufgebrauchtem ElevenLabs-Guthaben (HTTP 401 quota_exceeded) gab es
einen rohen JSON-Fehler. Jetzt: Server erkennt quota/credits → ruhige Meldung
(„Das Sprach-Guthaben ist gerade aufgebraucht. Tippe deinen Text …", code
"quota", Status 402). Im `DictationButton` erscheint nach jedem Server-STT-Fehler
ein Knopf „Stattdessen Browser-Mikrofon nutzen" (wenn der Browser
Spracherkennung unterstützt) → man hängt nicht fest.

**Warken:** Lange Sprachaufnahmen kosten viele ElevenLabs-Credits; Free-Tier ist
schnell aufgebraucht. Fallback hilft v.a. auf Desktop (Chrome/Edge); auf iOS
ohne Browser-STT bleibt der Hinweis aufs Tippen.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün; esbuild-Bundle ok.

## Spracheingabe: kostenlos zuerst (Browser) + Lang-Aufnahme-Warnung

**Was:** Neue Einstellung `preferFreeSpeech` (Standard an). Spracheingabe nutzt
nun **die kostenlose Browser-Spracherkennung, wo verfügbar** (Desktop Chrome/
Edge, Android); die kostenpflichtige ElevenLabs-Erkennung springt nur ein, wenn
der Browser keine Spracheingabe kann (z.B. iOS/Safari). Schalter in den
Einstellungen („Kostenlose Browser-Spracherkennung bevorzugen"). Zusätzlich im
ElevenLabs-Modus eine sanfte Warnung ab 60 s Aufnahme („verbraucht Guthaben").

**Warum:** Nutzerin möchte möglichst kostenlos bleiben; ElevenLabs-Credits sind
begrenzt und lange Aufnahmen teuer.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün.

## JSON-Import (Sicherung zurückspielen)

**Was:** Export deckt jetzt alle Tabellen ab (zusätzlich patternInsights,
openLoops, decisions; version 2). Neuer **Import** (`importAllJson`) in den
Einstellungen: zusammenführend (merge) — Vorhandenes bleibt, ein Datensatz wird
nur überschrieben, wenn die Sicherung neueren/gleichen Stand hat (per
updatedAt/createdAt). Einstellungen werden bewusst nicht importiert
(geräte-spezifisch). Button „Sicherung importieren (JSON)" + Hinweis; löst nach
Import einen Geräte-Sync aus (`notifyDataChanged`).

**Warum:** Export war da, das Zurückspielen fehlte — schließt den Kreis als
Sicherheitsnetz.

**Ergebnis/Status:** `npm run build` + `npm run lint` grün.

## Barrierefreiheits-Feinschliff (Web Interface Guidelines)

**Was:** Review mit `web-design-guidelines`; konkrete Fixes:
- `touch-action: manipulation` + dezenter Tap-Highlight für Buttons/Links/Tabs/
  Labels (kein 300ms-Delay, kein Doppeltipp-Zoom) in `globals.css`.
- Desktop-Suche: echtes `type="search"`, `name`, `autoComplete="off"`,
  `aria-label`.
- Asynchrone Statusmeldungen werden für Screenreader angekündigt:
  Diktat „Transkribiere…" als `aria-live="polite"`, Sync-Status `aria-live`,
  Fehlermeldungen (Diktat, Chat, EntryDetail, VoiceCheckin, WeeklyReview) als
  `role="alert"`.

**Basis war schon da:** sichtbarer `:focus-visible`-Ring, `prefers-reduced-motion`.

**Ergebnis/Status:** `npm run build` + `npm run lint` + Typecheck grün.

## Session-Protokoll 2026-06-20 (Sync, Klärung, Sprache, A11y)

Großer Arbeitstag. In dieser Sitzung umgesetzt (alle live auf Vercel, Build/Lint/
Typecheck grün, einzelne Commits):

1. **Geräte-Sync (Supabase) eingerichtet & live:** Server-Proxy `/api/sync`
   (pull/merge/push, Last-Write-Wins) hinter dem Passwort-Gate; Supabase-Projekt
   (EU/Ireland) + Tabelle `sync_records`; Env-Vars in Vercel. Handy & Desktop
   zeigen denselben Stand.
2. **Lösch-Sync (Tombstones):** Löschungen propagieren über Geräte; keine
   Wiederauferstehung.
3. **Reflexion bezieht Gespräch ein** („Neu reflektieren") + auf Mobile sichtbar
   (Scroll, kein Leerblitzen).
4. **Auto-Vorlesen entfernt:** Vorlesen nur per Tipp (natürliche Stimme bleibt,
   sichtbarer Stopp). Behebt den Roboterstimmen-Fallback auf Mobile.
5. **EntryDetail neu strukturiert:** Tabs Eintrag · Reflexion · Gespräch statt
   endlosem Scroll (ui-ux-pro-max).
6. **Dashboard:** Stimmungs-Umschalter **Punkte/Verlauf** wieder da (+ Legende),
   abgeglichen mit Bento-Dashboard-Handoff.
7. **Bereich „Klärung":** **Open Loops** (offene Schleifen) + **Decision Review**
   (Entscheidungen + ehrlicher Rückblick), beide voll im Sync.
8. **Sprache kostenlos zuerst:** Browser-STT bevorzugt, ElevenLabs nur wenn nötig
   (iOS); freundlicher Guthaben-Fehler + Browser-Fallback + Lang-Aufnahme-Warnung.
9. **JSON-Import:** Sicherung zusammenführend zurückspielen (Export deckt nun alle
   Tabellen ab).
10. **A11y-Feinschliff:** touch-action/Tap-Highlight, Such-Input-Semantik,
    aria-live/role="alert" für Status & Fehler.

**Geklärt:** Es gibt **ein** Designsystem (Innerline) + ein **App-Projekt**
(Handoffs) — saubere Trennung, kein Duplikat.

**Offen (klein, vertagt):** Sprach-Eingabe in die VS-Code-Chatleiste (morgen);
optionale Tests + Sync-Mikro-Optimierungen.

## Reflexion: lebende Reflexion bezieht Gespräch wirklich ein + Verlauf

**Was:** „Neu reflektieren" bezog das Gespräch zwar technisch schon ein, aber das
Modell gewichtete es zu schwach (Antwort wurde nur länger, neue Themen fehlten).
Jetzt:
- **Prompt deutlich verschärft:** klare „AKTUALISIERTE REFLEXION"-Direktive +
  Gespräch prominent als „neuester Stand" gelabelt mit explizitem Auftrag, die
  neuen Themen konkret aufzugreifen (nicht die erste Reflexion verlängern).
- **Lebende Reflexion + Verlauf:** vorherige Reflexion wird bewahrt
  (`JournalEntry.previousReflections`, neueste zuerst, max. 5) und ist unter
  „Frühere Reflexionen" aufklappbar. Button heißt bei vorhandenem Gespräch
  „Mit Gespräch neu reflektieren" + Hinweis „Bezieht Eintrag + Gespräch ein".

**Recherche:** Rosebud/Reflection/Mindsera behandeln Reflexion+Gespräch als ein
sich entwickelndes Ganzes (Synthese über den Verlauf), Quelle bleibt sichtbar →
gewähltes Modell: eine lebende Reflexion mit erhaltenem Verlauf.

**Ergebnis/Status:** Build + Lint + Typecheck grün; esbuild-Bundle ok.

## Dashboard: „Was sich zeigt" + „Stabile Schritte" füllen sich zuverlässig

**Was:** Beide Karten blieben im Alltag leer, weil ihre Auslöser zu eng waren.
- **Stabile Schritte:** Jetzt wird bei **jeder Reflexion** ein Schritt erfasst
  (neuer Kind `reflektiert`), zusätzlich beim **Klären einer Schleife**
  (`schleife-geklaert`) und beim **Entscheidungs-Rückblick**
  (`entscheidung-reflektiert`).
- **Was sich zeigt:** Schwellen gesenkt (Top-Thema ab 2 statt 3 Einträgen) +
  neue, ehrliche Beobachtung „häufigste Emotion" (ab 2×).

**Ergebnis/Status:** Build + Lint + Typecheck grün; esbuild ok.

## KI-Titel pro Eintrag + bessere Karten-/Reflexions-Anrisse

**Was:**
- **KI-Titel:** Neue Route `/api/title` (winziger Claude-Aufruf, max 24 Tokens,
  Sonnet) erzeugt 3–6-Wort-Titel aus dem Inhalt. Client (`lib/title.ts`) erzeugt
  ihn im Hintergrund beim Speichern (NewEntry + Voice-Check-in) und legt
  `JournalEntry.title` ab (synct mit). Karten zeigen ihn.
- **Fallback** (ohne Key/offline): `entryTitle` bevorzugt `title`, sonst
  Sprach-Zusammenfassung, sonst erster sinnvoller Satz mit übersprungenen
  Füllwörtern („du, weißt du was…"), sonst Themen.
- **Frühere Reflexionen:** Anriss überspringt die immer gleiche Überschrift und
  zeigt den ersten echten Inhaltssatz → Versionen sind unterscheidbar.

**Recherche:** KI-Titel sind in AI-Journaling-Apps Standard (Day One Title
Suggestions, Rosebud, Super Diary, DayJot).

**Ergebnis/Status:** Build + Lint + Typecheck grün; esbuild ok.

## Tagesritual (6-Minuten-Ansatz) + ersetzt „Stabile Schritte"

**Was:** Neues tägliches Ritual aus der Positiven Psychologie (eigene
Formulierung, nicht die Buchtexte). Morgens: Dankbarkeit (bis 3), „Was macht den
Tag gut?", ein guter Ich-Satz. Abends: Gutes getan, Was wäre besser gegangen,
schöne Momente (bis 3). Eigene Seite `/ritual` (tageszeit-abhängige Reihenfolge,
Auto-Speichern onBlur). Datenmodell `DailyRitual` (eine Karte pro Tag, id=Datum),
voll im Geräte-Sync inkl. Server-Enum; Hook `useDailyRitual`; Nav-Eintrag im
Profil (Sonnen-Icon).

**Dashboard:** Die verwirrende „Stabile Schritte"-Karte ist **ersetzt** durch
eine tageszeit-abhängige **Tagesritual-Karte** (morgens „Wofür bist du dankbar?",
abends „Was war heute schön?") mit Vorschau + Link „Ritual ausfüllen/ansehen".
recentSteps in `insights.ts` bleibt verfügbar, wird aber nicht mehr angezeigt.

**Recherche:** Inhalte des 6-Minuten-Tagebuchs (Spenst) + Five Minute Journal.

**Ergebnis/Status:** Build + Lint + Typecheck grün; esbuild ok.

## Session-Protokoll 2026-06-20 (Abend): Reflexion, Titel, Ritual

Fortsetzung des Tages. Zusätzlich umgesetzt (alle live, einzelne Commits, grün):
- **Reflexion bezieht Gespräch wirklich ein:** Prompt verschärft (klare
  „aktualisierte Reflexion"-Direktive, Gespräch prominent als neuester Stand) +
  **lebende Reflexion mit Verlauf** (`previousReflections`, „Frühere Reflexionen"
  als Progressive-Disclosure-Liste mit Datum/Anriss).
- **Reflektieren-Button auch im Gespräch-Tab** (Auffindbarkeit).
- **Dashboard-Karten** „Was sich zeigt" + „Stabile Schritte" zunächst aus
  vorhandenen Daten abgeleitet; „Stabile Schritte" dann **ersetzt** durch die
  **Tagesritual-Karte**.
- **KI-Titel pro Eintrag** (`/api/title`) + heuristischer Fallback.
- **Tagesritual** (6-Minuten-Ansatz, eigene Formulierung): Seite `/ritual`,
  `DailyRitual`-Modell, voll im Sync.
- **Sprache kostenlos zuerst** (Browser-STT bevorzugt) + Guthaben-Fehler-Handling.

**An Claude Design übergeben:** aktualisierter `IMPLEMENTIERTER-STAND.md` +
`DESIGN-AUFTRAG.md` (neue, noch ungestylte Bereiche hübsch machen; mehr Tiefe/
Bewegung: Verläufe, Bilder, Icons, grafische Elemente — persönlicher & lockerer,
ohne die ruhige Markenlinie zu verlieren).

**Morgen / offen:** Sprach-Eingabe in die VS-Code-Chatleiste; Design-Pass von
Claude Design einarbeiten; optionale Wochenfrage fürs Ritual; Tests für
Krisen-/Sync-Logik.

## App-Redesign (Claude Design „Innerline App.dc.html") — Phase 1

**Was:** Neuer App-Style-Leitfaden aus Claude Design importiert (`APP-STYLE.md`,
`Innerline App.dc.html`). Phase 1 umgesetzt:
- **Warme Tiefe & Bewegung:** Tool-Tokens (warmer Verlauf, clay-Rand, tiefer
  warmer Schatten) in `globals.css`; weich treibende Hintergrund-Lichtflächen
  (`body::before`, reduced-motion respektiert); Karten-Hover-Lift -5px.
- **`ToolCard`-Primitive** (warme, abgesetzte „Hilfs-Tool"-Karte).
- **Tagesritual prominent:** auf dem Dashboard als volle, warme ToolCard direkt
  unter „Heute im Blick" (Sonne/Mond-Badge, tageszeit-abhängig, klarer CTA);
  „Was sich zeigt" jetzt volle Breite. Ritual-Seite nutzt warme ToolCards mit
  Badges.

**Nächste Phasen (offen):** App-Shell/Tab-Leiste (Pill-Highlight, FAB),
Segmented/Chips/Toggles, per-Screen-Feinschliff; dann neue Funktionen
(Onboarding 2 Schritte, „Dein Fokus"-Chip, Erinnerungszeit, Ritual-Abschluss-
Moment, Serien-Meilenstein + Pausentag).

**Ergebnis/Status:** Build + Lint + Typecheck grün.

## App-Redesign Phase 4 (Teil): Serie-Meilenstein + Ritual-Abschluss-Moment

- **Serie/Meilenstein + Pausentag** auf dem Dashboard (Fortschrittsbalken zur
  nächsten Marke, „Noch X Tage …", Pille „1 Pausentag in Reserve").
- **Ritual-Abschluss-Moment:** sobald alle drei Fragen beantwortet sind, Button
  „Ritual abschließen" → warmer „Geschafft."-Moment (Medaillon mit Haken,
  Rückblick der Antworten, „Sechs Minuten für dich. Das zählt.", Fertig).
- Tagesritual-Kachel + Ritual-Seite zuvor 1:1 nach Prototyp (Hero/Stepper, Bild).

Quelle: Claude Design Innerline App.dc.html (Ritual-Abschluss / Serie).

**Ergebnis/Status:** Build + Lint + Typecheck grün.

## App-Redesign: Onboarding/Fokus + Typografie nach App-Style

- **Onboarding** (2 Schritte: Fokus + Erinnerungszeit) für neue Nutzer,
  überspringbar; **„Dein Fokus"-Chip** auf dem Dashboard; Einstellungen-Karte
  „Tagesritual & Fokus" (Fokus + Erinnerung, nur Anzeige). Neue AppSettings-
  Felder focusArea/reminderTime/onboarded (geräte-lokal).
- **Typografie-Fix:** Figtree wird jetzt als variable Achse geladen
  (`wght@400..800`) statt fester Stufen — dadurch rendern die App-Style-Gewichte
  echt: Headlines 650 (.serif), Lead/Insight **450** (neue `.lead`-Rolle,
  angewандt auf Dashboard-Lead/Insight/Hero-Zitat), große Zahlen 800.

**Ergebnis/Status:** Build + Lint + Typecheck grün.

## Session-Abschluss 2026-06-20 (Abend): App-Redesign aus Claude Design

Großer Redesign-Tag auf Basis von Claude Design (`APP-STYLE.md` +
`Innerline App.dc.html`, frisch nachgezogen, 172 KB). Umgesetzt & live:
- Warme Tiefe (Tool-Tokens, treibende Lichtflächen), Hover-Lift, ToolCard.
- Tab-Leiste im App-Style (Pill-Highlight, FAB-Glow).
- Tagesritual: prominente Dashboard-Kachel (Badge, Status, Headline, Themen-
  Chips, Bild, Orbs) + Ritual-Seite (Morgen/Abend-Hero, „Schritt X von 3",
  Fragen als Stepper) + Abschluss-Moment („Geschafft", Medaillon, Rückblick).
- Serie mit Meilenstein-Fortschritt + „1 Pausentag in Reserve".
- Onboarding (Fokus + Erinnerungszeit, überspringbar), „Dein Fokus"-Chip,
  Einstellungen-Karte „Tagesritual & Fokus" (neue AppSettings: focusArea,
  reminderTime, onboarded — geräte-lokal).
- „Worte der Woche" im Rückblick.
- Typografie-Fix: Figtree als variable Achse (wght@400..800); .lead-Rolle (450);
  Headlines 650, Zahlen 800.

**Entscheidungen:** Erinnerung = nur Einstellung/Anzeige (keine Push-Mitteilung).
Bilder: vorhandenes journaling-desk.webp wiederverwendet (kein Binär-Import).

**Morgen / offen:**
- Desktop-Modal-Overlay (Ritual/Eintrag als zentriertes Fenster über
  abgedunkeltem Dashboard) — aufwendig, v. a. Desktop.
- Detail-Politur einzelner Screens (Eintrag, Klärung, Empty-States).
- Claude-Design `IMPLEMENTIERTER-STAND.md` auf den heutigen Stand nachziehen.
- Voice-Eingabe in die VS-Code-Chatleiste (separat).

## App-Redesign v2 (Claude Design, 21.06.) — Tiefe, Tageszeit, Dashboard, Nav

Auf Basis des verbindlichen Briefings `AN-CLAUDE-CODE_App-Design.md` +
`design_handoff_app_shell_navigation/APP-STYLE.md` (jetzt inkl. §8) +
`README.md` (frisch gezogen, 239 KB Prototyp). Umgesetzt & live:
- **Tiefe:** `Card` mit Hover-Lift + weicherem Radius; treibende Hintergrund-
  Orbs (globals).
- **Tageszeit-Theming** (`lib/daypart.ts`): morgens warm, **abends Flieder/Lilac
  #CBBEF4**, automatisch ab 18 Uhr (kein sichtbarer Umschalter). Angewandt auf
  Tagesritual-Dashboard-Karte, Ritual-Seite (Hero/Stepper/Abschluss).
- **Typografie:** Figtree variabel (400..800), `.lead` 450 (vorheriger Commit).
- **Dashboard-Begrüßung** hell auf Creme (Datum + „Guten Morgen, Name" + Fokus-
  Chip + 2 Buttons) statt dunklem Foto-Hero — nach Mobile-Prototyp.
- **Archiv** (`/archiv`, Einträge nach Monat) + „Alle ansehen" unter „Letzte
  Einträge".
- **Mobile-Nav** nach Prototyp: untere Leiste = Heute·Muster·FAB·Klärung·
  Rückblick; Profil über Avatar oben rechts (Sheet).

**Noch offen (größere neue Screens aus dem Prototyp, brauchen Priorisierung):**
Roter Faden · Gedankenschleife lösen · Impuls-Pakete (an Fokus gekoppelt) ·
Verlauf/Fortschritt · Wochen-Brief · Zitat-Karte teilen · Energie-Check ·
Desktop-Modal-Overlays (Ritual-Abschluss & Eintrag-Detail) · Muster „Punkte/
Verlauf"-Feinschliff. Außerdem: Claude-Design `IMPLEMENTIERTER-STAND.md`
nachziehen.

**Freigabe:** Bash projektweit erlaubt (settings.local.json), damit autonom
gearbeitet werden kann.

## Block B — Desktop-Screens nach VOLLSTAENDIGES-BRIEFING (22.06.)

Neue Datei direkt von Claude Design gezogen (`VOLLSTAENDIGES-BRIEFING_Claude-Code.md`,
22 Screens + Navigations-Karte + Block A/B + Abschluss-Check) sowie das Foto
`journal-mat.webp` (aus `images/`, dekodiert nach `web/public/img/`). Block A war
über die parallele PR #1 bereits live; meine doppelte A8-Arbeit wurde verworfen.

Umgesetzt & live (je ein Commit, Build/Lint grün):
- **Icons:** zentrale `icons.tsx` jetzt 1:1 aus Lucide (stroke 1.6) + `tileRelief()`-
  Token (APP-STYLE §13).
- **B3** Desktop-Profil-Dropdown (§12: 280px, Radius 20, Scrim .07, Avatar-Ring).
- **B4** Tagesritual Desktop = echte 2-spaltige Seite (`1fr 432px`) mit Tageszeit-
  Foto rechts (Morgen `notebook-still`, Abend `journal-mat`); Abschluss bleibt
  laut Nav-Karte Desktop-Modal.
- **B1** Onboarding Desktop = 2-spaltiges Modal (660px, `welcome-still` rechts 248px).
- **B2** Empty State Desktop = 2-spaltig (Clay+Ritual links, Muster-Platzhalter rechts).
- **B5/B6/B7** Gedankenschleife (560px, Lilac-Emblem) + Impulse (620px) als
  zentrierte Desktop-Modals mit Schließen-X; Energie-Check auf 540px gesetzt.
- **B8** Einstellungen Desktop: runder Zurück-Button + Breadcrumb (kein Text-Link),
  2-spaltiges Bento, Autosave-Statuszeile.

**Bewusste Abweichung:** B8 nennt „Save-Button + Abmelden". Die App speichert
jede Änderung sofort und hat kein Konto/Login — daher ehrliche Autosave-Status-
zeile statt Pseudo-Speichern/Abmelden (nicht erfinden, vgl. Briefing-Regel 2/3).

**Noch offen (Feinschliff, nicht blockierend):** Tile-Relief flächig auf ALLE
Icon-Kacheln ausrollen (FabSheet-Optionen, JournalCard-Ritual-Kachel, Dashboard-
Kacheln); Mindest-Schriftgrößen (§14) systematisch gegenprüfen.

---

## 2026-06-23 — App-weiter Zurück-Button, Mobile-Finetuning & Gedankenschleife-Kopf

- **Zurück-Button zentral in der Topbar** (`Layout.tsx`): erscheint auf allen
  Nicht-Top-Level-Screens (`TOP_PATHS`), damit man aus jedem Screen sicher
  zurückfindet, ohne versehentlich die App zu schließen. Smarte Logik
  (`navigate(-1)` bei vorhandener History, sonst `/`). Die separaten
  Seiten-Zurück-Pfeile entfallen dafür (RedThread, Archive, Routine, Settings,
  RitualHistory) — keine Dopplung mehr.
- **Mobile-Finetuning:** mehr Kontrast beim Fokus-Chip, mehr Abstand
  Eyebrow→Headline app-weit, einzeilige Kurztexte (Gerade ist viel, Ritual-Kopf),
  klarere Trennung der Ritual-Recap-Antworten.
- **Gedankenschleife (`Loosen.tsx`) nach Claude-Design-Linie:** Lilac-Emblem
  jetzt zentral und auf Mobile **und** Desktop sichtbar (vorher nur Desktop,
  links). Aufbau wie Tagesritual (Emblem → Eyebrow → Titel); Schließen-X bleibt
  Desktop-Modal oben rechts.

Build/Lint/Typecheck grün; Branch nach `main` fast-forward (ausgerichtet).

---

## 2026-06-23 (Forts.) — Aufräumen, Handoff-Sync & mehrere Feinschliffe

- **Aufräumen:** Icon-Daten sauber getrennt (`icons.tsx` = nur Komponente,
  `iconset.tsx` = ICONS, `tile.ts` = tileRelief) → `npm run lint` warnungsfrei.
- **Muster-Top:** „Stimmung" und „Was sich zeigt" jetzt 50/50, gleich hoch,
  Trennstriche bündig (MoodCard-`fill`-Flag, 7-Tage); „Was sich zeigt" neu
  aufgeteilt (Text+Tags links, Mini-Karte rechts, kompaktes Teilen).
- **Handoff-Sync (§10):** Favicon auf FAB-Optik (book-heart), TILE.gold/lila
  korrigiert (+ Profil Klärung=Lila, Ritual-Verlauf=Clay), korrupter
  `flame`-Pfad gefixt + Serie nutzt `award`, FAB-Verlauf 160deg.
- **„Was sich zeigt"-Text:** showcaseInsight liefert zwei sich ergänzende,
  datengetriebene Sätze (+ Bedürfnis- und Schreib-Konstanz-Quelle).
- **Roter Faden:** `normalizeTopic()` führt Synonyme/Beugungen zusammen; Titel
  bleibt die häufigste eigene Schreibweise.
- **Tile-Relief:** auf die letzten flachen Icon-Kacheln (Impulse, Soforthilfe).
- **Teilen-Karte:** 6 Auswahlbilder, davon 3 feste neutrale Naturbilder.

**Bewusst offen / wartet:** „Neuer Eintrag"-Redesign (User holt dazu ein eigenes
CD-Handoff ein); Gedankenschleife-Mobile bleibt wie gewünscht (kein 1:1-Handoff,
da die aktuelle Ansicht ausdrücklich gefällt).

---

## 2026-06-23 (Forts. 2) — Neuer Eintrag (Claude-Design §11) + Muster-Feinschliff

- **Muster „Was sich zeigt":** Mini-Karte und Tag-Chips entfernt (die häufigen
  Worte stehen direkt darunter), Einsicht als Fließtext; Fußzeile als feste
  `h-5`-Zeile, sodass der Trennstrich exakt mit der Stimmungs-Legende fluchtet.
- **Neuer Eintrag komplett neu (Handoff §11):** Schreib-Impuls-Karte mit
  rotierenden Prompts, großes Textfeld (Wortzahl + Zeitstempel + Diktat),
  Stimmung/Intensität (1–10) immer sichtbar, „Gefühl" offen, „Worum es geht" /
  „Impuls & Absicht" / „Alltag" als Accordions. Desktop 2-spaltig (Schreiben
  links, Kontext-Panel rechts), Mobile als Scroll-Editor. Alle Muster-Felder
  bleiben erhalten.
- **Felder:** Auswahl-Zustände (ScaleField-Zahlen, ChipSelect) auf den grünen
  Verlauf umgestellt (nie dunkel, §11) — wirkt app-weit konsistent.

Handoff §10-Sync war bereits umgesetzt; §1–9 aus Vor-Sessions. Damit ist
Handoff #5 vollständig abgeglichen.
