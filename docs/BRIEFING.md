# Innerline — Vollständiges Projekt-Briefing

> Selbst-enthaltendes Briefing zum Weitergeben (z. B. an ChatGPT). Stand: 2026-06-21.
> Sprache: Deutsch. Enthält: Idee & Story, was die App heute kann, Technik,
> bisheriger Verlauf, Strategie & aktuelle Entscheidung, Roadmap, Markt/Recht,
> meine Intentionen — plus am Ende, wie du (als KI) am besten unterstützt.

---

## 1. Worum es geht (in einem Satz)

**Innerline** ist die Marke von Vroni Heidrich. Leitidee: *Inneres in äußere Form
bringen — sichtbar werden, ohne dich zu verbiegen.* Dazu gehören (a) ein
**Personal-Branding-/Brand-Voice-Business** (Website, Workbooks, „Brand Voice
Blueprint", „roter Faden") und (b) eine neue **Tagebuch-/Begleiter-App** mit
einem therapeutisch *informierten* (nicht therapeutischen) KI-Begleiter.

Beide teilen denselben „Motor": **regulieren → in die stabile Mitte → wer bin ich,
was sind meine Werte → eine Form finden, die wirklich passt.**

## 2. Wie es entstanden ist (Story & Intention)

- Vor wenigen Wochen hat Vroni begonnen, ihre Marke **Innerline** neu aufzusetzen
  und ihre vielen Themen erstmals in eine Form zu bringen. Daraus entstand schnell
  das Brand-Voice-Thema (Workbook „Brand Voice Blueprint Standard", v1.0) und eine
  kleine, bereits auf GitHub veröffentlichte Website.
- Aus einer **Trennung** heraus ist vor wenigen Tagen die **App** gewachsen — als
  gesunder Umgang mit einer schweren Phase: kein leistbarer Therapieplatz, also
  baut Vroni sich in der „Vibecoding"-Zeit ein eigenes Werkzeug, das gleichzeitig
  hält, reflektiert und neue Tech-Kenntnisse aufbaut (erste Web-App überhaupt).
- Das ist **kein Zufall, sondern Founder-Market-Fit**: ein Mensch, ein Kernthema
  (Chaos im Kopf → zu sich kommen → eine passende Form finden). Die App ist das
  „innere" Stück, der Brand Voice Blueprint die „äußere Form".
- **Tempo:** In ~3–4 Wochen von null zu Website + Workbooks + dieser (schon recht
  ausgereiften) App. Es geht bewusst schnell, aber mit Acht vor dem Verzetteln.

## 3. Was die App heute kann (Funktionsstand)

**Schreiben & Reflektieren**
- Startscreen „Was brauchst du gerade?" → wählt Modus/Ton (schreiben, Schleife,
  ihm schreiben, Beruhigung, klarer Spiegel, Abend abschließen, Tag sortieren).
- Tagebucheintrag mit Stimmung (1–10), Intensität, Emotionen, Körpergefühl, Themen,
  Bedürfnissen, Impuls, Absicht + optionalem Alltagstracking (Schlaf/Bewegung/
  Draußen/Kiffen).
- KI-Reflexion (Streaming, 8-teilige Struktur, aktivierungs-sensibel: bei hoher
  Anspannung kürzer & regulierender).
- „Lebende Reflexion": Neu-Reflektieren bezieht das Gespräch ein, frühere
  Reflexionen bleiben als Verlauf erhalten. KI-Titel pro Eintrag.
- Gesprächsmodus pro Eintrag; Detailseite mit Tabs (Eintrag · Reflexion · Gespräch).

**Schutz & Regulation**
- Kontaktimpuls-Schutzraum: Nachrichten-Entwurf „in Quarantäne" (20 Min/„morgen"),
  strukturierte Empfehlung, **kein Senden-Button**.
- Grübelschleifen-Erkennung → stabilisierend statt vertiefend.
- Deterministischer Krisen-Schutz: bei Krisenhinweisen feste Sicherheitsantwort +
  echte Hilfen (112, TelefonSeelsorge 0800 111 0 111), kein generativer Call.

**Selbstführung & Auswertung**
- „Klärung": Open Loops (offene Schleifen) + Decision Review (Entscheidungs-Rückblick).
- Tagesritual (6-Minuten-Ansatz) mit Abschluss-Moment.
- Muster (Aggregate + KI-Mustererkennung mit Nutzer-Feedback), Wochenrückblick,
  „Worte der Woche", Dashboard (Stimmungsverlauf, „Was sich zeigt", Serie/Pausentag,
  „Dein Fokus"-Chip).
- Gentle Gamification: „stabile Momente" für Selbstführung — bewusst KEINE harten
  Streaks/Punkte/Scores.

**Komfort & Daten**
- Spracheingabe (Browser-STT zuerst, ElevenLabs als Fallback) + strukturierter
  Sprach-Check-in; Sprachausgabe (Vorlesen per Tipp).
- Geräte-Sync (Supabase-Proxy, Last-Write-Wins, inkl. Lösch-Sync/Tombstones).
- Export (Markdown/JSON) + Import; Onboarding (Fokus + Erinnerungszeit); A11y-Feinschliff.

## 4. Wie die App gebaut ist (Technik)

- **Monorepo** (npm workspaces): `web/` (Vite + React 19 + TypeScript + Tailwind v4,
  Daten lokal in IndexedDB via Dexie), `server/` (Express + TS, dünner Claude-Proxy),
  `shared/` (gemeinsame TS-Typen, eine Quelle der Wahrheit).
- **API-Key nur im Backend** (`server/.env`), nie im Frontend.
- **3-Ebenen-Kontext** an Claude: aktueller Eintrag + Kurz-Digest letzter Einträge
  + gespeicherte Muster (nie der ganze Verlauf → günstig & fokussiert).
