# Learnings & Entscheidungen

Gesammelte Erkenntnisse, getroffene Entscheidungen und ihr Warum.
Eine Erkenntnis pro Punkt; veraltete Punkte korrigieren statt duplizieren.

---

- **Tägliche Rotation braucht ein wechselndes *Ergebnis*, nicht nur einen
  wechselnden Seed.** Bei `showcaseInsight` rotierte der Seed korrekt täglich,
  doch solange bei genau zwei Kandidaten ohnehin *beide* Sätze gezeigt wurden,
  blieb der sichtbare Block konstant. Regel: einen zweiten Eintrag erst anhängen,
  wenn dadurch nicht die gesamte (Rest-)Menge gezeigt wird — sonst frisst die
  Vollständigkeit die Rotation. (2026-06-30)

## Architektur & Entscheidungen

- **Web-App statt Mobile/Desktop**, Stack Next.js 15 + React 19 + TS + Tailwind v4
  — schneller Einstieg, großes Ökosystem, später erweiterbar.
- **Einträge bleiben lokal (localStorage).** Datenschutz-Grundhaltung: nur bei
  angeforderter Reflexion verlässt Text das Gerät (an die Claude-API).
- **Reflexion per Streaming.** Bessere UX (Text erscheint live) und vermeidet
  HTTP-Timeouts bei längeren Antworten.
- **Begleiter ist neutral benannt** („Begleiter"), kein Eigenname — bewusste
  Produktentscheidung nach dem Rename.

## Technische Learnings

- **Monorepo-Workspace-Importe müssen ins Vercel-Bundle.** Der Server-Build
  nutzt `esbuild --packages=external` (npm-Pakete bleiben extern, in
  `node_modules`). Das externalisiert aber **auch** `@journal/shared`, dessen
  `exports` auf **TS-Quellen** zeigen (`./src/*.ts`). Solange `@journal/shared`
  nur `import type` genutzt wird, ist das egal (Typimporte werden entfernt).
  Sobald ein **Laufzeitwert** importiert wird (z. B. `crisis`), sucht die
  Funktion zur Laufzeit eine `.ts`, die es im Vercel-Runtime nicht gibt →
  `ERR_MODULE_NOT_FOUND`, ganze Funktion stürzt ab (alle `/api/*` = 500). Fix:
  Workspace-Pakete per `--alias:@journal/shared=./shared/src/types.ts` (+ Subpfad
  `…/crisis`) **mit einbündeln**. Faustregel: Bricht „alles auf einmal" auf
  Vercel, aber lokal nicht → erst `…/api/health` aufrufen (gibt `INIT_ERROR` +
  Stacktrace aus), bevor man Env/Config verdächtigt.
- **„Sync off" kann ein Folgefehler sein.** Der Client setzt `hasSync:false`
  auch, wenn `/api/config` *scheitert* (catch-Fallback in `apiClient.ts`). Ein
  Totalausfall der Funktion sieht damit identisch aus wie „Sync nicht
  konfiguriert" — nicht in die Irre führen lassen.
- **SDK `@anthropic-ai/sdk` 0.69.x** typisiert `thinking: {type: "adaptive"}`
  noch nicht (`Type '"adaptive"' is not assignable to ...`). Lösung vorerst:
  Thinking-Parameter weglassen (für kurze Reflexionen unkritisch). Bei
  SDK-Update reaktivieren.
- **Next.js 15.5.4 hatte eine Sicherheitslücke** (CVE-2025-66478) → auf
  `^15.5.19` (gepatcht) angehoben.
- **GitHub-Rename** wird von der API erst nach kurzer Verzögerung kanonisch
  sichtbar; Remote-URL danach mit `git remote set-url origin <neu>` umsetzen.
  Der Integrations-Token darf das Repo nicht selbst umbenennen (HTTP 403).
- **Agent-Skills** liegen unter `.agents/skills/` und sind nach `.claude/skills/`
  verlinkt; sie erscheinen erst ab der nächsten Session in der Skill-Liste.
- **`.env` & dotenv:** `dotenv.config()` überschreibt **nicht** bereits gesetzte
  Umgebungsvariablen. Lösung: `dotenv.config({ override: true })`, damit
  `server/.env` immer gewinnt.
- **API-Key-Fehler (401 invalid x-api-key)** hatte mehrere Ursachen-Kandidaten:
  Platzhalter nicht ersetzt / Editor nicht gespeichert / `ANTHROPIC_API_KEY=`-Prefix
  gelöscht / Terminalbefehl in die `.env` getippt / **alter Dev-Prozess lief weiter**.
  Schnellster Test der Key-Gültigkeit: direkter Mini-Call gegen
  `api.anthropic.com/v1/messages` (max_tokens 1).
- **`pkill -f "<muster>"`** kann sich selbst treffen, wenn das Muster im eigenen
  Kommando vorkommt → lieber per PID killen.

## 2026-06-25 (Heute-Hero Variante C)

- **Foto-Hero full-bleed im gepolsterten `<main>`.** Der `<main>` hat `px-5 pt-6`;
  der Mobile-Hero soll randlos unter dem App-Header sitzen → äußeren Wrapper mit
  `-mx-5 -mt-6`, dann Foto (470px) + überlappende Aktions-Fläche (`marginTop:-26`,
  `border-radius:26px 26px 0 0`) als ein Flex-Item. So bleibt der `gap-5`-Fluss zum
  Rest der Seite intakt.
- **Prototyp-Header-Chrome nicht doppeln.** Die Vorlage zeichnet Wortmarke/Suche/
  Avatar auf das Hero-Foto, weil sie ein standalone Phone-Frame ist. Die echte App
  hat dafür den Layout-Header — Chrome also weglassen, nur Begrüßungsblock +
  Aktions-Fläche übernehmen.
- **Feste Tageszeit-Texte statt Rotation.** Begrüßung + Frage kommen jetzt
  deterministisch aus dem Zeitfenster (`TIME_CONTENT`), nicht mehr aus täglich
  rotierenden Pools — entspricht dem Handoff (§3) und macht den Ton vorhersehbar.
- **Volle Lucide-Sonne ≠ iconset-`sun`.** Das Projekt-`iconset.sun` ist eine
  Sunrise-Variante; der Hero braucht die volle Sonne mit allen Strahlen → eigene
  `TimeOfDayGlyph`-Komponente mit den exakten Pfaden aus der Spec (§6).
- **Zwei „Fokus"-Begriffe nicht verwechseln.** `settings.focusArea` (persistent,
  Onboarding/Einstellungen) vs. `ritual.makeGreat` (Tagesritual-Antwort). Der
  Dashboard-Chip las nur `makeGreat` → ein in den Einstellungen gesetzter Fokus
  wurde nie angezeigt. Lösung: `makeGreat || focusArea`, Empty-State → Einstellungen.
