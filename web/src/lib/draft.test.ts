import { describe, it, expect, beforeEach } from "vitest";
import { readDraft, writeDraft, clearDraft } from "./draft";

// Minimaler localStorage-Stub (Vitest läuft hier ohne DOM/Browser).
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe("draft", () => {
  it("liest den Fallback, wenn kein Entwurf existiert", () => {
    expect(readDraft("voice", "")).toBe("");
    expect(readDraft("voice", "x")).toBe("x");
  });

  it("speichert und liest einen Entwurf zurück", () => {
    writeDraft("voice", "halber Satz");
    expect(readDraft("voice")).toBe("halber Satz");
  });

  it("entfernt den Entwurf bei leerem/whitespace-Text (kein Müll)", () => {
    writeDraft("voice", "etwas");
    writeDraft("voice", "   ");
    expect(readDraft("voice", "leer")).toBe("leer");
  });

  it("clearDraft löscht einen vorhandenen Entwurf", () => {
    writeDraft("voice", "etwas");
    clearDraft("voice");
    expect(readDraft("voice", "weg")).toBe("weg");
  });

  it("hält verschiedene Keys getrennt", () => {
    writeDraft("voice", "A");
    writeDraft("neu", "B");
    expect(readDraft("voice")).toBe("A");
    expect(readDraft("neu")).toBe("B");
  });
});
