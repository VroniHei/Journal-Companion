import { describe, it, expect } from "vitest";
import type { JournalEntry, PatternInsight } from "@journal/shared";
import {
  collectSummary,
  summaryToMarkdown,
  SUMMARY_DISCLAIMER,
  SUMMARY_FRAMING,
  type SummaryInputs,
} from "./summary";

const NOW = new Date("2026-06-30T12:00:00.000Z").getTime();
const DAY = 86_400_000;

function entry(partial: Partial<JournalEntry> = {}): JournalEntry {
  const at = new Date(NOW).toISOString();
  return {
    id: Math.random().toString(36).slice(2),
    createdAt: at,
    updatedAt: at,
    text: "Ein Eintrag.",
    mood: 5,
    intensity: 5,
    emotions: [],
    bodySignals: [],
    topics: [],
    needs: [],
    impulse: "",
    intention: [],
    aiReflection: null,
    crisisFlag: false,
    ruminationFlag: false,
    ...partial,
  };
}

function pattern(
  userConfirmed: boolean | null,
  title: string,
): PatternInsight {
  const at = new Date(NOW).toISOString();
  return {
    id: title,
    createdAt: at,
    updatedAt: at,
    title,
    description: "Beschreibung.",
    patternType: "rumination",
    confidence: "mittel",
    triggerSignals: [],
    typicalSequence: [],
    emotionalSignals: [],
    bodySignals: [],
    needsBehindIt: [],
    helpfulSide: "",
    difficultSide: "",
    earlyWarningSigns: [],
    interruptionStrategies: [],
    dontDoNow: [],
    exampleEntryIds: [],
    userConfirmed,
  };
}

function inputs(partial: Partial<SummaryInputs> = {}): SummaryInputs {
  return {
    entries: [],
    energyLevels: [],
    patternInsights: [],
    patternSummary: null,
    openLoops: [],
    decisions: [],
    stabilityMoments: [],
    ...partial,
  };
}

describe("collectSummary", () => {
  it("nimmt NUR bestätigte Muster auf (userConfirmed === true)", () => {
    const res = collectSummary(
      inputs({
        entries: [entry()],
        patternInsights: [
          pattern(true, "Bestätigtes Muster"),
          pattern(false, "Abgelehntes Muster"),
          pattern(null, "Unbeantwortetes Muster"),
        ],
      }),
      "alle",
      NOW,
    );
    const muster = res.sections.find((s) => s.id === "muster");
    expect(muster).toBeTruthy();
    expect(muster!.body).toContain("Bestätigtes Muster");
    expect(muster!.body).not.toContain("Abgelehntes Muster");
    expect(muster!.body).not.toContain("Unbeantwortetes Muster");
  });

  it("ohne bestätigte Muster gibt es keinen Muster-Abschnitt", () => {
    const res = collectSummary(
      inputs({ entries: [entry()], patternInsights: [pattern(false, "X")] }),
      "alle",
      NOW,
    );
    expect(res.sections.find((s) => s.id === "muster")).toBeUndefined();
  });

  it("vermerkt belastende Phasen sachlich mit Hilfe-Hinweis, wenn crisisFlag gefeuert hat", () => {
    const res = collectSummary(
      inputs({ entries: [entry({ crisisFlag: true })] }),
      "alle",
      NOW,
    );
    const krise = res.sections.find((s) => s.id === "krise");
    expect(krise).toBeTruthy();
    expect(krise!.body).toContain("0800 111 0 111");
  });

  it("ohne crisisFlag keinen Belastungs-Abschnitt", () => {
    const res = collectSummary(inputs({ entries: [entry()] }), "alle", NOW);
    expect(res.sections.find((s) => s.id === "krise")).toBeUndefined();
  });

  it("respektiert den Zeitraum (7 Tage schließt alte Einträge aus)", () => {
    const old = entry({ createdAt: new Date(NOW - 40 * DAY).toISOString(), topics: ["Alt"] });
    const recent = entry({ createdAt: new Date(NOW - 2 * DAY).toISOString(), topics: ["Neu"] });
    const res = collectSummary(inputs({ entries: [old, recent] }), "7tage", NOW);
    const themen = res.sections.find((s) => s.id === "themen");
    expect(themen?.body ?? "").toContain("Neu");
    expect(themen?.body ?? "").not.toContain("Alt");
  });
});

describe("summaryToMarkdown — Garantien", () => {
  const model = {
    title: "Zusammenfassung — Letzte 30 Tage",
    framing: SUMMARY_FRAMING,
    disclaimer: SUMMARY_DISCLAIMER,
    sections: [{ title: "Stimmung & Anspannung", body: "- Stimmung im Schnitt: 5/10." }],
  };

  it("enthält Rahmungssatz [C] und Disclaimer [B] sichtbar", () => {
    const md = summaryToMarkdown(model);
    expect(md).toContain(SUMMARY_FRAMING);
    expect(md).toContain(SUMMARY_DISCLAIMER);
  });

  it("enthält keine präskriptive Sprache (kein Ansatz/Therapieform)", () => {
    const md = summaryToMarkdown(model).toLowerCase();
    expect(md).not.toContain("empfohlener ansatz");
    expect(md).not.toContain("therapieform");
    expect(md).not.toContain("schematherapie");
  });
});