- **„Statische" Einsicht-Kacheln:** Rückblick nutzte `buildInsights()[0]` (kein
  `*…*`-Akzent, keine Rotation, plain gerendert), während Dashboard/Muster
  `showcaseInsight` nutzen (Akzent + Seed-Rotation). Einheitlich `showcaseInsight`
  + `withAccents` verwenden. **Seed = Tag + Datenmenge** (`+ entries.length`),
  damit sich der Satz nicht nur täglich, sondern auch bei Datenänderung sichtbar
  ändert — sonst wirkt er trotz Datengetriebenheit „fix".
- **Immersive Kopfzeile = gleiche Elemente, nur Leiste weg.** Auf dem Dashboard
  (`location.pathname === "/"`) wird die mobile Kopfzeile `absolute` + transparent
  (helle Wortmarke, Glas-Suche, Avatar mit weißem Rand) und schwebt über dem Foto;
  sonst solide Leiste. Logo links / Suche + Avatar rechts bleiben an **derselben
  Position** — so wirkt der Seitenwechsel ruhig. Wichtig: Suche/Avatar/Logo waren
  schon global, nur die Leiste fällt weg.
- **Mini-/Teilen-Karte aus EINER Quelle.** Schlüsselwort + Seed der „Was sich
  zeigt"-Karten zentral in `lib/insights.ts` (`showcaseSeed`/`showcaseKeyword`).
  Vorher berechneten Dashboard und Muster eigene Seeds/Wortlisten → unterschiedliche
  Karten. Gemeinsame Helfer = identische Karte auf allen Seiten und „ändert sich
  mit den Daten" bleibt erhalten.
- **Text an Kartenbreite anpassen statt abschneiden.** `ThemeMiniCard` verkleinert
  lange Wörter proportional (Schwellenlänge je `fill`, Untergrenze 0.58·wordSize,
  `white-space:nowrap`). Reine Längen-Heuristik (keine DOM-Messung) — reicht für
  die dekorative Vorschau, vermeidet Überlauf ohne Glyph-Verzerrung.
