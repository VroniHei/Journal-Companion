# Design-Handoff → Claude Design (Innerline-Design-System anwenden)

**Ziel:** Das bestehende **Innerline-Design-System** auf diese App anwenden. Dieses
Dokument liefert den App-Kontext, die technischen Andockpunkte und das
Komponenten-/Screen-Inventar. Die Innerline-Werte (Farben, Typo, Spacing,
Komponenten-Stile) kommen aus dem Innerline-System; hier steht, **wohin** sie
gehören.

---

## 1. Produkt & Tonalität

**Journal Companion** — ein privates, lokales Tagebuch mit einfühlsamer
KI-Reflexion (Claude). Themen: Gedanken, Gefühle, Beziehung/Trennung,
Kontaktimpulse, Grübelschleifen, Selbstführung.

Gewünschte Wirkung: **ruhig, editorial, warm, erwachsen.** Kein grelles
Mental-Health-Look, kein Coaching-Kitsch, **keine harte Gamification** (keine
Scores/Streaks/Badges/Level). Viel Weißraum, klare Typografie, gute Lesbarkeit.
UI-Sprache ist **Deutsch**.

---

## 2. Tech-Stack & wie Styling andockt

- **Vite + React + TypeScript + Tailwind CSS v4.**
- **Single Source of Truth = CSS-Custom-Properties** in
  [web/src/styles/globals.css](../web/src/styles/globals.css). Dort sind 9 Farb-Tokens
  (+ Font) in `:root` definiert und via `@theme inline` als Tailwind-Farben
  gemappt. Es gibt einen **Dark-Mode-Block** (`@media (prefers-color-scheme: dark)`)
  mit denselben Tokens.
- **Wichtig:** Alle Komponenten referenzieren ausschließlich diese Tokens — teils
  als Tailwind-Klassen (`bg-[var(--surface)]`), teils als Inline-Styles
  (`style={{ background: "var(--accent)" }}`, v.a. bei Chips/Skalen/Bubbles).
  → **Werden die Tokens in `globals.css` neu gesetzt, re-themed sich die ganze App
  automatisch** (Light + Dark). Das ist der primäre Hebel.
- Feinschliff danach optional **pro Komponente** (Radius, Schatten, Spacing,
  Button-Fills) — Dateien siehe §5.
- Bereits vorhanden & bitte erhalten: `:focus-visible`-Fokus (Akzentfarbe),
  `prefers-reduced-motion`, `prefers-color-scheme: dark`.

---

## 3. Token-Mapping (Innerline → App)

Bitte die Innerline-Äquivalente auf diese **semantischen Token-Namen** mappen
(Namen bitte beibehalten — der Code referenziert sie). Aktuelle Werte = Ist-Stand
(warme Default-Palette), dienen nur als Rollen-Referenz.

