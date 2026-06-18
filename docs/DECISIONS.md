# Technische Entscheidungen (ADR-kurz)

Kurzbegründungen der wichtigsten Architektur-Entscheidungen. Neue Entscheidungen
unten anhängen.

## Stack

- **Vite statt Next.js** — Die App ist eine lokale, single-user SPA mit dünnem
  Backend. Vite bietet eine klare Frontend/Backend-Trennung, schnellen Dev-Server
  und ein sauberes Fundament für spätere Schritte (Tauri-Desktop, lokaler Ollama).
  Next.js hätte Routing/SSR-Ballast gebracht, den wir nicht brauchen.
- **React + TypeScript** — Verbreitet, gut lernbar, typsicher; Datenmodelle und
  API-Verträge leben typsicher im `shared`-Workspace.
- **Express-Backend** — Minimaler, gut verständlicher Claude-Proxy. Natürlicher Ort
  für Sicherheits-Gate, 3-Ebenen-Kontextaufbau und den späteren Ollama-Umschalter.
- **Dexie / IndexedDB** — Lokale, strukturierte Speicherung größerer Mengen
  (Einträge, Chats, Muster) — robuster als localStorage, ohne Cloud/Login.

## Sicherheit & Datenschutz

- **Kein API-Key im Frontend** — Der `ANTHROPIC_API_KEY` liegt ausschließlich in
  `server/.env`. Er steht nie in `AppSettings`, localStorage, IndexedDB oder
  Client-Code. Das Frontend ruft nur das eigene Backend; das Backend ruft Claude.
  Fehlt der Key, erklärt die App das freundlich.
- **Krisenlogik deterministisch** — Bei erkannten Krisenhinweisen erzeugt die App
  KEINE normale Claude-Antwort, sondern eine feste Sicherheitsantwort (kein
  Claude-Call), setzt `crisisFlag`, und verweist auf echte Hilfe (akute Gefahr: 112,
  TelefonSeelsorge 0800 111 0 111). Grund: ein generatives Modell könnte eine Krise
  „weg-coachen"; eine feste Antwort ist verlässlich. Die Erkennung ist eine
  Heuristik (Sicherheitsnetz), kein verlässlicher Detektor — im Code so markiert.

## Modell & KI

- **Sonnet als Standard, Opus optional** — `claude-sonnet-4-6` reicht für die
  meisten Funktionen und ist kosteneffizient. `claude-opus-4-8` nur als bewusst
  aktivierter High-Quality-Modus (tiefe Auswertungen, lange Musteranalysen).
- **Keine Sampling-Parameter** — Bei Opus 4.8 werden `temperature`/`top_p`/`top_k`
  nicht gesetzt (würden ohnehin abgelehnt). Steuerung des Antwortverhaltens über
  Systemprompt, Response-Style, Antwortlänge, App-Modus, `max_tokens` und klare
  Promptstruktur.
- **Latenz-Tuning (Geschwindigkeit)** — Standardmodell (Sonnet) antwortet ohne
  adaptives Thinking und mit niedrigerer `effort`-Stufe → erstes Byte in ~2s statt
  langer „Denk"-Pause. Grübel-/Struktur-Antworten bewusst flott (`effort: low`).
  Der **High-Quality-Modus (Opus)** schaltet Thinking + höhere `effort` zu
  (gründlicher, langsamer). Steuerung zentral in `services/claude.ts` (`tuningFor`).
- **Streaming nur für Reflexion & Chat** — `/api/reflect` und `/api/chat` streamen
  (natürlichere UX). `/api/contact-impulse` (saubere strukturierte Empfehlung) und
  `/api/weekly-review` (vollständige, stabile Antwort) liefern im MVP nicht-streamend.
- **3-Ebenen-Kontext** — An Claude gehen: (1) aktueller Eintrag, (2) kurzer Digest
  der letzten relevanten Einträge, (3) gespeicherte `PatternSummary`. Nie der ganze
  Verlauf — spart Kosten, schärft den Fokus, vermeidet überlange Prompts.

## Produkt & UX

- **Intent-gesteuerter Start** — Startscreen „Was brauchst du gerade?" wählt den
  Modus/die Promptstruktur (z.B. „Ich hänge in einer Schleife" → Grübelmodus,
  „Ich will ihm schreiben" → Kontaktimpuls). Der Intent fließt als Anliegen-Hinweis
  in den Prompt.
- **Aktivierungs-sensibel** — Die KI schätzt intern ein (Klarheit/Beruhigung/
  Kontrolle/Grübel) und antwortet bei hoher Aktivierung kürzer, konkreter,
  regulierender — statt weiter zu analysieren.
- **Abschluss statt Endlosschleife** — Nach Reflexion/Grübelmodus bietet die App
  aktiv einen Session-Abschluss an (kleiner körperlicher Schritt, was heute nicht
  entschieden werden muss). Ziel: Selbstregulation, nicht endloses Weiterreden.
- **Gentle Gamification (statt Verzicht)** — Erlaubt sind leichte, warme
  Bestärkungen, die **Selbstführung** sichtbar machen: „stabile Momente"
  (sortiert-vor-handeln, Impuls gehalten, Schleife erkannt, Abschluss, …), ruhige
  Microcopy, sanfte Fortschrittsmarker. Belohnt wird bewusste Regulation — **nicht**
  App-Nutzung. Ausdrücklich vermieden: harte Streaks, Nutzungsdruck, Punkte, Level,
  App-Store-Badges, Leaderboards, Healing-/Prozent-Scores, Bestrafung bei
  Nicht-Nutzung. MVP: nur leicht vorbereitet (`StabilityMoment`-Datenstruktur +
  Microcopy nach Reflexionen + „stabiler Schritt erkannt"), keine Gamification-Engine.
- **Minimales Alltagstracking** (Schlaf/Bewegung/Draußen/Kiffen, optional) dient nur
  dazu, später in Mustern/Wochenrückblick Zusammenhänge sichtbar zu machen — kein
  Tracking-Zwang, keine Auswertung „von außen".
