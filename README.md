# Journal Companion

Ein ruhiges Tagebuch mit einem einfühlsamen KI-Begleiter (Claude), der dir beim
Reflektieren hilft – statt Ratschläge zu erteilen, spiegelt er behutsam und
stellt offene Fragen.

## Tech-Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Claude API** (`@anthropic-ai/sdk`, Modell `claude-opus-4-8`) mit Streaming

## Funktionen

- Tagebucheinträge schreiben, mit optionaler Stimmungs-Markierung
- Einträge bleiben **lokal im Browser** (localStorage) – nichts wird automatisch hochgeladen
- Auf Knopfdruck eine einfühlsame **Reflexion** vom Begleiter (Text wird live gestreamt)

## Einrichtung

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. API-Key hinterlegen – `.env.local.example` nach `.env.local` kopieren und
   deinen Schlüssel von <https://console.anthropic.com/> eintragen:

   ```bash
   cp .env.local.example .env.local
   # ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Entwicklungsserver starten:

   ```bash
   npm run dev
   ```

   Dann <http://localhost:3000> öffnen.

## Datenschutz

Einträge werden ausschließlich lokal im Browser gespeichert. Nur wenn du die
Reflexion anforderst, wird der jeweilige Eintrag an die Claude-API gesendet.

## Projektstruktur

```
app/
  layout.tsx            Grundlayout + Metadaten
  page.tsx              Journal-UI (Editor, Einträge, Reflexion)
  globals.css           Theme & Styles (Tailwind v4)
  api/reflect/route.ts  Server-Route, ruft Claude (Streaming) auf
lib/
  journal.ts            Typen + localStorage-Logik
```