| Token (`--…`) | Rolle | Light (ist) | Dark (ist) |
|---|---|---|---|
| `background` | Seitenhintergrund | `#f4f1ea` | `#1c1a17` |
| `surface` | Karten/Flächen | `#fbf9f4` | `#262320` |
| `surface-2` | zweite Fläche (Session-Close, Bubbles, „Quarantäne") | `#f0ece1` | `#211e1b` |
| `foreground` | Text | `#2c2a26` | `#ece7dd` |
| `muted` | gedämpfter Text/Meta | `#6f6a60` | `#a39c8f` |
| `accent` | Akzent (Buttons, aktive Zustände, Links) | `#b5673f` | `#d98b5f` |
| `accent-soft` | weicher Akzent (Chips aktiv, Hover) | `#e8d9cd` | `#3a302a` |
| `border` | Rahmen/Trennlinien | `#e4ddd0` | `#38332d` |
| `danger` | Krise/Gefahr/Löschen (rot) | `#9c3b2e` | `#e0816f` |
| `--font-serif` | Display/Überschriften (Wortmarke, H1) | `Georgia, …` | — |
| Body-Font | Fließtext (`body { font-family }`) | system-sans | — |

> Wenn Innerline weitere Tokens kennt (Schatten, Radius-Skala, Spacing, mehrere
> Akzente), gerne ergänzen — aber diese 9 + 2 Fonts decken die App vollständig ab.

Mapping-Empfehlung: Innerline-Werte direkt in `:root` **und** in den
`@media (prefers-color-scheme: dark)`-Block setzen. Wenn Innerline kein Dark-Theme
hat, Dark-Block beibehalten und auf dunkle Innerline-Neutraltöne ableiten.

---

## 4. Typografie

- **Display/Überschriften:** Klasse `.serif` (aktuell Georgia) → Innerline-Display-Font.
  Genutzt an: Wortmarke im Header, alle Seiten-`<h1>`.
- **Body:** `body { font-family }` in `globals.css` → Innerline-Body-Font.
- Optional: Größen-/Zeilenhöhen-Skala (aktuell Tailwind-Defaults `text-sm/-2xl/-3xl`).

---

## 5. Komponenten-Inventar (Dateien + Zustände)

Basis-Bausteine (hier zuerst stylen, Rest erbt):

| Komponente | Datei | Zustände / Hinweise |
|---|---|---|
| **Card** | `web/src/components/ui.tsx` | Standard-Fläche (surface, border, rounded-2xl, p-5) |
| **Button** | `web/src/components/ui.tsx` | Varianten **primary** (accent-Fill, weiß), **ghost** (border), **danger** (rot, Text); `:disabled` (Opacity) |
| **FieldLabel** | `web/src/components/ui.tsx` | Label + optionaler Hint (muted) |
| **ScaleField** | `web/src/components/fields/ScaleField.tsx` | 1–10 runde Buttons; **aktiv** = accent-Fill; Inline-Styles |
| **ChipSelect** | `web/src/components/fields/ChipSelect.tsx` | Chips (Emotionen/Themen/…); **aktiv** = accent-soft + accent-Border; Inline-Styles |
| **BoolField** | `web/src/components/fields/BoolField.tsx` | Ja/Nein-Chips (Tracking) |
| **ReflectionView** | `web/src/components/ReflectionView.tsx` | Reflexions-Karte, **linker Akzent-Rahmen**; **Krisen-Variante = danger** (prominent, aber ruhig) |
| **ChatThread** | `web/src/components/ChatThread.tsx` | Chat-Bubbles (user = accent-soft rechts, assistant = surface-2 links); Eingabe + Senden + Mikro |
| **SessionClose** | `web/src/components/SessionClose.tsx` | Abschluss-Karte (surface-2), ruhige Microcopy |
| **DisclaimerGate** | `web/src/components/DisclaimerGate.tsx` | Einmaliges Modal über dunklem Overlay |
| **DictationButton** | `web/src/components/DictationButton.tsx` | Mikro; **idle** vs **„hört zu"** (danger-Akzent) |
| **Layout/Nav** | `web/src/components/Layout.tsx` | Header-**Wortmarke** (`.serif`, = App-Name, hier Innerline-Branding/Logo möglich), Navi (aktiv = accent), Footer-Disclaimer |

> Viele dieser Komponenten setzen Farben als **Inline-`style`** mit `var(--token)`.
> Token-Wechsel reicht fürs Re-Theming; für andere Radien/Schatten/Spacing bitte
> in der jeweiligen Datei anpassen.

---

## 6. Screens / Flows (Routen)

| Screen | Datei | Kerninhalt |
|---|---|---|
| **Dashboard / Startscreen** | `web/src/pages/Dashboard.tsx` | „Was brauchst du gerade?"-Auswahlraster (7 Optionen als Karten-Buttons), Begrüßung, letzte Einträge, Stimmungsverlauf, häufige Themen, Themen-Hinweis |
| **Neuer Eintrag** | `web/src/pages/NewEntry.tsx` | Freitext + Diktat, Stimmung/Intensität (ScaleField), Chips (Emotionen/Körper/Themen/Bedürfnisse/Impuls/Absicht), Alltagstracking |
| **Eintragsdetail** | `web/src/pages/EntryDetail.tsx` | Eintrag + Meta, **Reflexion (Streaming)**, Microcopy, **SessionClose**, **ChatThread**, Aktionen (reflektieren / Markdown / löschen) |
| **Kontaktimpuls** | `web/src/pages/ContactImpulse.tsx` | Check-in, **Empfehlungs-Badge** (nicht-senden=danger / später / würdevoll), **Schutzraum** (Quarantäne-Karten, Wartezeit) |
| **Muster** | `web/src/pages/Patterns.tsx` | Statistik-Stats, Chips, hohe-Intensität-Liste, „stabile Momente" |
| **Wochenrückblick** | `web/src/pages/WeeklyReview.tsx` | Zeitraum-Chips, generierter Text, gespeicherte Rückblicke |
| **Sprach-Check-in** | `web/src/pages/VoiceCheckin.tsx` | Diktat-Textfeld, strukturierte Auswertung; **„Was jetzt eher nicht hilfreich wäre"**-Box (accent) |
| **Einstellungen** | `web/src/pages/Settings.tsx` | Selects/Toggles, Daten-Export/-Löschen, Hinweis |

---

## 7. Zustände & Varianten (bitte mitdenken)

- **Streaming** (Reflexion/Chat): Text erscheint schrittweise; „… denkt nach"-Button.
- **Krise** (Sicherheits-Schutz): danger-getönte Karte mit Hilfetext (112 / Telefon­seelsorge). **Prominent, aber ruhig — nicht alarmistisch.** Darf optisch klar herausstechen.
- **Grübelmodus:** kürzere, stabilisierende Reflexion (gleicher Stil, weniger Inhalt).
- **Leerzustände:** Dashboard/Muster/Listen ohne Daten (ruhige, einladende Hinweise).
- **Fehler:** Karte mit linkem danger-Rahmen.
- **Disabled/Loading:** Buttons mit reduzierter Deckkraft.

---

## 8. Constraints / Prinzipien

- **Deutsch**, ruhiger wertschätzender Ton.
- **Dark Mode** via `prefers-color-scheme` — Innerline-Dark-Werte bitte mitliefern
  (oder Dark-Block beibehalten).
- **Barrierefreiheit:** Kontrast ≥ AA, sichtbarer `:focus-visible`-Fokus erhalten,
  Touch-/Klickflächen großzügig.
- **`prefers-reduced-motion`** respektieren (Block existiert bereits).
- **Keine harte Gamification** (keine Scores/Streaks/Badges/Level). „Gentle"
  Bestärkungen (Microcopy, „stabile Momente") sind erwünscht, ruhig & ohne Druck.

---

## 9. Empfohlenes Vorgehen & Deliverable

1. **Primär:** Innerline-Werte für die 9 Tokens (Light + Dark) + die 2 Fonts in
   [web/src/styles/globals.css](../web/src/styles/globals.css) setzen → App ist re-themed.
2. **Sekundär (optional):** pro Komponente Radius/Schatten/Spacing/Button-Fills
   gemäß Innerline verfeinern (Dateien in §5).
3. **Erhalten:** semantische Token-Namen, Krisen-Affordance, Dark Mode, Fokus,
   deutsche Texte, „keine harte Gamification".

**Format zurück:** entweder direkte Edits (globals.css-Tokens + Komponenten-Klassen)
oder ein Spec, das Innerline → diese Tokens/Komponenten mappt. Beides lässt sich
1:1 einbauen.

> Build/Check nach Änderungen: `npm run build` · `npm run lint` · `npm run typecheck`.