- **Wortmarke gibt es in zwei Farbvarianten.** `innerline-wordmark.svg` (dunkel,
  Akzentlinie Clay) für helle Flächen, `innerline-wordmark-light.svg` (hell) fürs
  Foto. Akzent-/Markenfarben in BEIDEN pflegen — die helle Variante hatte den
  Akzent noch in Grün statt Clay.
- **Abend-Bild ist gekoppelt.** `zitat-weg.webp` (Bergpfad) dient sowohl als
  Abend-Hero als auch als Mini-Karten-Foto. Wenn das Bild getauscht wird, beide
  Verwendungen bedenken.
- **Gerundeter Übergang ≠ flache Linie.** Eine `border-radius:Xpx Xpx 0 0`-Kante
  hat in der Mitte IMMER eine gerade Kante — sie liest sich nur dann als „Rundung",
  wenn die creme Fläche genug Präsenz hat (höher gesetzt + weicher Schatten an der
  Oberkante, der die Kante aufs Foto wirft). Eine dünne, gleichfarbige 24px-Leiste
  wirkt wie ein Strich.
- **Abend-Scrim muss das warme Foto übertönen.** Das gewählte Abend-Bild ist warm/
  golden; ein dunkel-violetter Scrim wird matschig-braun. Lösung: klar gesättigter
  Lila-Verlauf PLUS eine flache Flieder-Tönung (`rgba(150,130,205,.22)`), damit der
  Eindruck wirklich flieder wird.
- **Erledigt-Status: ein Häkchen reicht.** Das Häkchen steckt schon im Medaillon —
  ein zweiter grüner Haken-Kreis daneben ist doppelt. Status „Heute erledigt ·
  automatisch gesichert" einheitlich grün, direkt unter „Tagesritual" (gestapelt
  neben dem Medaillon), Größe 11,5px (§5-Reihenfolge Eyebrow → Status).
- **Deploy-Verifikation ohne Live-Zugriff.** Die Live-Site ist aus der Build-
  Umgebung nicht erreichbar (Netzwerk-Policy → HTTP 000). Deploy lässt sich
  trotzdem absichern: (1) `main`-HEAD über die GitHub-API prüfen, (2) den exakten
  `vercel.json`-buildCommand lokal ausführen (schließt stillen Build-Abbruch aus).
  Vercel nutzt `npm install --include=dev` (nicht `npm ci`), repariert das Lockfile
  also selbst — manuelle Lock-Edits brechen den Build nicht.

## 2026-06-23 (Claude-Design Update)

- **Wiederkehrende Design-Bausteine als eine Komponente.** Die Mini-Karten-
  Vorschau taucht im Handoff an 4 Stellen auf — als `ThemeMiniCard` zentralisiert
  (Foto + Verlauf + Newsreader-Schlüsselwort), per Props (Größe/`fill`) variiert.
  Spart Drift und hält den Stil konsistent.
- **`preserveAspectRatio="none"` verzerrt SVG-Inhalte** (Kreis → Oval). Punkte/
  Marker daher außerhalb des SVG als absolut positioniertes Element setzen,
  Position aus den viewBox-Koordinaten in %/px umrechnen.
- **Fokus = Tagesergebnis, nicht Onboarding-Wert.** Der „Dein Fokus"-Chip kommt
  jetzt aus dem Ritual (`makeGreat`); Onboarding setzt nur einmalig Präferenzen.
  Zwei klare Zustände (gesetzt/offen) statt Dauer-Chip.

## 2026-06-23

- **„Roter Faden" braucht eine sichtbare Logik, nicht nur einen Algorithmus.**
  Karten ohne erklärten Grund (Farbe/Anzahl/Text) wirken willkürlich. Lösung:
  Definition transparent machen (Faden = Thema an ≥2 Tagen im 6-Wochen-Fenster),
  Reihung nach „Stärke" (Tage×2 + Häufigkeit + Aktualität) und die Randfarbe an
  das bestehende Stimmungs-Farbsystem koppeln (Grundton clay→gold→sage→grün) —
  plus Caption + Legende auf der Seite, damit die Farbe lesbar ist.
- **Legende aus einer Quelle (`TONE_LEGEND`)** halten und mit `moodHue`
  synchron — sonst driften Bucket-Grenzen und Legende auseinander.
