# Design-Handoff — Innerline Journal Companion (Stand zum Weiterstylen)

> Ziel: einzelne Elemente in **Claude Design** verfeinern, ohne das Fundament
> (Innerline Design System) zu verlassen. Frühere Version dieses Docs war der
> Erst-Import des Design Systems — jetzt: Feinschliff des Ist-Zustands.

## Produkt in einem Satz
Ruhige, private Tagebuch-App mit einfühlsamem KI-Begleiter (Claude) + natürlicher
Stimme (ElevenLabs). Hell-only, warm, editorial. Ton: ruhig, wertschätzend,
nicht klinisch.

## Stack (für realitätsnahe Vorschläge)
- React 19 + TypeScript + Vite, **Tailwind v4** (Utilities + CSS-Tokens)
- Design-Tokens als CSS-Custom-Properties in `web/src/styles/globals.css`
- Live (passwortgeschützt): https://journal-companion-web.vercel.app/

## Design-Tokens (Ist-Zustand, hell-only)
```
--background #f8f5ee (Creme)      --surface #ffffff (Karten)
--surface-2 #efeadd (Sand/Chips)  --foreground #23221a (Ink)
--muted #5d564a                   --border rgba(35,34,26,.12)
--accent #a8e84f (Lime)           --accent-text #447510 (lesbares Grün)
--accent-soft #edf7d9             --clay #cd8a5b (warmer Akzent / „Rot")
--danger #9c3b2e
Fonts: Figtree (UI/Body, .serif = 650 eng), Newsreader-Italic (Akzent .g)
Effekte: Glas (.glass backdrop-blur), Lift-Hover, weiche Schatten,
fröhliche Blur-Blobs im Hintergrund; Favicon/Logo-Faden in Clay.
```

## Screens (Ist-Zustand)
- **Dashboard:** Hero-Foto (See) mit Gruß „Guten Morgen, {Name}"; Schnellzugriff-
  Buttons; „Heute im Blick"; Auswertung (Streak/Wochenwerte, Stimmungs-Sparkline,
  „Was sich zeigt"); „Stabile Schritte"; **Journal Cards im Bento-Raster**.
- **Neuer Eintrag:** Freitext + Diktat; Stimmung/Intensität-Skalen; gruppierte
  Chip-Auswahl (Gefühl · Worum es geht · Impuls & Absicht) + „Alltag" aufklappbar.
- **Eintrag-Detail:** Eintrag, Reflexion (FormattedText, Vorlesen), Chat.
- **Muster:** Kennzahlen + qualitative **Musterkarten** (KI) mit Feedback/Notizen.
- **Kontaktimpuls / Sprach-Check-in / Wochenrückblick / Einstellungen.**

## Komponenten-Inventar (Kandidaten zum Verfeinern)
- `Card`, `Button` (Pills), `Eyebrow` (Label + grüner Punkt)
- `JournalCard` (Bento-Tile: Modus-Punkt, Status-Badge, Stimmungs-Pille)
- `FormattedText` (Markdown-Subset: Überschriften, Listen, `---`-Hairline)
- `Sparkline` (SVG-Stimmungsverlauf), `ReflectionView`, `ChatThread`
- Felder: `ChipSelect` (Häkchen + Zähler), `ScaleField`, `BoolField`

## Polish-Ziele (Priorität für Claude Design)
1. **Bento-Dashboard** ganzheitlich: gemischte Kachelgrößen (Sparkline breit,
   Stats klein), klare Hierarchie, mehr Weißraum.
2. **Journal Cards**: Feinschliff Typo/Spacing, Modus-/Status-Visualisierung,
   dezente Mood-Farbskala.
3. **Reflexions-/Chat-Typografie**: editoriale Abschnitte, Lesefluss, Zitate.
4. **Chips & Skalen**: modernere, ruhigere Auswahl-Elemente.
5. **Empty States** & Mikro-Illustrationen (Bildwelt vorhanden).
6. **Konsistente Elevation/Radii** über alle Karten.

## Leitplanken
- Hell-only, ruhig, nicht-klinisch. Akzent sparsam (Lime + Clay).
- Tokens nutzen, nicht hartkodieren. Kontrast ≥ 4.5:1.
- „Kein Therapieersatz" — Ton einladend, nie alarmierend (außer Krise).
