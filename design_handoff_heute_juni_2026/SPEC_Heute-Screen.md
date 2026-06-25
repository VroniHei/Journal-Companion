# Spezifikation — Heute / Dashboard (Innerline App, Stand Juni 2026)

Verbindliche Vorlage zum 1:1-Nachbau. Werte sind exakt zu übernehmen. Bei Widerspruch gewinnt `Innerline App.dc.html` (Root). Voice-Regeln (Du, „…", keine Em-Dashes, keine Emoji) gelten für alle Texte.

Ziel-Datei: `web/src/pages/Dashboard.tsx` — getrennte Zweige Mobile (Breite-Anker 392px) und Desktop (Breite-Anker 1200px). Assets unter `web/public/img/`: `welcome-still.webp`, `hero-see.webp`, `desk-detail.webp`, `notebook-still.webp`, `zitat-weg.webp`, `journaling-desk.webp`, `faden-weg.webp`.

---

## 0 · Design-Tokens (aus dem Designsystem)

- Flächen: `--chalk #F8F5EE`, `--sand #EFEADD`, Karten-Weiß `#FCFAF6`/`#fff`.
- Text: `--ink #23221A`, `--ink-soft #5D564A`, gedämpft `#9a917f`.
- Akzent: `--green #A8E84F` (nur Akzent/CTA, nie Fläche), groß `--green-deep #6E9B2C`, klein/Text `--green-text #447510`.
- Wärme/Tageszeit: clay `#CD8A5B`, gold `#DDB14B`, sage `#9BA383`, flieder `#CBBEF4`.
- Schrift: Figtree (`--ff`), Akzent-Italic Newsreader (`.g`, Gewicht 450–500). Eyebrows ALL CAPS, `letter-spacing:.18–.24em`, 10–11.5px, Gewicht 600.
- Radien: Karten 20–24px, Hero 26–28px, Buttons/Pillen 100px.
- Schatten: ink-getönt, weich (`0 6px 22px rgba(35,34,26,.05)` Standard, Hover `0 22px 48px rgba(35,34,26,.11)`).
- Motion: `cubic-bezier(.2,.7,.15,1)`; Karten-Hover `translateY(-5px)`, Bild-Zoom `scale(1.05)` über 1.4s.

---

## 1 · MOBILE — Aufbau (Breite 392px)

Reihenfolge von oben nach unten:

1. **Hero (Foto)** — siehe §2.
2. **Aktions-Fläche** (überlappt das Bild) — Fokus-Chip + 2 Buttons.
3. **„Gerade ist viel?"** — fliederfarbener Soforthilfe-Block.
4. **Tagesritual-Karte** — Zustände offen/erledigt, Morgen/Abend.
5. **Stimmung · 7 Tage** — Punkte/Verlauf-Umschalter.
6. **Energie heute** — 5 antippbare Balken.
7. **Was sich zeigt** — Einsicht + Karten-Teilen.
8. **Letzte Einträge** — 3 Karten + Filter-Chips.
9. **Fußzeile** — „Kein Ersatz für Therapie · …".
10. **Tab-Leiste** (fix unten, 82px): Heute · Muster · (+ FAB) · Klärung · Rückblick.

### 2 · Hero Mobile (Variante C) — HEUTE NEU

Container: `position:relative; height:470px;` (bewusst hoch, damit 2-zeilige Begrüßung mit langem Namen + 3-zeilige Frage immer Platz haben).
- **Bild:** `object-fit:cover`. Morgen/Tag: `welcome-still.webp`, `object-position:center 58%`. Abend: dunkleres/ruhiges Bild, Scrim ins Violette (siehe Theme `abend`).
- **Scrim (Morgen):** `linear-gradient(180deg, rgba(58,40,26,.38) 0%, rgba(58,40,26,.08) 20%, rgba(56,38,24,.48) 46%, rgba(50,34,21,.78) 66%, rgba(40,27,16,.95) 100%)`. Abend analog mit violett-warmen Stops.
- **Header-Chrome auf Bild** (`height:60px; padding:0 18px`): Wortmarke `innerline-wordmark-light.svg` (20px) links; rechts Such-Button + Profil-Avatar „V". Such-Button: `36×36`, rund, `background:rgba(255,255,255,.18)`, `backdrop-filter:blur(8px)`, `border:1px solid rgba(255,255,255,.32)`, Icon weiß. Avatar: `36×36`, `linear-gradient(145deg,#A7B187,#8C966F)`, `border:1.5px solid rgba(255,255,255,.45)`.
- **Begrüßungsblock** — `position:absolute; left:20px; right:20px; bottom:96px;` (unten verankert; der 96px-Abstand gleicht die 26px-Rundung der Fläche darunter optisch aus):
  1. **Datums-Zeile mit Tageszeit-Icon** (`display:inline-flex; align-items:center; gap:9px`):
     - Glas-Icon `26×26`, rund, `background:rgba(255,255,255,.12)`, `backdrop-filter:blur(6px)`, `border:1px solid rgba(255,255,255,.32)`, Icon-Farbe `rgba(248,245,238,.92)`, Icon 15px, `stroke-width:1.5`.
     - Morgen/Tag = **Sonne**, Abend = **Mond** (Pfade §6).
     - Eyebrow daneben: `font-size:10px; font-weight:600; letter-spacing:.24em; text-transform:uppercase; color:rgba(244,242,232,.86)`, Text „Donnerstag · 19. Juni" (real: Datum, ohne Tageszeit-Zusatz).
  2. **H1 Begrüßung:** `margin:16px 0 0; font-size:32px; font-weight:550; letter-spacing:-.015em; line-height:1.06; color:#F8F5EE; text-shadow:0 2px 16px rgba(28,20,10,.55)`. Format: `Guten Morgen,<span class="g" style="font-weight:450; margin-left:7px;">Vroni</span>`. **Gewicht 550** (nicht 650), Name in Newsreader-Italic. Bei langem Namen 2-zeilig — Block wächst nach oben, Button-Abstand bleibt konstant.
  3. **Frage (P):** `margin:10px 0 0; font-size:16px; line-height:1.45; color:rgba(248,245,238,.92); text-shadow:0 1px 12px rgba(28,20,10,.6); max-width:262px`. Text je Tageszeit (§3).
- **Aktions-Fläche** direkt unter dem Bild: `margin:-26px 0 0; background:radial-gradient(280px 160px at 100% 0%, rgba(205,138,91,.10), transparent 62%), #FCFAF6; border-radius:26px 26px 0 0; padding:18px 16px 4px`.
  - **Fokus-Chip** (gekoppelt an Ritual): `ritualDone` → heller Chip mit gesetztem Fokus „Dein Fokus: Mich sortieren"; `ritualOpen` → gestrichelter, leiser Chip „Fokus heute noch offen · im Ritual setzen".
  - **2 Buttons** (`display:grid; gap:10px`, volle Breite): Primär „Eintrag schreiben" (grün `linear-gradient(180deg,#B4ED63,#A8E84F)`, `color:#23221A`, Pille, `box-shadow:0 6px 16px rgba(110,155,44,.3)`); Sekundär „Sprach-Check-in" + Mikrofon (`background:#fff; border:1px solid rgba(35,34,26,.12); color:#5d564a`).

---

## 3 · Tageszeit-Logik (Begrüßung + Frage + Icon)

Drei Fenster aus der Uhrzeit. **Texte wörtlich, ohne Em-Dash:**

| Fenster | Zeit (Vorschlag) | Icon | Begrüßung (H1) | Frage (P) |
|---|---|---|---|---|
| Morgen | bis ~11 Uhr | Sonne | `Guten Morgen, Vroni` | `Schön, dass du da bist. Magst du kurz ankommen, bevor der Tag richtig losgeht?` |
| Mittag/Tag | ~11–17 Uhr | Sonne | `Hej, Vroni` | `Mitten im Tag. Was beschäftigt dich gerade, das du kurz festhalten magst?` |
| Abend | ab ~17 Uhr | Mond | `Guten Abend, Vroni` | `Der Tag klingt aus. Was möchtest du behalten, bevor du ihn loslässt?` |
| Erststart (leer) | — | Sonne | `Hej, Vroni` | `Schön, dass du da bist. Fang einfach an, wann immer dir danach ist.` |

- „Vroni" immer Newsreader-Italic, Gewicht 450; Gruß davor Figtree 550.
- Sonne für Morgen + Mittag, Mond für Abend.
- Abend zusätzlich: Bild + Scrim ins Violette (Theme `abend`).

---

## 4 · Zustände (Wiring) — exakt aus dem Master

State-Objekt (Startwerte): `{ menuOpen:true, klaerungTab:'schleifen', eintragTab:'eintrag', moodView:'punkte', refOpen:false, promptIndex:0, abend:false, cardTheme:'tag', energy:3, ritualDone:false }`.

Abgeleitete Werte / Handler:
- **Tageszeit-Theme:** `isMorgen = !abend`, `isAbend = abend`. `setMorgen()` → `abend:false`, `setAbend()` → `abend:true`. Im Prototyp über den Morgen/Abend-Umschalter der Tagesritual-Karte; im Produkt aus der Uhrzeit.
- **Ritual:** `ritualOpen = !ritualDone`, `ritualDone`. `startRitual()` → `ritualDone:true`, `resetRitual()` → `ritualDone:false`. Steuert: Tagesritual-Karte (offen/erledigt) **und** Hero-Fokus-Chip.
- **Ritual-Theme (Karte):** abend → `ritualBg:'linear-gradient(135deg,#EFEAF8 0%,#F1ECEC 56%,#F4F1EA 100%)'`, `ritualBorder:'rgba(203,190,244,.42)'`, `ritualOrb:'rgba(203,190,244,.4)'`; morgen → `ritualBg:'linear-gradient(135deg,#F8EFDF 0%,#F4F0E6 100%)'`, `ritualBorder:'rgba(205,138,91,.26)'`, `ritualOrb:'rgba(224,170,80,.30)'`.
- **Stimmung:** `isPunkte = moodView==='punkte'`, `isVerlauf = …'verlauf'`. `setPunkte()`/`setVerlauf()`.
- **Energie (1–5):** `setE1…setE5` setzen `energy`. Füllfarben `eFill1 #CD8A5B · eFill2 #DDB14B · eFill3 #9BA383 · eFill4 #B6CE72 · eFill5 #A8E84F`, ungefüllt `#EFEADD`. `energyDot = ['#9a917f','#CD8A5B','#DDB14B','#9BA383','#B6CE72','#A8E84F'][energy]`. `energyLabel = ['','sehr wenig','wenig','mittel','gut','voll'][energy]`.
- **Profil-Menü:** `menuOpen`, `toggleMenu()`.
- **Letzte Einträge / Filter:** `eintragTab` ∈ `eintrag|reflexion|gespraech`, `setEintrag/​setReflexion/​setGespraech`. (Klärung-Tabs `klaerungTab` + `refOpen/toggleRef` gehören zur Klärung-Seite, nicht zum Dashboard.)
- **Karten-Teilen-Theme:** `cardTheme` ∈ `tag|abend|natur|klar`, je eigenes `overlay`/`eyebrow`/`accent` (Werte siehe Master-Logik). Flieder-Overlay `abend` ist dasselbe, das der Abend-Hero nutzt.
- **Prompt-Karussell (Was sich zeigt):** `promptIndex`, `cyclePrompt()` rotiert 3 Prompts.

---

## 5 · Karten-Detailspezifikation

### Tagesritual-Karte (Reihenfolge: Eyebrow → Status → Titel → Button)
- **Eyebrow:** Morgen „Tagesritual · 6 Min", Abend „Tagesritual" (kein „· Abend"). Mit Tageszeit-Mini-Icon (Sonne clay / Mond flieder, 16px Kreis).
- **Status (11.5px):** `ritualOpen` → „Heute noch offen · kein Muss" (**kein Punkt davor**); `ritualDone` → „Heute erledigt · gesichert" (`color:#447510`, mit grünem Häkchen-Kreis).
- **Mobile, erledigt:** rundes **Clay-Medaillon** mit weißem Häkchen (statt Foto), Recap-Block (Dankbar / Macht den Tag gut / Ein guter Satz) mit leichten Trennstrichen, „Ein guter Satz" als Newsreader-Italic ~15.5px. Button „Eintrag ansehen".
- **Mobile, offen:** Titel „Den Tag *sortieren*" (Morgen) / „… *ausklingen* lassen" (Abend), kurzer Text, voller Button „Ritual starten".
- **Desktop:** Foto `notebook-still.webp` rechts (`width:432px`), Umschalter Morgen|Abend oben rechts, sonst gleiche Logik.

### Stimmung · 7 Tage
- Eyebrow „Stimmung · 7 Tage" + Umschalter **Punkte | Verlauf** (rechts, `background:#EFEADD; border-radius:100px; padding:4px`, aktive Pille weiß mit Schatten).
- Punkte: 7 Tagespunkte (Fr…Do), Skala schwer→leicht `#CD8A5B · #DDB14B · #9BA383 · #A8E84F · #E6DFCF` (heute = blass).
- Verlauf: SVG-Polyline grün `#6E9B2C` + Flächenverlauf `#A8E84F` transparent, Endpunkt-Kreis.
- Legende „Schwer … Leicht" mit 4 Farbpunkten, oben Trennlinie.

### Energie heute
- Eyebrow „Energie heute" **mit Punkt davor** (`energyDot`-Farbe).
- 5 Balken, gefüllt bis `energy`. Satz „Heute: *{energyLabel}*. Plan ruhig danach."

### „Gerade ist viel?" (Soforthilfe)
- Über alle Screens identisch: flieder Karte `linear-gradient(135deg,#F3EEF8,#fff)`, `border:1px solid rgba(157,139,201,.28)`, `border-radius:18px`. Icon-Kachel flieder 36px (Lucide `brain`/Verzweigung). Eyebrow „Gerade ist viel?" **ohne Punkt davor**. Text „*Kopf leeren* und sortieren." Pfeil-rechts.

### Letzte Einträge
- Eyebrow „Letzte Einträge" + Filter-Chips Alle/Eintrag/Reflexion/Gespräch (aktiv `#EFEADD`). 3 Karten (`border-radius:20px`), je Datums-Punkt + Typ-Badge + Titel + Anriss. „Alle Einträge ansehen" → Archiv.

---

## 6 · Icons (1:1 Lucide, Pflichtattribute)

Jedes `<svg>`: `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`, `width`/`height` explizit. Hero-Glas-Icon `stroke-width:1.5`.

- **Sonne** (`sun`, alle Strahlen):
  `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`
- **Mond** (`moon`): `<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>`
- **Suche** (`search`): `<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`
- **Mikrofon** (`mic`): `<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>`
- **Häkchen** (Erledigt): `<path d="M5 12.5l4.5 4.5L19 7"/>` bzw. `M5 12.5l4 4 10-10`.

---

## 7 · DESKTOP — Aufbau (Breite 1200px)

Container `padding:30px`, zwei driftende Lichtflächen (radiale Verläufe, blur, `drift1 18s`/`drift2 22s`, `pointer-events:none`). Inhalt `z-index:1`.

1. **Header** (sticky, frosted `rgba(253,251,247,.92)`, `blur(14px)`): Wortmarke, Nav (Heute aktiv = grüne Pille mit Punkt), Such-Button, Profil-Avatar „V" mit Dropdown (`menuOpen`).
2. **Hero (Foto, Variante C):** `border-radius:28px; overflow:hidden; min-height:236px; box-shadow:0 22px 48px rgba(35,34,26,.13)`. Bild `hero-see.webp` `object-position:center 100%`, Hover-Zoom 1.4s. Diagonaler Scrim `linear-gradient(100deg, rgba(28,33,22,.9) 0%, rgba(28,33,22,.62) 52%, rgba(28,33,22,.22) 100%)`. Textspalte `padding:40px 46px; max-width:600px`:
   - Datums-Zeile: Glas-Sonne/-Mond `34×34` (`background:rgba(255,255,255,.12)`, `blur(6px)`, `border:1px solid rgba(255,255,255,.32)`, Icon 18px) + Eyebrow `11px/.24em/rgba(244,242,232,.9)`.
   - H1 `font-size:40px; font-weight:550; letter-spacing:-.02em; color:#F8F5EE`, „Guten Morgen,<span .g 450 ml:9px>Vroni</span>".
   - Frage `font-size:21px; line-height:1.4; color:rgba(248,245,238,.92); max-width:468px` (Text je Tageszeit, §3).
   - Buttons (`display:flex; gap:12px`): Primär grün „Eintrag schreiben" + Plus, Sekundär „Sprach-Check-in" + Mikrofon (`background:rgba(248,245,238,.12); border:1.5px solid rgba(248,245,238,.5); color:#F8F5EE`).
   - Fokus-Chip `margin-top:20px`, Zustände wie Mobile.
3. **Tagesritual-Karte** (Foto rechts, Morgen/Abend-Umschalter, Zustände).
4. **Auswertung** — `grid-template-columns:1.3fr 1fr 1fr; gap:18px`: Stimmung (Punkte/Verlauf) · In Folge (Streak) · Diese Woche (5/7).
5. **Energie heute** — 5 Balken.
6. **Was sich zeigt** — 3 Spalten: Einsicht · Fokus-Tags · Karten-Preview + „Als Karte teilen".
7. **Kopf leeren** — flieder Soforthilfe.
8. **Letzte Einträge** — 3 Karten + Filter.

**Desktop Erststart (leer):** heller Hero (kein Foto): Sonnen-Icon in `32px`-Kreis (`background:#F1ECE0; border:1px solid rgba(205,138,91,.28); color:#CD8A5B`) + Datums-Eyebrow; H1 `29px/550` „Hej, *Vroni*"; Frage „Noch nichts notiert, auch gut. Hier ist dein erster Tag." (kein Em-Dash). Darunter einladende Erst-Eintrag-Karte „Noch nichts notiert. *Auch gut.*".

---

## 8 · Akzeptanzkriterien

- Hero (alle Frames, Mobile + Desktop): Glas-Sonne (Morgen/Tag) bzw. Mond (Abend) vor dem Datum; Begrüßung Gewicht **550** mit Italic-Name; Tageszeit-Frage korrekt; 2 Buttons; Fokus-Chip im richtigen Zustand. **Kein** grünes Smiley-Medaillon, kein grüner Eyebrow-Punkt.
- Mobile-Hero `height:470px`, Begrüßung `bottom:96px`: 2-zeilige Begrüßung (langer Name) + 3-zeilige Frage haben Platz, unten kein Anstoßen an die weiße Fläche.
- Tagesritual: Reihenfolge Eyebrow → Status → Titel → voller Button; Status ohne Punkt davor; erledigt = Medaillon + Recap.
- Stimmung Punkte/Verlauf umschaltbar; Energie 5 Balken + Label/Punktfarbe folgen der Stufe; „Energie heute" mit Punkt davor.
- „Gerade ist viel?" über alle Screens identisch (kein Punkt davor); Karten-Radien einheitlich; „Letzte Einträge" + Fußzeile vorhanden.
- Voice-Check bestanden (keine Em-Dashes, keine Emoji, Du-Form, „…").

---

## 9 · Changelog Juni 2026 (was geändert wurde)

1. **Hero komplett neu (Variante C)** in allen Screens: Tageszeit-Glas-Icon (Sonne/Mond) vor dem Datum statt grünem Smiley-Medaillon; Begrüßung „Guten Morgen/Mittag/Abend, *Vroni*" Gewicht 550 mit Newsreader-Italic; warme Tageszeit-Fragen (§3) statt „Was möchtest du heute festhalten?". Grüner Eyebrow-Punkt + grüne Eyebrow-Farbe entfernt.
2. **Hero-Maße Mobile:** Bildhöhe 356 → **470px**, Begrüßung unten verankert `bottom:96px` (gleicht die 26px-Rundung der Fläche darunter aus). Garantiert Platz für 2-zeilige Begrüßung + 3-zeilige Frage.
3. **Tagesritual-Karte** neu sortiert (Eyebrow → Status → Titel → voller Button), „Tagesritual · 6 Min" (Morgen) / „Tagesritual" (Abend, kein „· Abend"), Status „Heute noch offen" / „Heute erledigt · gesichert" ohne Punkt davor; erledigt = Clay-Medaillon mit Häkchen statt Foto; volle Button-Breite.
4. **Recap (erledigt)** luftiger mit Trennstrichen, „Ein guter Satz" als Italic auf lesbare Größe (~15.5px).
5. **Stimmung-Karte:** Punkte/Verlauf-Umschalter ergänzt, sauber rechts gesetzt (kein Überlauf), Icon vor „Stimmung" entfernt.
6. **Energie heute:** Punkt vor dem Eyebrow auf allen Screens vereinheitlicht.
7. **„Gerade ist viel?"** über alle Screens identisch, Punkt davor entfernt; Eyebrow + „Kopf leeren und sortieren.".
8. **Karten-Radien** der Listenkarten auf 20px vereinheitlicht.
9. **„Letzte Einträge"** + Fußzeile „Kein Ersatz für Therapie · …" wieder vollständig im Mobile-Layout.
10. **Serie-/„Pause nehmen"-Block** ruhiger gesetzt, einzeiliger Text „Endet heute Nacht · 1 Pausentag übrig", mehr Abstand nach oben + zum Button.
11. **Abstände/Größen vereinheitlicht** (Recap-Label → Wert 6px, Status-Texte 11.5px, Smiley→Datum-Abstand im Desktop-Hero korrigiert).
12. **Desktop Erststart-Hero** auf Variante C gebracht (Sonnen-Icon, Gewicht 550) + Em-Dash entfernt.
