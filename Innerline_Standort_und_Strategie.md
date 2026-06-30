# Innerline — Standort & Strategie

**Markt · Wettbewerb · Markenkohärenz · Technische Standortbestimmung**
Internes Strategie- und Entscheidungsdokument für die Phasen **Privat → Test → Produkt**

---

**Projekt:** Vroni / Innerline — Journal Companion
**Version:** 1.1 (technischer Stand integriert)
**Status:** lebendes Arbeitsdokument
**Stand:** 30. Juni 2026
**Grundlage:** Markt- und Wettbewerbsrecherche (Juni 2026) + Brand Foundation 2.1, Brand Voice Blueprint 5.0, Visuelles Markenfundament + **INNERLINE_STATE_EXPORT** (technischer Code-Stand, 30. Juni 2026)

> **Was sich in 1.1 geändert hat:** Teil 4 ist jetzt mit der technischen Standortbestimmung gefüllt (Feature-Gap, Memory, Voice, Safety, Mehrnutzer-Readiness). Neu: Teil 5 — Feature-Konzept „Brücke zur Versorgung" (Therapeuten-Zusammenfassung) inklusive fertiger Wording-Bausteine. Korrigiert: Die Privacy-Aussage wird ehrlich eingeordnet — local-first ist real, aber der optionale Cloud-Sync liegt heute als Klartext ohne Nutzer-Trennung vor; das Privacy-Versprechen ist erst mit E2E-Verschlüsselung + Auth tragbar.

> Hinweis zur Rahmung: internes Gründerinnen-Dokument — Landkarte für deine eigenen Entscheidungen. Ein nach außen gerichtetes Tester-/Pitch-Dokument lässt sich daraus später ableiten, sobald die App mehrnutzer-fähig ist.

---

## Worum es geht — in drei Sätzen

Innerline ist eine ruhige, local-first Tagebuch-App mit einem therapeutisch informierten KI-Begleiter, der spiegelt statt rät. Kern-Themen: Beziehungsklärung, Trennung, Bindungsmuster, Selbstwert, Grübelschleifen, Selbstregulation. Leitidee: **erst sich verstehen → Nervensystem beruhigen → wissen, wo man steht.**

### Der Keystone: warum diese App existiert

Die App spricht private emotionale Momente *und* Business-Gedankenschleifen gleichzeitig an, weil beide aus derselben Quelle kommen. Wer als Overthinker:in in Schleifen hängt, wird genau dadurch davon abgehalten, das, was er oder sie baut, öffentlich zu kommunizieren.

> **Die Gedankenschleife ist die Bremse zwischen „innen ist viel da" und „außen wird es sichtbar".**
> Eine App, die Schleifen durchbricht, ist deshalb keine Achtsamkeits-App *neben* dem Business — sie ist die *Vorstufe* zum Sichtbarwerden.

---

# Teil 1 — Marktlandschaft & Wettbewerb

## 1.1 Marktgröße & Dynamik

Der Mental-Health-App-Markt wird 2026 je nach Quelle zwischen rund **9,6 und 16,7 Mrd. USD** verortet (CAGR ~16–18 % bis Mitte der 2030er; Global Market Insights, Precedence Research, Global Growth Insights). Für Europa werden für 2026 grob 4–4,5 Mrd. USD ausgewiesen.

Das relevante Teilsegment: KI-gestützte Mental-Health-Lösungen, 2026 auf etwa **2,4 Mrd. USD** geschätzt, mit rund **33 % CAGR** — doppelt so schnell wie der Gesamtmarkt (Mordor Intelligence).

Drei Datenpunkte stützen die Produktthese:

- Mehr als **10.000 Mental-Health-Apps** integrieren inzwischen KI (vor fünf Jahren unter 1.000); rund **24 % der US-Erwachsenen** nutzen bereits Sprachmodelle für emotionale Unterstützung (Mordor Intelligence).
- Die intensivsten Chatbot-Gespräche finden **nachts zwischen 2 und 5 Uhr** statt (deutsche Branchenanalyse) — der „Grübelnächte"-Moment, den Innerline adressiert.
- Gesprochene Sprache ist **weniger gefiltert als geschriebene** und führt zu tieferer Reflexion (medRxiv 2025) — die Begründung für den Voice-Ansatz.

## 1.2 Die Wettbewerbslandschaft in fünf Clustern

Innerline sitzt im Schnittpunkt von Cluster A und B.

