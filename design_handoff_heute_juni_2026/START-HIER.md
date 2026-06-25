# START HIER — Handoff „Heute" / Dashboard (Stand Juni 2026)

Diese Mappe beschreibt den **kompletten Heute-/Dashboard-Screen** der Innerline App (Mobile + Desktop) mit **allen Zuständen** und der **Verdrahtung**, so wie er nach den Änderungen vom Juni 2026 final ist.

## Reihenfolge zum Arbeiten
1. **`Vorschau.html`** im Browser öffnen. Das ist der echte, lauffähige Stand (alle Frames nebeneinander, frei scroll-/zoombar). So siehst du pixelgenau, wie es aussehen muss. Umschalter (Morgen/Abend, Punkte/Verlauf, Energie 1–5, Profilmenü) sind anklickbar — damit kannst du alle Zustände live durchspielen.
2. **`SPEC_Heute-Screen.md`** lesen — die verbindliche Spezifikation: Aufbau, exakte Werte (Abstände, Größen, Farben), alle Zustände, Verdrahtung, Akzeptanzkriterien.
3. Erst danach in Code umsetzen. Ziel-Datei: `web/src/pages/Dashboard.tsx` (Mobile + Desktop-Zweig).

## Welche Frames in der Vorschau der „Heute"-Screen sind
Die Vorschau zeigt die ganze App (viele Frames nebeneinander). Der **Heute-/Dashboard-Screen**, um den es hier geht, sind diese Frames (oben in der zweiten/​dritten Reihe):
- **Mobile · Standard (Morgen):** „Guten Morgen, Vroni", Ritual offen.
- **Mobile · Ritual erledigt:** „Guten Morgen, Vroni", Tagesritual-Karte mit Geschafft-Medaillon + Recap.
- **Mobile · Abend:** „Guten Abend, Vroni", Mond-Icon, flieder Stimmung.
- **Mobile · Erststart (leer):** „Hej, Vroni", einladender Leerzustand.
- **Desktop · Dashboard (Morgen):** großer Foto-Hero + Auswertungsraster.
- **Desktop · Erststart (leer):** heller Hero, „Hej, Vroni".

Die übrigen Frames (Klärung, Muster, Rückblick, Archiv, Einstellungen, Krisen-Schutz usw.) gehören zu anderen Screens und sind hier nicht Teil des Auftrags.

## Quelle der Wahrheit
- Maßgeblich bleibt **`Innerline App.dc.html`** (Projekt-Root). `Vorschau.html` ist ein eingefrorener, in sich geschlossener Export davon — zum Ansehen, nicht zum Bearbeiten.
- Bei Widerspruch gewinnt immer der Master `Innerline App.dc.html`.

## Verbindliche Regeln (kurz)
- **Brand Voice:** Du-Form, „…"-Anführungszeichen, **keine Em-Dashes** (`—`), keine Emoji, kein Hype. Texte wörtlich übernehmen.
- **Icons:** 1:1 Lucide, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `width`/`height` explizit. Nie selbst zeichnen.
- **Desktop ≠ verkleinertes Mobile:** Desktop nutzt die Breite als Raster.
- **Barrierefreiheit:** WCAG AA, Touch-Targets ≥ 44px.

## Was heute geändert wurde — Kurzüberblick
Details mit exakten Werten in `SPEC_Heute-Screen.md` §„Changelog Juni 2026".
- Neuer **Hero (Variante C)** in allen Screens: Glas-Icon mit **Sonne (Morgen/Tag)** bzw. **Mond (Abend)** vor dem Datum, Begrüßung „Guten Morgen/Abend, *Vroni*" in **Gewicht 550** mit Newsreader-Italic beim Namen, warme Tageszeit-Fragen. Altes grünes Smiley-Medaillon entfernt.
- Hero-Bildfläche höher (**470px** Mobile), Begrüßung unten verankert (**bottom 96px**), damit 2-zeilige Begrüßung (lange Namen) + 3-zeilige Frage immer Platz haben und die Rundung der Fläche darunter ausgeglichen ist.
- **Tagesritual-Karte** neu sortiert (Eyebrow → Status → Titel → voller Button), „Tagesritual · 6 Min", Status ohne Punkt davor, „Geschafft"-Medaillon im erledigten Zustand.
- **Stimmung**-Karte mit **Punkte/Verlauf**-Umschalter, ordentlich rechts gesetzt.
- **Energie heute** mit Punkt vor dem Eyebrow (vereinheitlicht).
- Karten-Radien vereinheitlicht (20px Listenkarten), „Gerade ist viel?" über alle Screens identisch (kein Punkt davor), „Letzte Einträge" + Fußzeile vollständig.
- Recap-Typografie luftiger mit Trennstrichen, „Ein guter Satz" auf lesbare Größe.
- „Pause nehmen"-/Serie-Block ruhiger gesetzt, einzeiliger Text.

## Inhalt dieser Mappe
- `START-HIER.md` — diese Datei
- `SPEC_Heute-Screen.md` — vollständige Spezifikation + Changelog
- `Vorschau.html` — lauffähiger, self-contained Stand (visuelle Referenz, alle Zustände interaktiv)
