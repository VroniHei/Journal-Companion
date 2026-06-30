import type {
  Decision,
  EnergyLevel,
  JournalEntry,
  OpenLoop,
  PatternInsight,
  PatternSummary,
  StabilityMoment,
} from "@journal/shared";
import { downloadTextFile } from "./export";

// „Brücke zur Versorgung": eine nutzer-initiierte, editierbare Zusammenfassung
// (Markdown + Druck/PDF). STRIKT DESKRIPTIV — Beobachtung, nie Vorschlag/Diagnose/
// Therapieform. Alles wird REIN LOKAL aus den bestehenden Stores aggregiert
// (KI-frei). Nur von der Person BESTÄTIGTE Muster (userConfirmed) fließen ein.

const DAY = 86_400_000;

export type SummaryTimeframe = "7tage" | "30tage" | "alle";

// --- Verbatim-Textbausteine (nicht verändern; Teil 5 Strategiedokument) ----

/** [A] In-App-Einleitung vor dem Erstellen (wird NICHT exportiert). */
export const SUMMARY_INTRO =
  "Du kannst dir eine Zusammenfassung herausspeichern — für dich selbst oder zum Mitnehmen zu deiner Therapeutin oder deinem Therapeuten. Sie bündelt, was sich in einem Zeitraum gezeigt hat: Themen, Stimmungstendenz, von dir bestätigte Muster, offene Punkte und was dir geholfen hat. Du siehst alles vorher und kannst es kürzen oder ändern, bevor du es speicherst. Es ist eine Beobachtung als Ausgangspunkt — keine Diagnose, und sie ersetzt kein Gespräch mit einer Fachperson.";

/** [B] Disclaimer-Block (steht oben auf dem Export, reist mit dem Dokument). */
export const SUMMARY_DISCLAIMER =
  "Diese Zusammenfassung wurde von der nutzenden Person mit einem KI-gestützten Journal-Begleiter erstellt. Sie beschreibt Beobachtungen und wiederkehrende Themen aus den eigenen Tagebucheinträgen über einen selbst gewählten Zeitraum. Sie ist eine Gesprächs- und Orientierungshilfe — keine therapeutische Feststellung, keine Diagnose und kein Ersatz für die Einschätzung von Fachpersonal. KI kann Muster falsch gewichten oder Wichtiges übersehen. Es handelt sich um einen von der Person selbst freigegebenen Ausschnitt, nicht um ein vollständiges Bild. Maßgeblich bleibt das fachliche Urteil im Gespräch.";

/** [C] Rahmungssatz für die behandelnde Person (Kopf des Dokuments). */
export const SUMMARY_FRAMING =
  "Hinweis für die behandelnde Person: Die folgenden Punkte sind die von der Klientin / vom Klienten selbst geführte und freigegebene Beobachtung, vom Tool geordnet — als Anknüpfungspunkt gedacht, nicht als Befund.";

// --- Aggregation -----------------------------------------------------------

export interface SummaryInputs {
  entries: JournalEntry[];
  energyLevels: EnergyLevel[];
  patternInsights: PatternInsight[];
  patternSummary: PatternSummary | null; // neuestes
  openLoops: OpenLoop[];
  decisions: Decision[];
  stabilityMoments: StabilityMoment[];
}

export interface SummarySection {
  id: string;
  title: string;
  /** Mehrzeiliger, editierbarer Text (Markdown-Zeilen). */
  body: string;
}

export interface ExampleCandidate {
  id: string;
  label: string;
  excerpt: string;
}