**A) Direkte Zwillinge — KI-Reflexion / Thought-Loops**

- **Loop Mind: Stop Overthinking** — engster Konkurrent. Drauflos reden/tippen, App erkennt einen von sechs kognitiven Loops und trennt, was man *weiß*, von dem, was man *annimmt*. Bewusst „strukturierter Spiegel" — kein Rat, keine Impulse. Die Messlatte für Innerlines Differenzierung.
- **Rosebud** — Kategorieführer KI-Journaling. 6 Mio. USD Seed, 80.000+ Nutzer:innen, Voice in 20 Sprachen, CBT/ACT/IFS, Long-Term-Memory, Call-Modus. Offene Flanke: **verlorene Voice-Aufnahmen** als häufigste Kritik.
- **Mindsera** — „KI-Denkpartner", mentale Modelle, kognitive Verzerrungen. Kopflastig.
- **Reflection.app** — KI-Coach, Echtzeit-Insights, großzügiger Free-Plan.

**B) KI-Voice-Companions / „AI Therapist"**

- **Headspace Ebb** — größte strategische Bedrohung. Seit Dezember 2025 Voice-Modus, Memory, Motivational Interviewing. Aber: nur USA/UK/CA/AU, ab 18, nur Englisch, im Kern Content-Empfehlung statt offener Reflexion.
- **Sonia** — „AI Voice Therapy", CBT, Voice-Sessions, starkes Erinnerungsvermögen. Nur Englisch.
- **Elomia, Freudly, Youper, Earkick, Wysa, Woebot** — breite CBT-Chatbot-Schicht. Wysa/Woebot klinisch validiert. Fast alle englisch-zentriert. (Elomia hat ein „Export an Therapeut:in"-Feature — siehe Teil 5.)

**C) Overthinking-/Reframing-Spezialisten** — Reframe, Luma, Life Note. Zeigen, dass „Overthinking" als Positionierung funktioniert; meist text-basiert.

**D) Meditations-Platzhirsche** — Calm (~18 %), Headspace (~16 %). „KI" überwiegend Empfehlungsalgorithmen, nicht generativ.

**E) DACH / regulierter Raum** — DiGA-Apps (HelloBetter mit 30+ RCTs, Selfapy, MindDoc, somnio): auf Rezept, krankenkassenerstattet, klinisch validiert. Anderes Spielfeld, aber Trust-Benchmark. **Feelway**: deutschsprachiger KI-Konkurrent zum Beobachten.

## 1.3 Vergleichstabelle — direkte Konkurrenten

| App | Kernmechanik | Voice | Deutsch | Memory | Plattform | Preis (ca.) |
|---|---|---|---|---|---|---|
| **Innerline** | spiegeln, sortieren, regulieren | turn-basiert | nativ | flach (Recency-5)¹ | Web, lokal | offen |
| Rosebud | KI-Journaling, Insights | 20 Sprachen | teilweise | stark (Long-Term) | iOS/Android/Web | ~13 $/Mo |
| Loop Mind | Loop-Typ, Fakten/Annahmen | ja | nein | über Wochen | iOS | Abo |
| Headspace Ebb | Companion + Empfehlung | ja (12/25) | nein | enhanced | iOS/Android | ~70 $/Jahr |
| Sonia | CBT-Voice-Sessions | ja | nein | stark | iOS | Abo |
| Stoic | AI-Mentoren, 4 Mio. Nutzer | nein | nein | ja | iOS/Android/Web | Freemium |
| Day One / Daylio | Multimedia / Mood-Tapping | nein | teilw. | nein | breit / mobil | ~25 $/Jahr |

¹ Memory-Detail siehe Teil 4.2 — die longitudinale Dashboard-Schicht (Muster, Wochenbrief) ist solide, aber der *In-Conversation-Recall* ist recency-begrenzt.

**Die Zeile, die Innerline verkauft, ist die Kombination** — deutsch-nativ + lokal + KI-Reflexion + Regulation + scharfe Nische. Niemand sonst hat das in einer Zeile.

## 1.4 Markttrends

1. **Voice wird Standard, nicht Differenzierung.** Qualität entscheidet (Latenz, Zuverlässigkeit, Fluss).
2. **Generativ schlägt Bibliothek.** Vorsprung gegenüber Calm/Headspace.
3. **Memory ist der Burggraben.** Stärkster Retention-Treiber.
4. **Datenschutz wird Kaufkriterium.** 28 von 32 Apps mit „Privacy Not Included"-Warnung (Mozilla).
5. **Das „Therapeut"-Label wird regulatorisch riskant.** APA-Aufruf an FTC nach Character.AI-Klagen.