- **`dangerouslySetInnerHTML` + Nutzertext = escapen.** Sobald eine Nutzer-
  Emotion in eine HTML-Notiz eingebettet wird, vorher `escapeHtml` (sonst
  Self-XSS, auch wenn nur lokale Eigendaten).
- **Bild-Inventar vor „neues Asset nötig?" prüfen:** der gesuchte Bergpfad lag
  bereits als `zitat-weg.webp` im Repo — Read zeigt webp visuell an.

## 2026-06-20 (Abend)

- **Prompt-Gewichtung:** Eine rigide Antwortstruktur + bloß angehängter Kontext
  führt dazu, dass das Modell den Kontext unterschätzt (Antwort wird nur länger).
  Lösung: explizite „AKTUALISIERTE"-Direktive + Kontext prominent/zuletzt labeln
  mit klarem Auftrag, ihn aufzugreifen.
- **Dashboard-Karten aus Daten ableiten,** nicht auf zukünftige Aktionen warten —
  sonst bleiben sie im Alltag leer und wirken kaputt.
- **Generischer Sync zahlt sich aus:** neue Datentypen (openLoops, decisions,
  dailyRituals) = Tabelle + SYNC_TABLES + Server-Enum, fertig.
- **Qualitäts-Gate:** `vite build` macht KEINEN echten Typecheck; immer auch
  `npm -w web run typecheck` (fängt z.B. ungenutzte Imports / noUnusedLocals),
  sonst scheitert erst der pre-commit-Hook.
- **Feature-Wert vor Technik:** „Stabile Schritte" war technisch ok, aber
  unverständlich. Ersetzt durch ein konkretes, einladendes Tagesritual.

## 2026-06-20 (Redesign)

- **Variable Fonts ernst nehmen:** Google-Fonts mit fester Gewichtsliste
  (`wght@400;500;…`) lässt Zwischengewichte (450/650) auf die nächste Stufe
  „snappen". Für ein Designsystem mit feinen Gewichts-Rollen die variable Achse
  laden (`wght@400..800`).
- **Cascade Layers:** Eigene unlayered Klassen (`.serif`, `.lead`) schlagen
  Tailwind-Utilities (in @layer) auch bei gleicher Spezifität — praktisch, um
  Design-System-Rollen sauber durchzusetzen.
- **Prototyp neu ziehen lohnt:** Die .dc.html war zwischenzeitlich von 149 → 172
  KB gewachsen; ohne Re-Pull hätte ich gegen einen alten Stand gebaut.
- **Generischer Sync skaliert weiter:** dailyRituals als weiterer Typ ohne Reibung.
- **Font-Smoothing ist der „dünn"-Verdächtige:** `-webkit-font-smoothing:
  antialiased` lässt variable Schriften auf WebKit/Chrome spürbar zarter
  rendern. Wenn ein HTML-Prototyp es nicht setzt, sieht die App mit antialiased
  dünner aus, obwohl Font + Gewichte stimmen. Browser-Default trifft die Optik.
- **Canvas-Export ohne Libs:** Zitat-Karte als PNG rein über `canvas.toBlob` +
  Web-Share-API (mit Download-Fallback) — kein html-to-image nötig. Textumbruch
  selbst via `measureText`.
- **Energie-Tabelle (v8):** neuer Dexie-Store + Sync-Eintrag + Tombstone-Pfad
  ist Routine geworden; die Registry-Architektur trägt.
- **Zwei Design-Handoffs, nicht einer:** Fürs Dashboard ist
  `design_handoff_bento_dashboard/Bento-Dashboard.dc.html` die verbindliche
  hi-fi Quelle (Markup + Logik-Klasse), NICHT der App-Shell-Frame. Vorher nach
  App-Shell gebaut → falsche Einträge-Optik (gleichmäßiges Grid statt Bento
  7/5/5/7, helle statt dunkle Filter-Pille, schlanke statt voller JournalCard).
  Regel: pro Screen prüfen, ob ein eigener Handoff existiert.
- **Mood-Gold zweierlei:** Bento-Dashboard nutzt 4-Stufen #CD8A5B/#B79A66/
  #9BA383/#A8E84F; APP-STYLE §3 nennt Gold #DDB14B. Für Dashboard/Muster gilt
  Bento (#B79A66). Große Kennzahlen sind ink (#23221A), nicht grün.
