import { describe, it, expect } from "vitest";
import type { EntryDigest, JournalEntry, PatternSummary } from "@journal/shared";
import {
  buildChatSystem,
  buildConversationSummaryUser,
  CONVERSATION_SUMMARY_SYSTEM,
} from "./builders";

function entry(text = "Heute war viel los."): JournalEntry {
  return {
    id: "e1",
    createdAt: "2026-06-30T10:00:00.000Z",
    updatedAt: "2026-06-30T10:00:00.000Z",
    text,
    mood: 5,
    intensity: 6,
    emotions: ["Unruhe"],
    bodySignals: [],
    topics: ["Arbeit"],
    needs: [],
    impulse: "",
    intention: [],
    aiReflection: null,
    crisisFlag: false,
    ruminationFlag: false,
  };
}

function pattern(): PatternSummary {
  return {
    id: "p1",
    createdAt: "2026-06-20T10:00:00.000Z",
    periodStart: "2026-06-13T00:00:00.000Z",
    periodEnd: "2026-06-20T00:00:00.000Z",
    summary: "Wiederkehrendes Ringen um Klarheit nach Kontaktabbruch.",
    recurringThemes: ["Trennung"],
    recurringNeeds: [],
    stabilizingActions: [],
    riskPatterns: [],
    personalContextNotes: [],
    helpfulRegulationStrategies: [],
    contactImpulsePatterns: [],
    helpfulSentences: [],
    unhelpfulThoughtLoops: [],
    groundingActionsThatWorked: [],
    contactDecisionsThatFeltGoodLater: [],
  };
}

function digest(): EntryDigest[] {
  return [
    {
      createdAt: "2026-06-28T09:00:00.000Z",
      mood: 4,
      intensity: 7,
      topics: ["Trennung"],
      emotions: ["Trauer"],
      needs: [],
      impulse: "",
      excerpt: "Wieder an die Nachricht gedacht.",
    },
  ];
}

describe("buildChatSystem — Recall-Hintergrund", () => {
  it("bettet Muster-Summary + Digest als Hintergrundwissen ein und rahmt es behutsam", () => {
    const sys = buildChatSystem({
      style: "klar",
      entry: entry(),
      pattern: pattern(),
      recentDigest: digest(),
    });
    // Behutsame Rahmung vorhanden …
    expect(sys).toContain("Resonanzboden");
    // … Muster-Summary und Digest-Auszug eingebettet …
    expect(sys).toContain("Wiederkehrendes Ringen um Klarheit");
    expect(sys).toContain("Wieder an die Nachricht gedacht.");
    // … und der aktuelle Eintrag bleibt enthalten (Fokus).
    expect(sys).toContain("Heute war viel los.");
  });

  it("ohne Hintergrundwissen keine Recall-Rahmung (Verhalten wie bisher)", () => {
    const sys = buildChatSystem({ style: "klar", entry: entry() });
    expect(sys).not.toContain("Resonanzboden");
    expect(sys).toContain("Heute war viel los.");
  });

  it("nutzt die vorhandene conversationSummary im Prompt", () => {
    const sys = buildChatSystem({
      style: "klar",
      entry: entry(),
      conversationSummary: "Ging um Abgrenzung bei der Arbeit; offen: erstes Nein.",
    });
    expect(sys).toContain("Bisheriges Gespräch (Zusammenfassung)");
    expect(sys).toContain("offen: erstes Nein");
  });
});

describe("buildConversationSummaryUser — laufende Verdichtung", () => {
  const base = {
    entry: {
      text: "Heute war viel los.",
      topics: ["Arbeit"],
      emotions: ["Unruhe"],
      needs: ["Ruhe"],
    },
    messages: [
      { role: "user" as const, content: "Ich komme nicht zur Ruhe." },
      { role: "assistant" as const, content: "Was raubt dir gerade die Ruhe?" },
    ],
  };

  it("bettet Erdung, Verlauf und die Aufforderung zur Verdichtung ein", () => {
    const user = buildConversationSummaryUser(base);
    expect(user).toContain("Worum es im Eintrag geht");
    expect(user).toContain("Person: Ich komme nicht zur Ruhe.");
    expect(user).toContain("Begleiter: Was raubt dir gerade die Ruhe?");
    expect(user).not.toContain("Bisherige Zusammenfassung");
  });

  it("schreibt eine vorhandene Zusammenfassung fort, wenn übergeben", () => {
    const user = buildConversationSummaryUser({
      ...base,
      previousSummary: "Bisher ging es um Überforderung.",
    });
    expect(user).toContain("Bisherige Zusammenfassung (fortschreiben)");
    expect(user).toContain("Bisher ging es um Überforderung.");
  });

  it("das System bleibt strikt deskriptiv (kein Ratschlag)", () => {
    expect(CONVERSATION_SUMMARY_SYSTEM).toContain("deskriptiv");
    expect(CONVERSATION_SUMMARY_SYSTEM).toContain("Keine Ratschläge");
  });
});