---

# Teil 2 — Standortbestimmung der App (Markt)

## 2.1 Der Burggraben — wo Innerline differenziert ist

**Local-first + DACH-nativ.** Die Landschaft teilt sich sauber: Day One/Daylio lokal, aber ohne KI; Rosebud/Stoic/Mindsera/Ebb KI-stark, aber Cloud/US/Englisch. Innerline ist die seltene Schnittmenge: lokale KI-Reflexion auf Deutsch mit DACH-Notfallnummern. **Wichtige Präzisierung** (siehe Teil 4.5): „local-first" stimmt für den Einzelnutzer; sobald Cloud-Sync und Fremdnutzer dazukommen, ist die Privacy-Aussage erst tragbar, wenn E2E-Verschlüsselung und Nutzer-Trennung stehen.

**„Spiegelt statt rät" + Anti-Sycophancy by design.** Die Vroni-Voice-Regeln (Fakten von Story trennen, Muster vorsichtig benennen ohne Diagnose, nicht manipulieren, kein endloser Deep Dive) adressieren das systemische Hauptrisiko der Kategorie. Im Code verifiziert (Teil 4.1) — das ist der stärkste, am schwersten kopierbare Vorteil.

**Eine scharfe emotionale Nische.** Trennung, Bindungsmuster, Grübelnächte, **Kontaktimpuls-Regulation**. „Soll ich meinem Ex schreiben?" um 2 Uhr nachts ist ein viszeral nachvollziehbarer, unbesetzter Moment.

**Integration zweier Schichten.** Reflexion (Rosebud-Terrain) + Nervensystem/Regulation (Calm/Headspace-Terrain) in einem Produkt.

**Nicht umgehbare Safety-Architektur.** Krisen-Gate vor dem KI-Call — disziplinierter als bei vielen finanzierten Apps (Detail Teil 4.4).

## 2.2 Ehrliche Lücken (Markt-Sicht)

