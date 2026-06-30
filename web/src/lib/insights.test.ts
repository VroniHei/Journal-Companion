import { describe, it, expect } from "vitest";
import type { JournalEntry } from "@journal/shared";
import {
  computeStreak,
  showcaseInsight,
  showcaseKeyword,
  showcaseSeed,
  wordsOfWeek,
} from "./insights";

// Minimaler, gültiger JournalEntry — Tests setzen nur die relevanten Felder.
let seq = 0;
function entry(partial: Partial<JournalEntry> = {}): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `t${seq++}`,
    createdAt: now,
    updatedAt: now,
    text: "",
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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("wordsOfWeek", () => {
  it("zählt und sortiert Themen/Gefühle/Bedürfnisse absteigend", () => {
    const es = [
      entry({ topics: ["Arbeit", "Ruhe"] }),
      entry({ topics: ["Arbeit", "Ruhe"] }),
      entry({ topics: ["Arbeit"], emotions: ["Trauer"] }),
    ];
    const w = wordsOfWeek(es);
    expect(w[0]).toEqual({ word: "Arbeit", count: 3 });
    expect(w.find((x) => x.word === "Ruhe")?.count).toBe(2);
  });

  it("filtert ganze Sätze / zu lange Begriffe heraus", () => {
    const es = [
      entry({
        needs: ["Ein ganzer Satz der hier nicht als Wort zählen darf"],
        topics: ["Ruhe"],
      }),
    ];
    expect(wordsOfWeek(es).map((x) => x.word)).toEqual(["Ruhe"]);
  });

  it("respektiert das max-Limit", () => {
    const es = [
      entry({ topics: ["a", "b", "c", "d", "e"] }),
    ];
    expect(wordsOfWeek(es, 3)).toHaveLength(3);
  });
});

describe("showcaseSeed", () => {
  it("ist stabil für dieselbe Datenlage und steigt mit jedem Eintrag", () => {
    const es = [entry(), entry()];
    expect(showcaseSeed(es)).toBe(showcaseSeed(es));
    expect(showcaseSeed([...es, entry()])).toBe(showcaseSeed(es) + 1);
  });
});

describe("showcaseKeyword", () => {
  it("ist deterministisch und eines der Top-Themen", () => {
    const es = [
      entry({ topics: ["Arbeit", "Ruhe"] }),
      entry({ topics: ["Arbeit"], emotions: ["Trauer"] }),
    ];
    const k = showcaseKeyword(es);
    expect(showcaseKeyword(es)).toBe(k);
    expect(wordsOfWeek(es, 4).map((w) => w.word)).toContain(k);
  });

  it("nutzt den Fallback ohne Daten", () => {
    expect(showcaseKeyword([], "Heute")).toBe("Heute");
  });
});

describe("showcaseInsight", () => {
  it("gibt null bei zu wenig Einträgen", () => {
    expect(showcaseInsight([entry()], 0)).toBeNull();
  });

  it("liefert einen Satz mit Kursiv-Akzent (*Wort*) bei genug Daten", () => {
    const es = [
      entry({ topics: ["Arbeit"] }),
      entry({ topics: ["Arbeit"] }),
      entry({ topics: ["Arbeit"] }),
    ];
    const out = showcaseInsight(es, 0);
    expect(typeof out).toBe("string");
    expect(out).toContain("*");
  });

  it("ändert die Ansage täglich, wenn genau zwei Aussagen zutreffen", () => {
    // Genau zwei Kandidaten: bester Wochentag (≥3 verschiedene Tage) + häufigstes
    // Wort. Früher wurden beide jeden Tag gemeinsam gezeigt → nie eine Änderung.
    const es = [
      entry({ createdAt: daysAgo(0), mood: 9, topics: ["Trennung"] }),
      entry({ createdAt: daysAgo(2), mood: 4, topics: ["Trennung"] }),
      entry({ createdAt: daysAgo(4), mood: 5, topics: ["Trennung"] }),
    ];
    // Zwei aufeinanderfolgende „Tage" (seed) müssen verschiedene Ansagen liefern.
    const day1 = showcaseInsight(es, 100);
    const day2 = showcaseInsight(es, 101);
    expect(day1).not.toBeNull();
    expect(day2).not.toBeNull();
    expect(day1).not.toBe(day2);
  });
});

describe("computeStreak", () => {
  it("ist 0 ohne Einträge", () => {
    expect(computeStreak([], [])).toBe(0);
  });

  it("zählt aufeinanderfolgende Tage", () => {
    const es = [
      entry({ createdAt: daysAgo(0) }),
      entry({ createdAt: daysAgo(1) }),
      entry({ createdAt: daysAgo(2) }),
    ];
    expect(computeStreak(es, [])).toBe(3);
  });

  it("schließt eine Lücke mit einem Pausentag", () => {
    const es = [entry({ createdAt: daysAgo(0) }), entry({ createdAt: daysAgo(2) })];
    const rest = [daysAgo(1).slice(0, 10)]; // YYYY-MM-DD
    expect(computeStreak(es, rest)).toBe(3);
  });
});
