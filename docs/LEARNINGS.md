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