- **Mehrnutzer-Fähigkeit & Distribution** — Cross-Device läuft, aber „andere können es installieren/nutzen" fehlt (Detail Teil 4.5).
- **Voice-Tiefe** — turn-basiert, kein durchgehender Dialog (Teil 4.3).
- **Cross-Session-Memory** — die „Wow"-Erinnerung im Gespräch fehlt (Teil 4.2).
- **Trust-Signale / Validierung** — keine klinische Evidenz (vs. DiGA, Rosebud-„therapeut:innen-empfohlen").
- **Polish & Content-Volumen** — gegen Stoic/Calm/Headspace nicht aufzuholen; muss auch nicht.

## 2.3 Offene Marktlücken — was Innerline besetzen kann

- **„Deutsches, privacy-first Rosebud, spezialisiert auf Trennung/Grübeln."** Im DACH-Raum praktisch leer.
- **Kontaktimpuls-Regulation als eigene Kategorie.** Niemand besitzt diesen Moment.
- **Der „ehrliche Spiegel, der sanft anstößt."** Zwischen Loop Mind (reiner Spiegel) und den sykophantischen Companions.

## 2.4 Positionierungs-Landkarte

| | KI-Reflexion | Voice-Dialog | Deutsch | Lokal/EU-Daten | Regulation | Nische |
|---|---|---|---|---|---|---|
| **Innerline** | ja (spiegelnd) | turn-basiert | nativ | lokal ja / Cloud offen* | ja | Trennung/Grübeln |
| Rosebud | stark | ja | übersetzt | nein (Cloud/US) | teilweise | generisch |
| Loop Mind | nur Spiegel | ja | nein | nein | nein | Overthinking |
| Headspace Ebb | + Bibliothek | ja | nein | nein | ja | generisch |
| Stoic | AI-Mentoren | nein | nein | nein | ja | Stoizismus |

\* lokal stark; Cloud-Sync heute ohne E2E/Nutzer-Trennung (siehe Teil 4.5).

## 2.5 Pricing

Zwei Bänder: **Journaling-Band** billig (Day One ~25–35 $/Jahr); **KI-Companion-Band** höher (Rosebud ~13 $/Mo; Headspace ~70 $/Jahr; Sonia/Elomia bis ~29 $/Mo).

**Empfehlung:** ins **KI-Companion-Band** (€8–13/Monat oder ~€70–90/Jahr). Wert ist KI + Regulation, nicht Speicher. Modell wie Rosebud: großzügiger Free-Tier, Premium = Memory, Voice, Wochenbrief, Muster-Insights. **Achtung Kostenökonomie** (Teil 4.6): Opus + ElevenLabs pro Nutzer, Zielnutzer ist der Vielschreiber — vor der Produktphase durchrechnen. DiGA-Pfad als separate Zukunftsspur.

*Produkt-Phasen-Entscheidung — hier dokumentiert, jetzt noch nicht zu entscheiden.*

---

# Teil 3 — Brand-App-Kohärenz

## 3.1 Eine Wirbelsäule

- **Marke Vroni:** „Erst verstehen. Dann sortieren. Dann sichtbar machen."
- **App Innerline:** „erst sich verstehen → Nervensystem beruhigen → wissen, wo man steht."

Dasselbe Rückgrat. Die App macht den Verstehen-/Sortieren-/Regulieren-Teil innen; das Brand-Business den Sichtbar-machen-Teil außen.

## 3.2 Der Begleiter ist die Brand Voice, interaktiv

Der System-Prompt „Vroni Voice 5.0" ist nicht zufällig benannt — er trägt die dokumentierte Voice DNA (kluge Freundin, ehrlich, sortierend, warm aber nicht weich, nicht coachig, nicht KI-typisch, nicht esoterisch). Im Code verifiziert (Teil 4.1): Der Prompt setzt die Anti-KI-Sprachregeln und den Human-Check sauber um. Das ist ein Vorteil, den Rosebud/Loop Mind/Ebb nicht haben — eine dokumentierte, differenzierte Stimme mit Weltanschauung dahinter.

## 3.3 Holistic Performance ist verbaut

Der Differenzierungs-Layer der Marke (Nervensystem, Regulation, nachhaltige Leistungsfähigkeit) ist als Funktion umgesetzt: Nervensystem beruhigen, Selbstregulation, Energie-Tracking.

## 3.4 Der Keystone: Overthinking *ist* die Brücke

Die Brand-Zielgruppe ist über einen inneren Zustand definiert („innen viel da, außen kommt es nicht klar an") — derselbe Mensch, der nachts in Schleifen hängt. Die Schleife hält ihn vom Sichtbarwerden ab. Die App, die die Schleife durchbricht, bedient damit zugleich das private Klärungs-Bedürfnis und das Business-Sichtbarkeits-Ziel. Eine Funktion, zwei Personas, ein Mechanismus.

## 3.5 Die Produkt-Leiter

```
   INNEN                                          AUSSEN
   ┌─────────────────────────┐    ┌──────────────────────────────┐
   │  Innerline (App)        │ →  │  Personal Branding Blueprint  │
   │  verstehen · sortieren  │    │  Brand Voice · Website        │
   │  · regulieren           │    │  → sichtbar machen            │
   └─────────────────────────┘    └──────────────────────────────┘
   Top-of-Funnel: „Verstehen"     Vertiefung: „Sichtbar machen"
```

Die App ist die „Verstehen"-Stufe des gesamten Vroni-Ökosystems.

## 3.6 Die „Innerline"-Namensfrage

Im Fundament ist „Innerline" bewusst offen („darf mitwachsen"). Die App ist der konkreteste Kandidat, aus dem Platzhalter eine echte Produkt-/Methodenwelt zu machen (Phase 5). Solange privat gebaut wird, ist die Namensfrage irrelevant; in der Testphase kann die App unter dem Anker **Vroni** laufen.

## 3.7 Der Vertriebs-Unlock

Vronis bestehende Zielgruppe ist die perfekt passende erste Testgruppe — ein warmer, vorqualifizierter Kanal, den eine generische App nicht hat.

---

# Teil 4 — Technische Standortbestimmung (aus dem Code-Export)

*Nüchterne Bewertung auf Basis von INNERLINE_STATE_EXPORT (30.06.2026).*

## 4.1 Gesamtbild — ehrlich

Ein ungewöhnlich werte-kohärentes, durchdachtes v1. Über dem typischen Indie-Niveau bei Produktphilosophie, Prompt-Design und Safety. Aber heute ein **Single-User-Werkzeug**, kein verkaufbares Produkt. Die Lücke sitzt in vier konkreten, lösbaren Bereichen: flaches Memory, nicht-konversationelles Voice + Transkript-Verlustrisiko, eine Privacy-Story die der Cloud-Realität hinterherhinkt, fehlende Mehrnutzer-/Auth-Schicht.

**Die teure Hälfte ist schon da.** Was sich nicht einfach nachbauen lässt — Haltung, Stimme, Nische, Loop-Breaking-Konzept — existiert. Die Lücken sind fast alle *Infrastruktur* (lösbares Engineering). Die meisten Apps haben die Infrastruktur und keine Seele; hier ist es umgekehrt.

**Verifizierte Stärken:**

- **Der Vroni-Voice-5.0-Prompt** ist das Beste an der App: 10 kohärente Prinzipien, echte Anti-Sycophancy, differenzierte Anti-KI-Sprachregeln (keine Gedankenstriche, keine Dreierketten, kein „nicht X sondern Y" als Masche), Human-Check vor dem Antworten. Auf der Haltungs-Achse den großen Playern voraus.
- **Grübel-Erkennung** mit zwei Signalen (Client: gleiches Thema/Tag ≥2; Server: Phrasen + Intensität + Fragezeichendichte), die die Reflexion von „analysieren" auf „stabilisieren" umschaltet. Spezifisch und differenziert.
- **Datenmodell mit Produktdenken:** `patternInsights` mit Nutzer-Bestätigung (`userConfirmed`/`userFeedback`) — bestätigte Selbstbeobachtung statt KI-Spekulation. `stabilityMoments` ohne Punkte/Streaks (keine Dark Patterns).
- **Stack sauber:** Vite 6 / React 19 / TS strict, API-Key nur serverseitig, Streaming.

## 4.2 Memory — die größte Produktlücke

Kontextauswahl ist **rein recency-basiert (letzte 5 Einträge), keine Embeddings, keine semantische Suche**. **Im Chat wird gar kein Verlaufs-Digest und kein Muster mitgegeben** — das Gespräch endet beim aktuellen Eintrag + Thread. `conversationSummary` ist verdrahtet, wird aber nie erzeugt (totes Feld). Folge: Der „es hat sich an etwas von vor Wochen erinnert"-Moment (Retention-Treiber bei Rosebud/Sonia) **passiert praktisch nicht**. Für eine App mit der These „wiederkehrende Muster / roter Faden" ist das die wundeste Stelle.

**Empfehlung:** kurzfristig das Muster-Summary auch in den Chat geben; mittelfristig semantische statt recency-Auswahl (Embeddings über frühere Einträge). Höchster Hebel im ganzen Produkt.

## 4.3 Voice — widerspricht der Gründungsvision

Real: aufnehmen → stopp → transkribieren → editieren → auswerten → speichern. Kein durchgehender Dialog, kein VAD/Barge-in, STT nicht streamend (ElevenLabs Scribe). Das ist saubere Diktat-zu-Eintrag-Funktion, nicht das „reden wie mit einem Gegenüber", das Ebb/Rosebud bieten.

**Kritisch:** Das **Roh-Transkript wird NICHT vor der KI-Analyse gesichert** — es lebt im Komponenten-State, persistiert erst beim expliziten Speichern (nach der Auswertung). Tab-Verlust = Transkript weg. Das ist exakt Rosebuds meistkritisierter Fehler. **Billigster High-Value-Fix.**

## 4.4 Safety — gut für Indie, aber Regex

Krisen-Gate läuft **vor** dem Claude-Call und vor dem API-Key-Check (deterministische Krisenantwort, zweistufig acute/concern). Disziplinierter als viele finanzierte Apps. **Aber:** Stichwort-/Regex-basiert — Krisen ohne Schlüsselwort rutschen durch; die Grübel-Phrasenliste ist brittle. Als Netz okay, als Verlass für ein öffentliches Produkt zu dünn. Notfall-Ressourcen (112, TelefonSeelsorge) eingebettet.

## 4.5 Mehrnutzer-Readiness & die Privacy-Korrektur

**Bestätigt: nicht mehrnutzerfähig, keine PWA, nicht installierbar.** Kein Login, kein Manifest, kein Service-Worker, In-Memory-Rate-Limit pro Lambda.

**Die Privacy-Präzisierung (wichtig):** Local-first ist real — alle Inhalte in IndexedDB, Server stateless. ABER bei aktivem Sync gehen die Inhalte als **Klartext-JSON in Supabase-Postgres**, ohne E2E/At-Rest-App-Verschlüsselung, server-seitig mit **Service-Role-Key der RLS umgeht**, in eine **gemeinsame Tabelle ohne Nutzer-Trennung**. Für den Einzelnutzer okay. Als *öffentliches* „privacy-first"-Versprechen erst tragbar nach: E2E-Verschlüsselung der Sync-Inhalte + echte Nutzer-Isolation (Supabase Auth/RLS statt Service-Role).

**Was für Mehrnutzer-Betrieb fehlt (= Test-Phasen-Gate):** Auth/Konten · Mandantentrennung (`user_id` + RLS) · Abrechnung/Limits pro Nutzer · verteiltes Rate-Limit · DSGVO-Reife (Einwilligung/AVV/Lösch-/Export-Recht) · PWA/Installierbarkeit · idealerweise E2E.

## 4.6 Kostenökonomie — ungemodellt

Opus für tiefe Reflexion + ElevenLabs pro Nutzer; der Zielnutzer (Vielschreiber um 2 Uhr) ist ausgerechnet der teuerste. Bei €10/Monat pro intensivem Nutzer potenziell defizitär. Kein Per-User-Metering heute. Vor der Produktphase durchrechnen.

## 4.7 Feature-Gap-Tabelle

| Dimension | Innerline | Rosebud | Loop Mind | Headspace Ebb |
|---|---|---|---|---|
| KI-Reflexion / Spiegeln | ✅ strukturiert | ✅ | ✅ (nur Spiegel) | ✅ |
| Loop-Breaking (spezifisch) | ✅✅ Umschalt-Logik | ~ | ✅ | ~ |
| Anti-Sycophancy explizit | ✅✅ | ~ | ✅ | ~ |
| Voice-Dialog (durchgehend) | ❌ turn-basiert | ✅ | ✅ | ✅ |
| Memory-Recall im Gespräch | ❌ (Chat: keiner) | ✅ Long-Term | ✅ | ✅ enhanced |
| Semantische Suche | ❌ | ✅ (wahrsch.) | ? | ✅ |
| Muster + Nutzer-Bestätigung | ✅✅ | ~ | ~ | ❌ |
| Krisen-Gate vor KI-Call | ✅ | ~ | ~ | ✅ |
| Deutsch nativ | ✅ | teilw. | ❌ | ❌ |
| Local-first by default | ✅ | ❌ | ❌ | ❌ |
| E2E / Nutzer-Isolation (Cloud) | ❌ offen | ~ (Auth ja) | ~ | ~ |
| Mehrnutzer / Auth | ❌ | ✅ | ✅ | ✅ |
| PWA / mobil installierbar | ❌ Web | ✅ | ✅ | ✅ |
| Therapeuten-Handoff | ⏳ Konzept (Teil 5) | ~ („assist") | ❌ | ❌ |
| Klinische Validierung | ❌ | teilw. behauptet | ❌ | ✅ (70+ Studien) |

---

# Teil 5 — Feature-Konzept: Brücke zur Versorgung (Therapeuten-Zusammenfassung)

## 5.1 Was die Idee leistet

Sie macht aus der Leitplanke „kein Therapie-Ersatz" ein **sichtbares Feature statt nur einen Disclaimer-Satz**. Ein Disclaimer *behauptet* „wir ersetzen keine Therapie". Dieses Feature *zeigt* „wir führen besser in die Therapie hinein". Das ist die regulatorisch sichere Positionierung: ein Werkzeug, das *in* die professionelle Versorgung einspeist, nicht *statt* ihrer. Markt-validiert (Elomia hat ein Therapeuten-Export-Feature; Rosebud positioniert sich als „therapy assist").

**Zweitnutzen, oft unterschätzt:** Die Zusammenfassung hilft nicht nur dem Profi (weniger Fragerunden), sondern auch der Person, *vorbereitet und mit Klarheit* in die Sitzung zu gehen. Das ist exakt der Markenkern „wissen, wo man steht".

## 5.2 Die entscheidende Linie: deskriptiv, nicht präskriptiv

Die Zusammenfassung liefert einen **IST-Zustand** (Beobachtung), aber **keinen therapeutischen Ansatz und keine Quasi-Diagnose**.

- **Richtig (deskriptiv):** „Wiederkehrendes Thema: Verlustangst nach Kontaktabbruch. Stimmung über 4 Wochen fallend, zwei Grübel-Episoden mit hoher Aktivierung. Was geholfen hat: Bewegung, Schreiben vor dem Senden."
- **Falsch (präskriptiv):** „Empfohlener Ansatz: Schematherapie / Arbeit am Verlassenheitsschema."

Sobald die App einen Ansatz vorschlägt, kippt sie in die Rolle, die sie vermeiden will. Die App liefert **Rohmaterial und Anknüpfungspunkt**, die fachliche Richtung bestimmt der Mensch im Raum.

## 5.3 Was reingehört (fast geschenkt mit dem Datenmodell)

- **Zeitraum + IST-Zustand:** Stimmungs-/Intensitäts-/Energie-Tendenz (`entries`, `energyLevels`)
- **Wiederkehrende Themen, Emotionen, Bedürfnisse darunter** (`topics`, Aggregate, `patternSummaries`)
- **Erkannte Muster — nur die `userConfirmed`** aus `patternInsights` (bestätigte Selbstbeobachtung, keine KI-Spekulation)
- **Offene Schleifen + offene Entscheidungen** (`openLoops`, `decisions`) — buchstäblich Gesprächsanlässe
- **Was reguliert hat** (`helpfulRegulationStrategies`, `groundingActionsThatWorked`, `stabilityMoments`)
- **Krisensignale im Zeitraum**, falls `crisisFlag` gefeuert hat — sichtbar machen
- **1–3 Beispiel-Einträge, die die Person mitnehmen will** + Freitextfeld „Das möchte ich ansprechen"

Über den bestehenden Markdown-/PDF-Export ist das Ausgabeformat schon da — eher Aggregation als Neubau.

## 5.4 Wording-Bausteine (Entwurf, einsetzbar)

**A) In-App-Einleitung vor dem Erstellen:**

> Du kannst dir eine Zusammenfassung herausspeichern — für dich selbst oder zum Mitnehmen zu deiner Therapeutin oder deinem Therapeuten. Sie bündelt, was sich in einem Zeitraum gezeigt hat: Themen, Stimmungstendenz, von dir bestätigte Muster, offene Punkte und was dir geholfen hat. Du siehst alles vorher und kannst es kürzen oder ändern, bevor du es speicherst. Es ist eine Beobachtung als Ausgangspunkt — keine Diagnose, und sie ersetzt kein Gespräch mit einer Fachperson.

**B) Disclaimer-Block, der AUF dem Export steht (reist mit dem Dokument):**

