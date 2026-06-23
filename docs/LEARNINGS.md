# Learnings & Entscheidungen

Gesammelte Erkenntnisse, getroffene Entscheidungen und ihr Warum.
Eine Erkenntnis pro Punkt; veraltete Punkte korrigieren statt duplizieren.

---

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