export interface SummaryResult {
  periodLabel: string;
  sections: SummarySection[];
  exampleCandidates: ExampleCandidate[];
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function tally(lists: string[][], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const list of lists)
    for (const v of list) {
      const k = v.trim();
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function cutoffFor(tf: SummaryTimeframe, now: number): number | null {
  if (tf === "7tage") return now - 7 * DAY;
  if (tf === "30tage") return now - 30 * DAY;
  return null;
}

function periodLabel(tf: SummaryTimeframe): string {
  if (tf === "7tage") return "Letzte 7 Tage";
  if (tf === "30tage") return "Letzte 30 Tage";
  return "Gesamter Zeitraum";
}

const ENERGY_WORDS = ["", "sehr wenig", "niedrig", "mittel", "hoch", "voll"];

function trendWord(values: number[]): string {
  if (values.length < 4) return "stabil";
  const half = Math.floor(values.length / 2);
  const early = avg(values.slice(0, half));
  const late = avg(values.slice(half));
  if (early == null || late == null) return "stabil";
  if (late - early >= 0.8) return "steigend";
  if (early - late >= 0.8) return "fallend";
  return "stabil";
}

/**
 * Trägt rein lokal die deskriptiven Beobachtungen für den Zeitraum zusammen.
 * `now` ist injizierbar (Tests). Reihenfolge = chronologisch alt→neu für Trends.
 */
export function collectSummary(
  inputs: SummaryInputs,
  tf: SummaryTimeframe,
  now: number = Date.now(),
): SummaryResult {
  const cutoff = cutoffFor(tf, now);
  const inPeriod = (iso: string) => (cutoff == null ? true : new Date(iso).getTime() >= cutoff);

  const entries = inputs.entries
    .filter((e) => inPeriod(e.createdAt))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Tagesritual-Einträge sind keine echten Stimmungs-Einträge.
  const moodEntries = entries.filter((e) => e.startIntent !== "tagesritual");

  const sections: SummarySection[] = [];

  // 1) Stimmung & Anspannung
  const mood = avg(moodEntries.map((e) => e.mood));
  const intensity = avg(moodEntries.map((e) => e.intensity));
  if (mood != null || intensity != null) {
    const lines: string[] = [];
    if (mood != null)
      lines.push(
        `- Stimmung im Schnitt: ${mood}/10 (Tendenz: ${trendWord(moodEntries.map((e) => e.mood))}).`,
      );
    if (intensity != null)
      lines.push(`- Anspannung im Schnitt: ${intensity}/10.`);
    const energy = avg(
      inputs.energyLevels.filter((x) => inPeriod(x.date)).map((x) => x.level),
    );
    if (energy != null)
      lines.push(`- Energie im Schnitt: ${ENERGY_WORDS[Math.round(energy)] ?? "mittel"}.`);
    if (lines.length)
      sections.push({ id: "stimmung", title: "Stimmung & Anspannung", body: lines.join("\n") });
  }

  // 2) Wiederkehrende Themen / Emotionen / Bedürfnisse
  const topics = tally(entries.map((e) => e.topics));
  const emotions = tally(entries.map((e) => e.emotions));
  const needs = tally(entries.map((e) => e.needs));
  const recurringThemes = inputs.patternSummary?.recurringThemes ?? [];
  const recurringNeeds = inputs.patternSummary?.recurringNeeds ?? [];
  const themeList = [...new Set([...topics, ...recurringThemes])].slice(0, 8);
  const needList = [...new Set([...needs, ...recurringNeeds])].slice(0, 8);
  {
    const lines: string[] = [];
    if (themeList.length) lines.push(`- Themen: ${themeList.join(", ")}`);
    if (emotions.length) lines.push(`- Emotionen: ${emotions.join(", ")}`);
    if (needList.length) lines.push(`- Bedürfnisse: ${needList.join(", ")}`);
    if (lines.length)
      sections.push({
        id: "themen",
        title: "Wiederkehrende Themen, Emotionen, Bedürfnisse",
        body: lines.join("\n"),
      });
  }

  // 3) Von dir bestätigte Muster — NUR userConfirmed === true
  const confirmed = inputs.patternInsights.filter((p) => p.userConfirmed === true);
  if (confirmed.length) {
    const lines = confirmed.map((p) => {
      const desc = p.description?.trim() ? `: ${p.description.trim()}` : "";
      return `- ${p.title}${desc}`;
    });
    sections.push({
      id: "muster",
      title: "Von dir bestätigte Muster",
      body: lines.join("\n"),
    });
  }

  // 4) Offene Punkte (offene Schleifen + offene Entscheidungen)
  {
    const loops = inputs.openLoops.filter((l) => l.status === "offen").map((l) => l.title);
    const decs = inputs.decisions.filter((d) => d.status === "offen").map((d) => d.question);
    const lines: string[] = [];
    if (loops.length) lines.push(`- Offene Schleifen: ${loops.join("; ")}`);
    if (decs.length) lines.push(`- Offene Entscheidungen: ${decs.join("; ")}`);
    if (lines.length)
      sections.push({ id: "offen", title: "Offene Punkte", body: lines.join("\n") });
  }

  // 5) Was geholfen hat (Regulation/Grounding/stabile Momente)
  {
    const fromPattern = [
      ...(inputs.patternSummary?.helpfulRegulationStrategies ?? []),
      ...(inputs.patternSummary?.groundingActionsThatWorked ?? []),
    ];
    const moments = [
      ...new Set(
        inputs.stabilityMoments
          .filter((m) => inPeriod(m.createdAt))
          .map((m) => m.label.trim())
          .filter(Boolean),
      ),
    ].slice(0, 6);
    const helped = [...new Set([...fromPattern, ...moments])].filter(Boolean).slice(0, 8);
    if (helped.length)
      sections.push({
        id: "geholfen",
        title: "Was geholfen hat",
        body: helped.map((h) => `- ${h}`).join("\n"),
      });
  }

  // 6) Belastende Phasen — sachlich, mit Hilfe-Hinweis (Safety)
  const crisisDays = new Set(
    moodEntries.filter((e) => e.crisisFlag).map((e) => e.createdAt.slice(0, 10)),
  ).size;
  if (crisisDays > 0) {
    const tag = crisisDays === 1 ? "einem Tag" : `${crisisDays} Tagen`;
    sections.push({
      id: "krise",
      title: "Belastende Phasen",
      body:
        `- In diesem Zeitraum waren die Einträge an ${tag} sehr belastet.\n` +
        "- Falls es akut wird: Notruf 112, TelefonSeelsorge 0800 111 0 111 (kostenlos, rund um die Uhr).",
    });
  }

  // Beispiel-Einträge zur Auswahl (neueste zuerst, ohne Tagesritual).
  const exampleCandidates: ExampleCandidate[] = [...moodEntries]
    .reverse()
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      label: `${e.createdAt.slice(0, 10)}${e.title ? ` · ${e.title}` : ""}`,
      excerpt: e.text.length > 200 ? `${e.text.slice(0, 200)}…` : e.text,
    }));

  return { periodLabel: periodLabel(tf), sections, exampleCandidates };
}