> Diese Zusammenfassung wurde von der nutzenden Person mit einem KI-gestützten Journal-Begleiter erstellt. Sie beschreibt Beobachtungen und wiederkehrende Themen aus den eigenen Tagebucheinträgen über einen selbst gewählten Zeitraum. Sie ist eine Gesprächs- und Orientierungshilfe — keine therapeutische Feststellung, keine Diagnose und kein Ersatz für die Einschätzung von Fachpersonal. KI kann Muster falsch gewichten oder Wichtiges übersehen. Es handelt sich um einen von der Person selbst freigegebenen Ausschnitt, nicht um ein vollständiges Bild. Maßgeblich bleibt das fachliche Urteil im Gespräch.

**C) Rahmungs-Satz für die behandelnde Person (Kopf des Dokuments):**

> Hinweis für die behandelnde Person: Die folgenden Punkte sind die von der Klientin / vom Klienten selbst geführte und freigegebene Beobachtung, vom Tool geordnet — als Anknüpfungspunkt gedacht, nicht als Befund.

## 5.5 Nüchterne Vorbehalte

- **Kein juristischer Schutzschild.** Die „kein Therapie-Ersatz"-Absicherung ruht weiter auf Disclaimer + keine Diagnose + Krisenhandling + keinen Heilversprechen im Marketing. Das Feature verstärkt die Erzählung, ersetzt die anderen Bausteine nicht.
- **Nutzer-initiiert, lokal, editierbar.** Sensible Daten verlassen das Gerät — daher: bewusst von der Person ausgelöst, als Datei zum Selber-Weitergeben (nicht automatisch versendet), vor dem Export kürz- und änderbar. Pflicht, nicht optional.
- **Keine Vollständigkeit suggerieren.** Es ist ein Ausschnitt, kein „hier ist alles über mich".