- **Modell:** Standard `claude-sonnet-4-6`, Qualitätsmodus `claude-opus-4-8`
  (Thinking + höhere „effort"). Latenz getunt (erstes Byte ~2 s).
- **Begleiter-Persona:** eigener System-Prompt mit 10 Prinzipien + Sprachstil
  „Vroni Voice 5.0" (Anti-KI-Regeln). Krisenlogik deterministisch.
- Deploy auf Vercel; Pre-Commit-Gate (Lint + Typecheck). Design: „Innerline"
  Design-System (warme Tiefe, Tageszeit-Theming).

## 5. Was wir in dieser Session gemacht haben

- Gesamtüberblick (`OVERVIEW.md`) und Markt-/Wettbewerbsanalyse (`MARKTANALYSE.md`)
  erstellt; Vision von „nur Tagebuch" zu „Begleiter für Beziehungsklärung &
  Selbstregulation, Privacy-first, kein Suchtdesign" geschärft.
- Erkannt, dass App + Marke **eine** Sache sind (inner→outer), und das als
  Strategie festgehalten (`STRATEGIE.md`): ein Motor, zwei Schienen.
- Neue Ideen verankert (ROADMAP/OPTIMIZATIONS): Therapeuten-Übergabeprotokoll,
  Voice-Vollduplex, PWA-Lokalität, Ikigai-Kompass, Kintsugi-Ansicht.
- Ein **Strategieprotokoll/Cockpit** (`STRATEGIE-PROTOKOLL.md`) angelegt, um nicht
  zu verzetteln (Nordstern, Prioritäten, „bewusst nicht jetzt", Log).

## 6. Strategie & die aktuelle Entscheidung

**Ein Motor, zwei Schienen:**
- **Schiene A — „zurück zu dir"** (schwere Zeiten): Trennung, Bindung, Grübeln,
  Kontaktimpuls. Nach innen, reparierend. Therapie-näher → mehr Sorgfalt/Recht.
- **Schiene B — „von innen nach außen"** (sichtbar werden): Werte → Identität →
  Ikigai → Brand Voice; mündet in den Brand Voice Blueprint. Business-Funnel.

**Aktuelle Entscheidung (2026-06-21):** Der nächste Schritt ist **Schiene A — für
Vroni selbst (Heilen zuerst).** Schiene B / Business kommt bewusst **später**, wenn
wieder mehr Stabilität da ist. Bitte diese Reihenfolge respektieren.

## 7. Roadmap / was wir noch wollen

- **Zuerst (Schiene A, für dich):** geführter Gedanken-Check (CBT) gegen Grübeln;
  Kintsugi-Ansicht/Selbstmitgefühl; ggf. Therapeuten-Übergabeprotokoll.
- **Später (Schiene B, Business):** Ikigai-/Werte-Kompass als Brücke zur Marke;
  A/B-Verzweigung im Startscreen; Paket-/Preislogik.
- **Allgemein:** Voice-Vollduplex (+ Kostenfrage ElevenLabs), PWA-Distribution,
  Tagesritual-Ausbau, native App, Muster proaktiv spiegeln.

## 8. Markt & Recht (Kurzfassung, „best effort", kein Rechtsrat)

- Markt groß & wachsend (KI-Mental-Health ~2 Mrd. USD, +30 %/Jahr; „Therapy &
  Companionship" 2025 der Top-KI-Use-Case). Aber das *generische* „KI-Journal" ist
  überfüllt (Rosebud, Reflection.app, Mindsera, Day One, Honestly/Ever …).
- **Innerlines Edge:** deutschsprachig + scharfe Nische (Beziehung/Selbstregulation)
  + Privacy-first + bewusst kein Suchtdesign + verlässliches Krisen-Handling. Genau
  dort verliert die Konkurrenz Vertrauen (z. B. Replika-Bußgeld, Character.AI-Klagen).
- **Recht (DACH/EU):** als textbasierter Reflexions-Begleiter mit „kein
  Therapieersatz" vermutlich *limited-risk* (EU AI Act, nur KI-Offenlegungspflicht)
  und außerhalb der Medizinprodukte-Regulierung — solange keine medizinischen
  Aussagen. Vor Verkauf: ausdrückliche Einwilligung für Gesundheitsdaten (DSGVO),
  einmaliger Anwalts-Check, Disclaimer ≠ voller Haftungsschutz.

## 9. Haltung & Leitplanken (wichtig)

- Kein Therapieersatz; keine Diagnosen; keine Manipulation; immer ein kleiner
  nächster Schritt; Abschluss statt Endlosschleife.
- Privacy: Daten lokal (IndexedDB); API nur bei aktiv angeforderter KI-Funktion.
- Kein Nutzungsdruck, keine harten Streaks. Ruhiger, wertschätzender, ehrlicher Ton.
- Anti-Verzettel-Disziplin: eine Sache zur Zeit, an echten Menschen validieren.

## 10. Wie du (ChatGPT) am besten unterstützt

- Respektiere die aktuelle Entscheidung: **erst Schiene A (Heilen), dann Business.**
- Hilf fokussiert, nicht breit — Vroni hat viele Ideen; knapp ist Fokus & Fertig-
  stellen, nicht Ideen. Wenn du Optionen gibst, gib auch eine klare Empfehlung dazu.
- Ton: warm, klar, ehrlich, direkt; keine Floskeln, keine KI-Hype-Sprache
  (im Sinne der „Vroni Voice").
- Behandle persönliche/emotionale Inhalte achtsam; bei echten Krisen kein
  „Wegcoachen", sondern auf reale Hilfe verweisen.
