import { describe, it, expect } from "vitest";
import type { JournalEntry } from "@journal/shared";
import { entryKind } from "./entryCard";

function makeEntry(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "e1",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
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
    ...over,
  };
}

describe("entryKind", () => {
  it("ist standardmäßig ein einfacher Eintrag", () => {
    expect(entryKind(makeEntry())).toBe("eintrag");
  });

  it("wird nach einer Reflexion zu „reflexion“", () => {
    expect(entryKind(makeEntry({ aiReflection: "…" }))).toBe("reflexion");
  });

  it("wird zu „gespraech“, sobald Chat-Nachrichten existieren (Flag)", () => {
    // Auch wenn schon eine Reflexion da ist: ein geführtes Gespräch gewinnt.
    expect(entryKind(makeEntry({ aiReflection: "…" }), true)).toBe("gespraech");
    expect(entryKind(makeEntry(), true)).toBe("gespraech");
  });

  it("erkennt „gespraech“ weiterhin über conversationSummary", () => {
    expect(entryKind(makeEntry({ conversationSummary: "Kurzfassung." }))).toBe(
      "gespraech",
    );
  });

  it("bleibt ein Tagesritual, auch mit Gespräch", () => {
    expect(
      entryKind(makeEntry({ startIntent: "tagesritual" }), true),
    ).toBe("ritual");
  });
});