// --- Render (Markdown + HTML für Druck/PDF) --------------------------------

export interface SummaryExportSection {
  title: string;
  body: string;
}

export interface SummaryExportModel {
  title: string;
  framing: string; // [C]
  disclaimer: string; // [B]
  sections: SummaryExportSection[];
}

export function summaryToMarkdown(m: SummaryExportModel): string {
  const parts: string[] = [`# ${m.title}`, "", `> ${m.framing}`, "", m.disclaimer, ""];
  for (const s of m.sections) {
    if (!s.body.trim()) continue;
    parts.push(`## ${s.title}`, "", s.body.trim(), "");
  }
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function summaryToHtml(m: SummaryExportModel): string {
  const blocks = m.sections
    .filter((s) => s.body.trim())
    .map(
      (s) =>
        `<h2>${esc(s.title)}</h2><div class="body">${esc(s.body.trim())}</div>`,
    )
    .join("\n");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(
    m.title,
  )}</title><style>
    body{font-family:Georgia,'Times New Roman',serif;color:#23221a;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6}
    h1{font-size:1.5rem;margin:0 0 .75rem}
    h2{font-size:1.05rem;margin:1.4rem 0 .4rem}
    .framing{font-style:italic;color:#5d4f3f;margin:0 0 1rem}
    .disclaimer{font-size:.85rem;color:#5d4f3f;background:#f4ebe0;border-radius:.5rem;padding:.75rem 1rem;margin:0 0 1.5rem}
    .body{white-space:pre-wrap}
    @media print{body{margin:0;max-width:none}}
  </style></head><body>
    <h1>${esc(m.title)}</h1>
    <p class="framing">${esc(m.framing)}</p>
    <p class="disclaimer">${esc(m.disclaimer)}</p>
    ${blocks}
  </body></html>`;
}

// --- Ausgabe (lokal) -------------------------------------------------------

export function downloadSummaryMarkdown(m: SummaryExportModel, dateStr: string): void {
  downloadTextFile(`innerline-zusammenfassung-${dateStr}.md`, summaryToMarkdown(m));
}

/**
 * Öffnet die Zusammenfassung in einem Druckfenster — die Person speichert sie über
 * den Druckdialog als PDF. Bewusst dependency-frei und lokal (kein PDF-Paket).
 */
export function printSummary(m: SummaryExportModel): void {
  const w = window.open("", "_blank", "noopener,noreferrer,width=820,height=1000");
  if (!w) return;
  w.document.write(summaryToHtml(m));
  w.document.close();
  w.focus();
  // Kurzer Tick, damit Layout/Schrift stehen, bevor der Druckdialog kommt.
  setTimeout(() => w.print(), 250);
}