---

# Teil 6 — Empfohlene nächste Schritte (phasenweise)

## Phase Privat (jetzt) — die App für dich fertig bauen

Nach Wirkung/Aufwand priorisiert:

1. **Roh-Transkript sofort lokal sichern**, bevor die KI-Analyse läuft. Klein, behebt ein echtes Verlustrisiko. *Sofort.*
2. **In-Conversation-Recall ausbauen.** Mindestens das Muster-Summary auch in den Chat geben; mittelfristig semantische Auswahl. Größter Erlebnis-Hebel.
3. **Begleiter eng an der Voice DNA halten.** Qualitäts-Messlatte und Moat.
4. **Flüssigen Sprachdialog prüfen** — entspricht der ursprünglichen Vision „drauflos sprechen".
5. **Kontaktimpuls-Regulation als Hero-Funktion schärfen.**
6. **Therapeuten-Zusammenfassung als Aggregations-Feature umsetzen** (Teil 5) — günstig, stark auf Positionierung einzahlend.
7. **Loop Mind & Ebb selbst durchspielen.**

## Phase Test (später) — Tor: „Würde ich es vermissen, wenn es weg wäre?"

- **Mehrnutzer-Fähigkeit herstellen** (Teil 4.5): Auth, Nutzer-Isolation/RLS, **E2E-Verschlüsselung des Sync**, Abrechnung/Limits, DSGVO-Reife, PWA. Erst hier wird die „privacy-first"-Aussage öffentlich tragbar — und erst hier wird ein Tester-/Pitch-Dokument sinnvoll.
- **Warme Testgruppe aus Vronis Zielgruppe** — Menschen, die das Problem *tatsächlich* haben.
- **Auf Verhalten schauen, nicht auf Komplimente.** Kommen sie unaufgefordert wieder?

## Phase Produkt (Tor-Entscheidungen — bewusst offen)

- Pricing festzurren + **Kostenökonomie durchrechnen** (Teil 4.6).
- DACH-first vs. international.
- „Innerline als Dachmarke?" (Teil 3.6).
- Trust-Signale/Validierung (ggf. DiGA-Pfad).

## Leitplanken — deine No-Gos als Assets

- **Privacy / local-first** → starker Vorteil *by architecture*; als öffentliches Versprechen erst mit E2E + Nutzer-Isolation tragbar (Teil 4.5). Bis dahin ehrlich kommunizieren: „lokal auf deinem Gerät", nicht „garantiert verschlüsselt in der Cloud".
- **Kein Therapie-Ersatz** → richtige Seite der regulatorischen Linie; durch die Therapeuten-Zusammenfassung (Teil 5) jetzt sichtbar verstärkt, deskriptiv gehalten.
- **Keine Manipulation** → kontert die Sycophancy-Falle. Im Prompt verifiziert. Werte-Moat.

---

## Quellen (Auswahl, Stand Juni 2026)

- Global Market Insights / Precedence Research / Global Growth Insights — Mental Health Apps Market
- Mordor Intelligence — AI-Powered Mental Health Solutions Market
- medRxiv (2025) — Voice-Enabled Generative AI for Mental Health
- App Store / Google Play: Rosebud, Loop Mind, Sonia, Reframe, Elomia
- Reflection.app — App-Vergleiche (Day One/Stoic/Daylio/Reflectly)
- Headspace / Business Wire — „Meet Ebb", Voice-Rollout (Dez. 2025)
- choosingtherapy.com, mymeditatemate.com — AI-Therapy-/Mental-Health-Vergleiche
- digitalsamba.com, hellobetter.de, ki-trainingszentrum.com — DACH/DiGA/DSGVO
- feelway.app — deutschsprachiger KI-Vergleich
- getstillmind.com, inthemoment.app — Privacy (Mozilla-Hinweis)
- bloomberry.ai, branding5.com, storyflow.so, ideaproof.io — Personal-Branding-Tools
- **INNERLINE_STATE_EXPORT** (interner technischer Code-Stand, 30.06.2026) — Grundlage für Teil 4

*Marktzahlen variieren je nach Analysehaus erheblich; als Größenordnung zu lesen.*

---

*Dokument erstellt mit Claude auf Basis der Recherche vom Juni 2026, der Vroni-/Innerline-Markenunterlagen und des technischen Code-Exports. Version 1.1.*
